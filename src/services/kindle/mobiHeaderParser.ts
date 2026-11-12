/**
 * Lumina Reader - MOBI & KF8 (AZW3) Header & EXTH Metadata Parser
 * Extracts PalmDOC header, MOBI header, and Dublin Core EXTH tags
 */

export interface ExthMetadata {
  author?: string;
  publisher?: string;
  description?: string;
  isbn?: string;
  subject?: string;
  date?: string;
  rights?: string;
  coverOffset?: number;
  updatedTitle?: string;
}

export interface ParsedMobiHeader {
  compression: number; // 1 = none, 2 = PalmDOC, 17480 = Huff/Cdic
  textLength: number;
  textRecordCount: number;
  recordSize: number;
  hasMobiHeader: boolean;
  mobiType?: number;
  encoding: 'utf-8' | 'windows-1252';
  version: number;
  title: string;
  firstImageIndex: number;
  lastContentRecordIndex: number;
  exth: ExthMetadata;
  isKf8: boolean;
}

export class MobiHeaderParser {
  /**
   * Parses Record 0 of a Palm database to extract PalmDOC, MOBI, and EXTH headers
   */
  public static parseRecordZero(record0: Uint8Array, defaultTitle: string): ParsedMobiHeader {
    if (record0.length < 16) {
      throw new Error('Record 0 too small for PalmDOC header');
    }

    const view = new DataView(record0.buffer, record0.byteOffset, record0.byteLength);

    // 1. PalmDOC Header (bytes 0-15)
    const compression = view.getUint16(0, false);
    const textLength = view.getUint32(4, false);
    const textRecordCount = view.getUint16(8, false);
    const recordSize = view.getUint16(10, false);

    // 2. MOBI Header (starts at offset 16)
    let hasMobiHeader = false;
    let mobiType = 2;
    let encoding: 'utf-8' | 'windows-1252' = 'utf-8';
    let version = 6;
    let title = defaultTitle;
    let firstImageIndex = textRecordCount + 1;
    let lastContentRecordIndex = textRecordCount;
    let exthFlags = 0;
    let headerLength = 0;
    const exth: ExthMetadata = {};

    if (record0.length >= 40) {
      const magic = String.fromCharCode(record0[16], record0[17], record0[18], record0[19]);
      if (magic === 'MOBI') {
        hasMobiHeader = true;
        headerLength = view.getUint32(20, false);
        mobiType = view.getUint32(24, false);
        const codepage = view.getUint32(28, false);
        encoding = codepage === 1252 ? 'windows-1252' : 'utf-8';
        version = view.getUint32(36, false);

        if (headerLength >= 84) {
          const fnOffset = view.getUint32(84, false);
          const fnLength = view.getUint32(88, false);
          if (fnOffset < record0.length && fnOffset + fnLength <= record0.length) {
            const rawTitleBytes = record0.subarray(fnOffset, fnOffset + fnLength);
            title = new TextDecoder(encoding).decode(rawTitleBytes);
          }
        }

        // firstImageIndex
        if (headerLength >= 92) {
          firstImageIndex = view.getUint32(108, false);
        }

        // EXTH flags at offset 128 (relative to record 0)
        if (headerLength >= 116 && record0.length >= 132) {
          exthFlags = view.getUint32(128, false);
        }
      }
    }

    // 3. EXTH Header (if bit 6 of exthFlags is set or EXTH magic is present)
    const exthStart = 16 + headerLength;
    const hasExthFlag = (exthFlags & 0x40) !== 0;
    if (record0.length >= exthStart + 12) {
      const exthMagic = String.fromCharCode(
        record0[exthStart],
        record0[exthStart + 1],
        record0[exthStart + 2],
        record0[exthStart + 3]
      );

      if (hasExthFlag || exthMagic === 'EXTH') {
        this.parseExthRecords(record0, exthStart, exth, encoding);
      }
    }

    if (exth.updatedTitle) {
      title = exth.updatedTitle;
    }

    const isKf8 = version >= 8;

    return {
      compression,
      textLength,
      textRecordCount,
      recordSize,
      hasMobiHeader,
      mobiType,
      encoding,
      version,
      title: title || defaultTitle,
      firstImageIndex,
      lastContentRecordIndex,
      exth,
      isKf8,
    };
  }

  private static parseExthRecords(
    record0: Uint8Array,
    start: number,
    exth: ExthMetadata,
    encoding: 'utf-8' | 'windows-1252'
  ): void {
    const view = new DataView(record0.buffer, record0.byteOffset, record0.byteLength);
    const exthLength = view.getUint32(start + 4, false);
    const count = view.getUint32(start + 8, false);

    let offset = start + 12;
    const maxOffset = Math.min(start + exthLength, record0.length);

    for (let i = 0; i < count && offset + 8 <= maxOffset; i++) {
      const recType = view.getUint32(offset, false);
      const recLen = view.getUint32(offset + 4, false);
      if (recLen < 8 || offset + recLen > maxOffset) break;

      const dataBytes = record0.subarray(offset + 8, offset + recLen);
      const textVal = new TextDecoder(encoding).decode(dataBytes);

      switch (recType) {
        case 100:
          exth.author = textVal;
          break;
        case 101:
          exth.publisher = textVal;
          break;
        case 103:
          exth.description = textVal;
          break;
        case 104:
          exth.isbn = textVal;
          break;
        case 105:
          exth.subject = textVal;
          break;
        case 106:
          exth.date = textVal;
          break;
        case 109:
          exth.rights = textVal;
          break;
        case 201:
          // Cover offset (uint32 BE or text)
          if (dataBytes.length >= 4) {
            const dv = new DataView(dataBytes.buffer, dataBytes.byteOffset, dataBytes.byteLength);
            exth.coverOffset = dv.getUint32(0, false);
          }
          break;
        case 503:
          exth.updatedTitle = textVal;
          break;
      }

      offset += recLen;
    }
  }
}
