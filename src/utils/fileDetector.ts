/**
 * MASTER DEVELOPER SPECIFICATION
 * Section 8: File Detection & Magic Bytes Engine
 */

import { DetectionResult, FileCategory } from '../types/analyzer';

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function detectFileCategory(extension: string): FileCategory {
  const ext = extension.toLowerCase();
  if (['apk', 'aab', 'xapk', 'apks'].includes(ext)) return 'apk';
  if (['zip', 'jar', 'aar', 'tar', 'gz', '7z'].includes(ext)) return 'archive';
  if (ext === 'dex') return 'dex';
  if (ext === 'so') return 'elf';
  if (ext === 'arsc') return 'arsc';
  if (ext === 'xml') return 'xml';
  if (['kt', 'java', 'js', 'ts', 'tsx', 'cpp', 'c', 'h', 'gradle', 'json', 'properties'].includes(ext)) {
    return 'code';
  }
  if (['txt', 'md', 'mf', 'sf'].includes(ext)) return 'text';
  if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) return 'image';
  if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio';
  return 'binary';
}

export function detectMagicBytes(bytes: Uint8Array, filename: string = ''): DetectionResult {
  const hex = Array.from(bytes.slice(0, 8))
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');

  const ext = filename.split('.').pop()?.toLowerCase() || '';

  // 1. ZIP / APK / JAR (PK\x03\x04)
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    if (['apk', 'aab', 'xapk', 'apks'].includes(ext)) {
      return {
        category: 'apk',
        formatName: 'Android Application Package (APK)',
        mimeType: 'application/vnd.android.package-archive',
        signature: 'PK Zip / APK Magic',
        magicBytesHex: hex,
        description: 'Android Package containing Manifest, Dalvik Executables (DEX), Resources, and Native Libraries',
        isContainer: true,
        isText: false,
        extension: ext || 'apk',
      };
    }
    return {
      category: 'archive',
      formatName: ext === 'jar' ? 'Java Archive (JAR)' : 'ZIP Archive',
      mimeType: ext === 'jar' ? 'application/java-archive' : 'application/zip',
      signature: 'PK Zip Archive',
      magicBytesHex: hex,
      description: 'Compressed zip file archive container',
      isContainer: true,
      isText: false,
      extension: ext || 'zip',
    };
  }

  // 2. DEX (Dalvik Executable) `dex\n035\0`, `037`, `038`, `039`
  if (
    bytes[0] === 0x64 &&
    bytes[1] === 0x65 &&
    bytes[2] === 0x78 &&
    bytes[3] === 0x0a
  ) {
    const ver = String.fromCharCode(bytes[4], bytes[5], bytes[6]);
    return {
      category: 'dex',
      formatName: `Dalvik Executable (DEX v${ver})`,
      mimeType: 'application/vnd.android.dex',
      signature: `DEX format v${ver}`,
      magicBytesHex: hex,
      description: `Android Dalvik Executable containing compiled bytecode instructions (v${ver})`,
      isContainer: false,
      isText: false,
      extension: 'dex',
    };
  }

  // 3. ELF Binary (.so shared libraries) `\x7fELF`
  if (
    bytes[0] === 0x7f &&
    bytes[1] === 0x45 &&
    bytes[2] === 0x4c &&
    bytes[3] === 0x46
  ) {
    const is64 = bytes[4] === 2;
    return {
      category: 'elf',
      formatName: `ELF Shared Library (${is64 ? '64-bit' : '32-bit'})`,
      mimeType: 'application/x-sharedlib',
      signature: `ELF ${is64 ? '64-bit' : '32-bit'}`,
      magicBytesHex: hex,
      description: 'Compiled Executable and Linkable Format (ELF) native shared object (.so)',
      isContainer: false,
      isText: false,
      extension: 'so',
    };
  }

  // 4. Binary Android XML / AXML (`\x03\x00\x08\x00`)
  if (
    bytes[0] === 0x03 &&
    bytes[1] === 0x00 &&
    bytes[2] === 0x08 &&
    bytes[3] === 0x00
  ) {
    return {
      category: 'axml',
      formatName: 'Android Binary XML (Compiled AXML)',
      mimeType: 'application/xml',
      signature: 'AXML Chunk 0x00080003',
      magicBytesHex: hex,
      description: 'Compiled binary Android XML resource (requires string pool decoding)',
      isContainer: false,
      isText: false,
      extension: 'xml',
    };
  }

  // 5. resources.arsc (`\x02\x00\x0c\x00` or `\x02\x00`)
  if (bytes[0] === 0x02 && bytes[1] === 0x00) {
    return {
      category: 'arsc',
      formatName: 'Android Resource Table (resources.arsc)',
      mimeType: 'application/octet-stream',
      signature: 'ARSC Chunk 0x0002',
      magicBytesHex: hex,
      description: 'Binary resource table mapping IDs to layout and value configurations',
      isContainer: false,
      isText: false,
      extension: 'arsc',
    };
  }

  // 6. Plain Text / Code / XML
  const sample = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 1000));
  const trimmed = sample.trim();

  if (trimmed.startsWith('<?xml') || (trimmed.startsWith('<') && (trimmed.includes('>') || ext === 'xml'))) {
    return {
      category: 'xml',
      formatName: 'XML Document',
      mimeType: 'application/xml',
      signature: 'XML Plaintext',
      magicBytesHex: hex,
      description: 'Extensible Markup Language plaintext document',
      isContainer: false,
      isText: true,
      extension: 'xml',
    };
  }

  const codeExtensions = new Set([
    'kt', 'kts', 'java', 'py', 'js', 'jsx', 'ts', 'tsx', 'cpp', 'c', 'h', 'hpp',
    'cs', 'go', 'rs', 'gradle', 'properties', 'yaml', 'yml', 'sql', 'sh', 'html', 'css', 'json'
  ]);
  if (codeExtensions.has(ext)) {
    return {
      category: 'code',
      formatName: `Source Code (${ext.toUpperCase()})`,
      mimeType: 'text/plain',
      signature: `Source text (${ext})`,
      magicBytesHex: hex,
      description: `Source code text file in ${ext.toUpperCase()}`,
      isContainer: false,
      isText: true,
      extension: ext,
    };
  }

  // Check if mostly printable ASCII/UTF-8
  let nonPrintable = 0;
  for (let i = 0; i < Math.min(bytes.length, 512); i++) {
    const b = bytes[i];
    if (b < 32 && b !== 9 && b !== 10 && b !== 13) {
      nonPrintable++;
    }
  }

  if (nonPrintable / Math.min(bytes.length, 512) < 0.05) {
    return {
      category: 'text',
      formatName: 'Plain Text Document',
      mimeType: 'text/plain',
      signature: 'UTF-8 Plaintext',
      magicBytesHex: hex,
      description: 'Human readable plain text file',
      isContainer: false,
      isText: true,
      extension: ext || 'txt',
    };
  }

  return {
    category: 'binary',
    formatName: 'Generic Binary',
    mimeType: 'application/octet-stream',
    signature: 'Raw Binary',
    magicBytesHex: hex,
    description: 'Raw binary stream with unrecognized magic signature',
    isContainer: false,
    isText: false,
    extension: ext || 'bin',
  };
}
