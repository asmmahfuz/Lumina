/**
 * Lumina Reader - Palm Database & PalmDOC LZ77 Decompressor
 * Unpacks PalmDOC records and decodes LZ77 compressed byte streams
 */

export interface PalmRecord {
  offset: number;
  attributes: number;
  uniqueId: number;
  data: Uint8Array;
}

export interface PalmDatabase {
  name: string;
  attributes: number;
  version: number;
  created: number;
  modified: number;
  type: string;
  creator: string;
  numRecords: number;
  records: PalmRecord[];
}

export class PalmDocDecompressor {
  /**
   * Parses Palm Database (PDB/PRC) binary structure and extracts records
   */
  public static parseDatabase(buffer: ArrayBuffer): PalmDatabase {
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);

    if (buffer.byteLength < 78) {
      throw new Error('Invalid Palm database: file header too short');
    }

    // Name: 32 bytes ASCII
    let name = '';
    for (let i = 0; i < 32; i++) {
      const code = bytes[i];
      if (code === 0) break;
      name += String.fromCharCode(code);
    }

    const attributes = view.getUint16(32, false);
    const version = view.getUint16(34, false);
    const created = view.getUint32(36, false);
    const modified = view.getUint32(40, false);

    // Type and creator (4 chars each at offset 60 and 64)
    let type = '';
    for (let i = 60; i < 64; i++) type += String.fromCharCode(bytes[i]);

    let creator = '';
    for (let i = 64; i < 68; i++) creator += String.fromCharCode(bytes[i]);

    const numRecords = view.getUint16(76, false);
    const records: PalmRecord[] = [];

    // Parse record info headers (8 bytes each starting at 78)
    const rawOffsets: { offset: number; attributes: number; uniqueId: number }[] = [];
    for (let i = 0; i < numRecords; i++) {
      const recHeaderOffset = 78 + i * 8;
      if (recHeaderOffset + 8 > buffer.byteLength) break;

      const offset = view.getUint32(recHeaderOffset, false);
      const attr = bytes[recHeaderOffset + 4];
      const uid =
        (bytes[recHeaderOffset + 5] << 16) |
        (bytes[recHeaderOffset + 6] << 8) |
        bytes[recHeaderOffset + 7];

      rawOffsets.push({ offset, attributes: attr, uniqueId: uid });
    }

    // Slice record byte arrays
    for (let i = 0; i < rawOffsets.length; i++) {
      const current = rawOffsets[i];
      const nextOffset =
        i + 1 < rawOffsets.length ? rawOffsets[i + 1].offset : buffer.byteLength;

      const start = Math.min(current.offset, buffer.byteLength);
      const end = Math.min(nextOffset, buffer.byteLength);
      const data = bytes.subarray(start, end);

      records.push({
        offset: current.offset,
        attributes: current.attributes,
        uniqueId: current.uniqueId,
        data,
      });
    }

    return {
      name,
      attributes,
      version,
      created,
      modified,
      type,
      creator,
      numRecords,
      records,
    };
  }

  /**
   * Decompresses a single PalmDOC LZ77 compressed record
   */
  public static decompressRecord(data: Uint8Array): Uint8Array {
    const out: number[] = [];
    let pos = 0;
    const len = data.length;

    while (pos < len) {
      const b = data[pos++];

      if (b === 0x00) {
        // Literal 0x00
        out.push(0x00);
      } else if (b >= 0x01 && b <= 0x08) {
        // Literal run of b bytes
        for (let i = 0; i < b && pos < len; i++) {
          out.push(data[pos++]);
        }
      } else if (b >= 0x09 && b <= 0x7f) {
        // Literal byte
        out.push(b);
      } else if (b >= 0x80 && b <= 0xbf) {
        // Distance and length token: 2 bytes
        if (pos >= len) break;
        const b2 = data[pos++];
        const compound = ((b & 0x3f) << 8) | b2;
        const distance = compound >> 3;
        const matchLen = (compound & 0x07) + 3;

        const startIdx = out.length - distance;
        for (let i = 0; i < matchLen; i++) {
          const char = out[startIdx + i];
          out.push(char !== undefined ? char : 0x20);
        }
      } else if (b >= 0xc0) {
        // Space + byte ^ 0x80
        out.push(0x20);
        out.push(b ^ 0x80);
      }
    }

    return new Uint8Array(out);
  }

  /**
   * Decodes decompressed bytes to string using specified encoding
   */
  public static decodeString(bytes: Uint8Array, encoding: 'utf-8' | 'windows-1252' = 'utf-8'): string {
    try {
      const decoder = new TextDecoder(encoding, { fatal: false });
      return decoder.decode(bytes);
    } catch {
      const fallback = new TextDecoder('utf-8');
      return fallback.decode(bytes);
    }
  }
}
