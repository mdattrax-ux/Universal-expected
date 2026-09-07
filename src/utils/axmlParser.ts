/**
 * MASTER DEVELOPER SPECIFICATION
 * Section 9 & 13: Android Manifest & AXML Decoder
 * Decodes Android Binary XML (Compiled AXML) into human-readable XML.
 */

export function decodeBinaryXml(buffer: Uint8Array): string {
  try {
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

    const CHUNK_AXML_FILE = 0x00080003;
    const CHUNK_STRING_POOL = 0x001c0001;
    const CHUNK_RESOURCEIDS = 0x00080180;
    const CHUNK_START_NAMESPACE = 0x00100100;
    const CHUNK_END_NAMESPACE = 0x00100101;
    const CHUNK_START_TAG = 0x00100102;
    const CHUNK_END_TAG = 0x00100103;
    const CHUNK_TEXT = 0x00100104;

    const fileMagic = view.getUint32(0, true);
    if (fileMagic !== CHUNK_AXML_FILE && fileMagic !== 0x00080003) {
      // If not binary, decode as UTF-8
      return new TextDecoder('utf-8').decode(buffer);
    }

    let offset = 8; // Skip file header
    const stringPool: string[] = [];

    // Parse String Pool
    const poolMagic = view.getUint32(offset, true);
    if (poolMagic === CHUNK_STRING_POOL) {
      const chunkSize = view.getUint32(offset + 4, true);
      const stringCount = view.getUint32(offset + 8, true);
      const flags = view.getUint32(offset + 16, true);
      const stringsStart = offset + view.getUint32(offset + 20, true);
      const isUtf8 = (flags & (1 << 8)) !== 0;

      const indices: number[] = [];
      for (let i = 0; i < stringCount; i++) {
        indices.push(view.getUint32(offset + 28 + i * 4, true));
      }

      for (let i = 0; i < stringCount; i++) {
        const strOffset = stringsStart + indices[i];
        if (strOffset < buffer.byteLength) {
          if (isUtf8) {
            // Read UTF-8 string
            let len = buffer[strOffset + 1];
            if (len > 127) len = buffer[strOffset + 2];
            const strBytes = buffer.slice(strOffset + 2, strOffset + 2 + len);
            stringPool.push(new TextDecoder('utf-8').decode(strBytes));
          } else {
            // Read UTF-16LE string
            const len = view.getUint16(strOffset, true);
            let s = '';
            for (let j = 0; j < len; j++) {
              const charCode = view.getUint16(strOffset + 2 + j * 2, true);
              if (charCode === 0) break;
              s += String.fromCharCode(charCode);
            }
            stringPool.push(s);
          }
        } else {
          stringPool.push('');
        }
      }

      offset += chunkSize;
    }

    // Skip ResourceIDs chunk if present
    if (offset < buffer.byteLength) {
      const resMagic = view.getUint32(offset, true);
      if (resMagic === CHUNK_RESOURCEIDS) {
        const chunkSize = view.getUint32(offset + 4, true);
        offset += chunkSize;
      }
    }

    // Parse XML Elements
    const lines: string[] = ['<?xml version="1.0" encoding="utf-8"?>'];
    let indent = '';

    while (offset + 8 <= buffer.byteLength) {
      const chunkType = view.getUint32(offset, true);
      const chunkSize = view.getUint32(offset + 4, true);

      if (chunkSize <= 0) break;

      if (chunkType === CHUNK_START_NAMESPACE) {
        // Namespace declaration
        const prefixIdx = view.getInt32(offset + 16, true);
        const uriIdx = view.getInt32(offset + 20, true);
        const prefix = stringPool[prefixIdx] || 'android';
        const uri = stringPool[uriIdx] || 'http://schemas.android.com/apk/res/android';
        lines.push(`<!-- Namespace: xmlns:${prefix}="${uri}" -->`);
      } else if (chunkType === CHUNK_START_TAG) {
        const nameIdx = view.getInt32(offset + 20, true);
        const attrCount = view.getUint16(offset + 28, true);
        const tagName = stringPool[nameIdx] || 'node';

        let tagStr = `${indent}<${tagName}`;
        if (tagName === 'manifest') {
          tagStr += ' xmlns:android="http://schemas.android.com/apk/res/android"';
        }

        let attrOffset = offset + 36;
        for (let a = 0; a < attrCount; a++) {
          if (attrOffset + 20 <= buffer.byteLength) {
            const attrNameIdx = view.getInt32(attrOffset + 4, true);
            const attrValIdx = view.getInt32(attrOffset + 8, true);
            const attrRawVal = view.getInt32(attrOffset + 16, true);

            const attrName = stringPool[attrNameIdx] || `attr_${a}`;
            let attrVal = stringPool[attrValIdx];

            if (attrVal === undefined || attrVal === null || attrVal === '') {
              attrVal = `0x${attrRawVal.toString(16)}`;
            }

            tagStr += ` android:${attrName}="${escapeXml(attrVal)}"`;
            attrOffset += 20;
          }
        }

        tagStr += '>';
        lines.push(tagStr);
        indent += '    ';
      } else if (chunkType === CHUNK_END_TAG) {
        indent = indent.slice(4);
        const nameIdx = view.getInt32(offset + 20, true);
        const tagName = stringPool[nameIdx] || 'node';
        lines.push(`${indent}</${tagName}>`);
      } else if (chunkType === CHUNK_TEXT) {
        const textIdx = view.getInt32(offset + 16, true);
        const text = stringPool[textIdx] || '';
        if (text.trim()) {
          lines.push(`${indent}${escapeXml(text)}`);
        }
      }

      offset += chunkSize;
    }

    if (lines.length <= 1) {
      // Fallback: dump extracted string pool in manifest structure
      return fallbackDecodeStringPool(stringPool);
    }

    return lines.join('\n');
  } catch (err) {
    console.warn('AXML binary decode exception, falling back to raw strings:', err);
    return fallbackRawAxml(buffer);
  }
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function fallbackDecodeStringPool(pool: string[]): string {
  const lines = ['<?xml version="1.0" encoding="utf-8"?>', '<!-- Decoded from Android Binary XML String Pool -->', '<manifest>'];
  for (const s of pool) {
    if (s.length > 0 && !s.includes('\x00')) {
      lines.push(`    <!-- Extracted Symbol: ${escapeXml(s)} -->`);
    }
  }
  lines.push('</manifest>');
  return lines.join('\n');
}

function fallbackRawAxml(buffer: Uint8Array): string {
  const strings: string[] = [];
  const maxStrings = 3000;
  const maxScanBytes = Math.min(buffer.length, 2 * 1024 * 1024); // scan up to 2MB to prevent freezing
  const decoder = new TextDecoder('utf-8', { fatal: false });

  let start = -1;
  for (let i = 0; i < maxScanBytes; i++) {
    const c = buffer[i];
    if (c >= 32 && c <= 126) {
      if (start === -1) start = i;
    } else {
      if (start !== -1) {
        if (i - start >= 3) {
          strings.push(decoder.decode(buffer.subarray(start, i)));
          if (strings.length >= maxStrings) break;
        }
        start = -1;
      }
    }
  }

  if (start !== -1 && strings.length < maxStrings && maxScanBytes - start >= 3) {
    strings.push(decoder.decode(buffer.subarray(start, maxScanBytes)));
  }

  const lines = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<!-- Decoded Android Binary Manifest (String Stream Reconstruction) -->',
    '<manifest xmlns:android="http://schemas.android.com/apk/res/android">',
  ];

  for (const str of strings) {
    if (str.includes('.') || str.includes(':') || str.includes('android')) {
      lines.push(`    <!-- ${escapeXml(str)} -->`);
    }
  }

  lines.push('</manifest>');
  return lines.join('\n');
}

