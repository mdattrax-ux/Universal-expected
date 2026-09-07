/**
 * MASTER DEVELOPER SPECIFICATION
 * Section 17: Native Libraries (.SO) ELF Binary Parser
 * Parses Executable and Linkable Format (ELF) shared objects.
 */

import { ElfAnalysis } from '../types/analyzer';

export function parseElfBinary(bytes: Uint8Array, filename: string): ElfAnalysis {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // Validate ELF magic: 0x7F 'E' 'L' 'F'
  if (bytes[0] !== 0x7f || bytes[1] !== 0x45 || bytes[2] !== 0x4c || bytes[3] !== 0x46) {
    throw new Error('Not an ELF binary');
  }

  const is64Bit = bytes[4] === 2;
  const isLittleEndian = bytes[5] === 1;
  const osAbi = bytes[7];

  const abiNames: Record<number, string> = {
    0: 'System V',
    1: 'HP-UX',
    2: 'NetBSD',
    3: 'Linux / Android',
    6: 'Solaris',
    9: 'FreeBSD',
  };

  const eType = view.getUint16(16, isLittleEndian);
  const typeNames: Record<number, string> = {
    1: 'ET_REL (Relocatable)',
    2: 'ET_EXEC (Executable)',
    3: 'ET_DYN (Shared object / Dynamic library)',
    4: 'ET_CORE (Core dump)',
  };

  const eMachine = view.getUint16(18, isLittleEndian);
  const machineNames: Record<number, string> = {
    0x03: 'x86 (Intel 80386)',
    0x28: 'ARM 32-bit (armeabi-v7a)',
    0x3e: 'x86_64 (AMD64 / Intel 64)',
    0xb7: 'AArch64 / ARM 64-bit (arm64-v8a)',
    0xf3: 'RISC-V',
  };

  const machine = machineNames[eMachine] || `Architecture ID 0x${eMachine.toString(16)}`;
  const entryPoint = is64Bit
    ? `0x${view.getBigUint64(24, isLittleEndian).toString(16)}`
    : `0x${view.getUint32(24, isLittleEndian).toString(16)}`;

  // Parse Section Headers
  const shOff = is64Bit
    ? Number(view.getBigUint64(40, isLittleEndian))
    : view.getUint32(32, isLittleEndian);

  const shEntSize = view.getUint16(is64Bit ? 58 : 46, isLittleEndian);
  const shNum = view.getUint16(is64Bit ? 60 : 48, isLittleEndian);
  const shStrNdx = view.getUint16(is64Bit ? 62 : 50, isLittleEndian);

  const sections: ElfAnalysis['sections'] = [];
  const dependencies: string[] = [];
  const exportedSymbols: string[] = [];
  const importedSymbols: string[] = [];

  // Read Section Header String Table (.shstrtab)
  let shstrtabBytes = new Uint8Array();
  if (shStrNdx < shNum && shOff + shStrNdx * shEntSize < bytes.byteLength) {
    const tableHeaderOff = shOff + shStrNdx * shEntSize;
    const strTabOff = is64Bit
      ? Number(view.getBigUint64(tableHeaderOff + 24, isLittleEndian))
      : view.getUint32(tableHeaderOff + 16, isLittleEndian);
    const strTabSize = is64Bit
      ? Number(view.getBigUint64(tableHeaderOff + 32, isLittleEndian))
      : view.getUint32(tableHeaderOff + 20, isLittleEndian);

    if (strTabOff + strTabSize <= bytes.byteLength) {
      shstrtabBytes = bytes.slice(strTabOff, strTabOff + strTabSize);
    }
  }

  const getSectionName = (offset: number): string => {
    if (offset >= shstrtabBytes.length) return '';
    let name = '';
    for (let i = offset; i < shstrtabBytes.length; i++) {
      if (shstrtabBytes[i] === 0) break;
      name += String.fromCharCode(shstrtabBytes[i]);
    }
    return name;
  };

  // Section type mappings
  const shtTypes: Record<number, string> = {
    0: 'SHT_NULL',
    1: 'SHT_PROGBITS',
    2: 'SHT_SYMTAB',
    3: 'SHT_STRTAB',
    4: 'SHT_RELA',
    5: 'SHT_HASH',
    6: 'SHT_DYNAMIC',
    7: 'SHT_NOTE',
    8: 'SHT_NOBITS',
    9: 'SHT_REL',
    11: 'SHT_DYNSYM',
  };

  try {
    for (let i = 0; i < Math.min(shNum, 128); i++) {
      const entryOff = shOff + i * shEntSize;
      if (entryOff + shEntSize > bytes.byteLength) break;

      const nameOffset = view.getUint32(entryOff, isLittleEndian);
      const typeNum = view.getUint32(entryOff + 4, isLittleEndian);
      const address = is64Bit
        ? `0x${view.getBigUint64(entryOff + 16, isLittleEndian).toString(16)}`
        : `0x${view.getUint32(entryOff + 12, isLittleEndian).toString(16)}`;
      const size = is64Bit
        ? Number(view.getBigUint64(entryOff + 32, isLittleEndian))
        : view.getUint32(entryOff + 20, isLittleEndian);

      const secName = getSectionName(nameOffset) || `sec_${i}`;
      sections.push({
        name: secName,
        type: shtTypes[typeNum] || `TYPE_${typeNum}`,
        address,
        size,
      });
    }
  } catch (e) {
    console.warn('ELF sections reading warning:', e);
  }

  // Extract strings & symbols from binary bytes
  const stringsSummary: string[] = [];
  let curStr = '';
  for (let i = 0; i < bytes.length; i++) {
    const c = bytes[i];
    if (c >= 32 && c <= 126) {
      curStr += String.fromCharCode(c);
    } else {
      if (curStr.length >= 4) {
        // Detect shared library dependencies (.so)
        if (curStr.endsWith('.so') && !dependencies.includes(curStr)) {
          dependencies.push(curStr);
        }
        // Detect JNI export functions (Java_...)
        if (curStr.startsWith('Java_') || curStr === 'JNI_OnLoad' || curStr === 'JNI_OnUnload') {
          if (!exportedSymbols.includes(curStr)) {
            exportedSymbols.push(curStr);
          }
        }
        // Detect common C runtime imports
        if (
          ['__android_log_print', 'malloc', 'free', 'memcpy', 'memset', 'pthread_create'].includes(
            curStr
          )
        ) {
          if (!importedSymbols.includes(curStr)) {
            importedSymbols.push(curStr);
          }
        }
        if (stringsSummary.length < 50 && curStr.length > 5) {
          stringsSummary.push(curStr);
        }
      }
      curStr = '';
    }
  }

  return {
    header: {
      classBits: is64Bit ? '64-bit' : '32-bit',
      dataEndian: isLittleEndian ? 'Little Endian' : 'Big Endian',
      version: bytes[6],
      abi: abiNames[osAbi] || `ABI ${osAbi}`,
      type: typeNames[eType] || `Type 0x${eType.toString(16)}`,
      machine,
      entryPoint,
    },
    sections,
    dependencies,
    exportedSymbols,
    importedSymbols,
    stringsSummary,
  };
}

