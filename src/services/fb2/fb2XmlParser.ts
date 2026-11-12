/**
 * Lumina Reader - FictionBook (FB2 & FB2.zip) XML Parser
 * Handles archive decompression, encoding detection, DOM parsing, and base64 binary extraction
 */
import JSZip from 'jszip';

export interface Fb2BinaryItem {
  id: string;
  contentType: string;
  data: ArrayBuffer;
}

export interface Fb2ParsedDocument {
  xmlDoc: XMLDocument;
  title: string;
  author: string;
  description: string;
  publisher?: string;
  language: string;
  date?: string;
  coverImageId?: string;
  binaries: Map<string, Fb2BinaryItem>;
}

export class Fb2XmlParser {
  /**
   * Parses raw file buffer (either .fb2 XML or .fb2.zip archive) into DOM and binary resources
   */
  public static async parse(data: ArrayBuffer, fileName: string): Promise<Fb2ParsedDocument> {
    const isZip =
      fileName.endsWith('.zip') ||
      (data.byteLength > 4 &&
        new Uint8Array(data, 0, 4)[0] === 0x50 &&
        new Uint8Array(data, 0, 4)[1] === 0x4b);

    let xmlString = '';

    if (isZip) {
      const zip = new JSZip();
      await zip.loadAsync(data);
      // Find .fb2 file in zip
      const fb2File = Object.values(zip.files).find(
        (f) => !f.dir && f.name.toLowerCase().endsWith('.fb2')
      ) || Object.values(zip.files).find((f) => !f.dir);

      if (!fb2File) {
        throw new Error('No .fb2 XML file found inside archive');
      }
      xmlString = await fb2File.async('string');
    } else {
      xmlString = decodeXmlText(data);
    }

    const domParser = new DOMParser();
    const xmlDoc = domParser.parseFromString(xmlString, 'application/xml');

    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      throw new Error(`FB2 XML Parsing Error: ${parserError.textContent?.slice(0, 150)}`);
    }

    // 1. Extract Description & Metadata
    const titleInfo = xmlDoc.querySelector('description > title-info');
    const publishInfo = xmlDoc.querySelector('description > publish-info');

    let title = titleInfo?.querySelector('book-title')?.textContent?.trim() || '';
    if (!title) {
      title = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    }

    const authorNodes = titleInfo?.querySelectorAll('author') || [];
    const authorNames: string[] = [];
    authorNodes.forEach((a) => {
      const first = a.querySelector('first-name')?.textContent?.trim() || '';
      const middle = a.querySelector('middle-name')?.textContent?.trim() || '';
      const last = a.querySelector('last-name')?.textContent?.trim() || '';
      const nick = a.querySelector('nickname')?.textContent?.trim() || '';
      const full = [first, middle, last].filter(Boolean).join(' ') || nick;
      if (full) authorNames.push(full);
    });
    const author = authorNames.join(', ') || 'FictionBook Author';

    const description =
      titleInfo?.querySelector('annotation')?.textContent?.trim() || 'FictionBook E-Book';
    const publisher = publishInfo?.querySelector('publisher')?.textContent?.trim();
    const language = titleInfo?.querySelector('lang')?.textContent?.trim() || 'en';
    const date = titleInfo?.querySelector('date')?.textContent?.trim();

    // Cover image reference
    const coverpageImg = titleInfo?.querySelector('coverpage image');
    let coverImageId =
      coverpageImg?.getAttribute('l:href') ||
      coverpageImg?.getAttribute('xlink:href') ||
      coverpageImg?.getAttribute('href') ||
      undefined;

    if (coverImageId?.startsWith('#')) {
      coverImageId = coverImageId.slice(1);
    }

    // 2. Extract Base64 Binaries
    const binaries = new Map<string, Fb2BinaryItem>();
    const binaryElements = xmlDoc.querySelectorAll('FictionBook > binary, binary');

    binaryElements.forEach((el) => {
      const id = el.getAttribute('id') || '';
      const contentType = el.getAttribute('content-type') || 'image/jpeg';
      const base64 = el.textContent?.trim().replace(/\s+/g, '') || '';

      if (id && base64) {
        try {
          const binaryBuffer = base64ToArrayBuffer(base64);
          binaries.set(id, { id, contentType, data: binaryBuffer });
          if (!coverImageId) {
            coverImageId = id; // Fallback to first binary
          }
        } catch (e) {
          console.warn(`Failed to decode FB2 binary "${id}":`, e);
        }
      }
    });

    return {
      xmlDoc,
      title,
      author,
      description,
      publisher,
      language,
      date,
      coverImageId,
      binaries,
    };
  }
}

function decodeXmlText(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  // Peek header for encoding="windows-1251" or "utf-8"
  const peekLen = Math.min(bytes.length, 256);
  const asciiHeader = String.fromCharCode(...bytes.subarray(0, peekLen));
  const encodingMatch = asciiHeader.match(/encoding=["']([^"']+)["']/i);
  const detectedEncoding = encodingMatch ? encodingMatch[1].toLowerCase() : 'utf-8';

  try {
    const decoder = new TextDecoder(detectedEncoding, { fatal: false });
    return decoder.decode(buffer);
  } catch {
    const fallback = new TextDecoder('utf-8');
    return fallback.decode(buffer);
  }
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