export function parseManifestMetadata(xmlContent: string) {
  const pkgMatch = xmlContent.match(/package\s*=\s*["']([^"']+)["']/i);
  const vNameMatch = xmlContent.match(/android:versionName\s*=\s*["']([^"']+)["']/i);
  const vCodeMatch = xmlContent.match(/android:versionCode\s*=\s*["']([^"']+)["']/i);
  const minSdkMatch = xmlContent.match(/android:minSdkVersion\s*=\s*["']([^"']+)["']/i);
  const targetSdkMatch = xmlContent.match(/android:targetSdkVersion\s*=\s*["']([^"']+)["']/i);

  const permissions: string[] = [];
  const permRegex = /<uses-permission[^>]+android:name\s*=\s*["']([^"']+)["']/gi;
  let match;
  while ((match = permRegex.exec(xmlContent)) !== null) {
    if (!permissions.includes(match[1])) permissions.push(match[1]);
  }

  const activities: string[] = [];
  const actRegex = /<activity[^>]+android:name\s*=\s*["']([^"']+)["']/gi;
  while ((match = actRegex.exec(xmlContent)) !== null) {
    if (!activities.includes(match[1])) activities.push(match[1]);
  }

  const services: string[] = [];
  const srvRegex = /<service[^>]+android:name\s*=\s*["']([^"']+)["']/gi;
  while ((match = srvRegex.exec(xmlContent)) !== null) {
    if (!services.includes(match[1])) services.push(match[1]);
  }

  const receivers: string[] = [];
  const recRegex = /<receiver[^>]+android:name\s*=\s*["']([^"']+)["']/gi;
  while ((match = recRegex.exec(xmlContent)) !== null) {
    if (!receivers.includes(match[1])) receivers.push(match[1]);
  }

  const providers: string[] = [];
  const prvRegex = /<provider[^>]+android:name\s*=\s*["']([^"']+)["']/gi;
  while ((match = prvRegex.exec(xmlContent)) !== null) {
    if (!providers.includes(match[1])) providers.push(match[1]);
  }

  return {
    packageName: pkgMatch ? pkgMatch[1] : 'com.example.app',
    versionName: vNameMatch ? vNameMatch[1] : '1.0',
    versionCode: vCodeMatch ? parseInt(vCodeMatch[1], 10) || 1 : 1,
    minSdkVersion: minSdkMatch ? minSdkMatch[1] : '21',
    targetSdkVersion: targetSdkMatch ? targetSdkMatch[1] : '34',
    permissions,
    activities,
    services,
    receivers,
    providers,
  };
}