export function formatElfAnalysisText(elf: ElfAnalysis, filename: string): string {
  const lines: string[] = [
    `// ============================================================================`,
    `// ELF NATIVE SHARED OBJECT (.SO) STRUCTURAL REPORT`,
    `// Binary File: ${filename}`,
    `// ============================================================================`,
    ``,
    `[ELF HEADER METADATA]`,
    `Architecture:           ${elf.header.machine}`,
    `Word Size:              ${elf.header.classBits}`,
    `Endianness:             ${elf.header.dataEndian}`,
    `Target OS / ABI:        ${elf.header.abi}`,
    `Object Type:            ${elf.header.type}`,
    `Virtual Entry Point:    ${elf.header.entryPoint}`,
    ``,
    `// ============================================================================`,
    `// DYNAMIC DEPENDENCIES (DT_NEEDED)`,
    `// ============================================================================`,
  ];

  if (elf.dependencies.length === 0) {
    lines.push(`// None or statically linked`);
  } else {
    for (const dep of elf.dependencies) {
      lines.push(`DT_NEEDED: ${dep}`);
    }
  }

  lines.push('');
  lines.push(`// ============================================================================`);
  lines.push(`// EXPORTED JNI SYMBOLS`);
  lines.push(`// ============================================================================`);
  if (elf.exportedSymbols.length === 0) {
    lines.push(`// No explicit Java_* JNI entrypoints detected (binary may be internal/helper)`);
  } else {
    for (const sym of elf.exportedSymbols) {
      lines.push(`[EXPORT] ${sym}`);
    }
  }

  lines.push('');
  lines.push(`// ============================================================================`);
  lines.push(`// IMPORTED RUNTIME SYMBOLS`);
  lines.push(`// ============================================================================`);
  for (const sym of elf.importedSymbols) {
    lines.push(`[IMPORT] ${sym}`);
  }

  lines.push('');
  lines.push(`// ============================================================================`);
  lines.push(`// ELF SECTIONS TABLE (${elf.sections.length} sections)`);
  lines.push(`// ============================================================================`);
  lines.push(`Name                Type             Address      Size`);
  lines.push(`---------------------------------------------------------------`);
  for (const s of elf.sections) {
    const namePad = s.name.padEnd(20, ' ');
    const typePad = s.type.padEnd(16, ' ');
    const addrPad = s.address.padEnd(12, ' ');
    lines.push(`${namePad}${typePad}${addrPad}${s.size} bytes`);
  }

  return lines.join('\n');
}
