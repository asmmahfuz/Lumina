/**
 * Lumina Reader - MOBI & KF8 (AZW3) Markup Normalizer
 * Extracts binary images, decodes PalmDOC text, rewrites tags, and splits chapters
 */

import { PalmDatabase } from './palmDocDecompressor';
import { PalmDocDecompressor } from './palmDocDecompressor';
import { ParsedMobiHeader } from './mobiHeaderParser';
import { VirtualChapter } from '@/services/archive/virtualArchiveBuilder';

export interface NormalizedMobi {
  chapters: VirtualChapter[];
  assets: Map<string, ArrayBuffer | string>;
  coverData?: ArrayBuffer;
  coverMediaType?: string;
}

export class MobiNormalizer {
  /**
   * Normalizes MOBI Palm database contents into virtual chapters and assets
   */
  public static normalize(db: PalmDatabase, header: ParsedMobiHeader): NormalizedMobi {
    const assets = new Map<string, ArrayBuffer | string>();
    let coverData: ArrayBuffer | undefined;
    let coverMediaType: string | undefined;

    // 1. Extract Images
    const imageExtMap = new Map<number, { path: string; ext: string; mediaType: string }>();
    const totalRecords = db.records.length;
    const firstImg = header.firstImageIndex;

    if (firstImg > 0 && firstImg < totalRecords) {
      for (let idx = firstImg; idx < totalRecords; idx++) {
        const recData = db.records[idx].data;
        if (recData.length < 8) continue;

        const imgInfo = detectImageType(recData);
        if (!imgInfo) continue; // Boundary marker, FLIS, or FCIS record

        const relIndex = idx - firstImg;
        const imgPath = `images/img_${relIndex}.${imgInfo.ext}`;
        const bufferCopy = new Uint8Array(recData).slice().buffer as ArrayBuffer;

        assets.set(imgPath, bufferCopy);
        imageExtMap.set(relIndex, { path: imgPath, ext: imgInfo.ext, mediaType: imgInfo.mediaType });
        imageExtMap.set(idx, { path: imgPath, ext: imgInfo.ext, mediaType: imgInfo.mediaType });

        // Check if this is the cover image
        const isCover =
          (header.exth.coverOffset !== undefined && header.exth.coverOffset === relIndex) ||
          (!coverData && relIndex === 0);

        if (isCover) {
          coverData = bufferCopy;
          coverMediaType = imgInfo.mediaType;
        }
      }
    }

    // 2. Decompress Text Records
    const decompressedChunks: Uint8Array[] = [];
    const textRecCount = Math.min(header.textRecordCount, totalRecords - 1);

    for (let i = 1; i <= textRecCount; i++) {
      const rec = db.records[i];
      if (!rec || rec.data.length === 0) continue;

      if (header.compression === 2) {
        // PalmDOC LZ77 compression
        const decomp = PalmDocDecompressor.decompressRecord(rec.data);
        decompressedChunks.push(decomp);
      } else {
        // Uncompressed (compression === 1)
        decompressedChunks.push(rec.data);
      }
    }

    // Concatenate bytes
    const totalBytes = decompressedChunks.reduce((acc, c) => acc + c.length, 0);
    const combinedBytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of decompressedChunks) {
      combinedBytes.set(chunk, offset);
      offset += chunk.length;
    }

    let rawHtml = PalmDocDecompressor.decodeString(combinedBytes, header.encoding);

    // 3. Rewrite MOBI Image References
    rawHtml = rawHtml.replace(/<img([^>]+)>/gi, (match, attrs) => {
      // Check recindex="123"
      const recIndexMatch = attrs.match(/recindex=["']?(\d+)["']?/i);
      if (recIndexMatch) {
        const rawIdx = parseInt(recIndexMatch[1], 10);
        // Sometimes recindex is 1-based offset from firstImage or 1-based index
        const found =
          imageExtMap.get(rawIdx - 1) ||
          imageExtMap.get(rawIdx) ||
          imageExtMap.get(firstImg + rawIdx - 1);
        if (found) {
          return `<img${attrs.replace(/recindex=["']?\d+["']?/i, '')} src="${found.path}" />`;
        }
      }

      // Check src="kindle:pos:fid:..." or src="123"
      const srcMatch = attrs.match(/src=["']?([^"'\s>]+)["']?/i);
      if (srcMatch) {
        const srcVal = srcMatch[1];
        const numVal = parseInt(srcVal, 10);
        if (!isNaN(numVal)) {
          const found = imageExtMap.get(numVal - 1) || imageExtMap.get(numVal);
          if (found) {
            return `<img${attrs.replace(/src=["']?[^"'\s>]+["']?/i, '')} src="${found.path}" />`;
          }
        }
      }
      return match;
    });

    // Clean MOBI-specific tags
    rawHtml = rawHtml
      .replace(/<mbp:pagebreak\s*\/?>/gi, '<div class="lumina-pagebreak"></div>')
      .replace(/<mbp:[^>]+>/gi, '')
      .replace(/<\/mbp:[^>]+>/gi, '');

    // 4. Split HTML into Chapters
    const chapters = splitIntoChapters(rawHtml);

    return {
      chapters,
      assets,
      coverData,
      coverMediaType,
    };
  }
}

function detectImageType(data: Uint8Array): { ext: string; mediaType: string } | null {
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    return { ext: 'jpg', mediaType: 'image/jpeg' };
  }
  if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) {
    return { ext: 'png', mediaType: 'image/png' };
  }
  if (data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46) {
    return { ext: 'gif', mediaType: 'image/gif' };
  }
  if (
    data[0] === 0x52 &&
    data[1] === 0x49 &&
    data[2] === 0x46 &&
    data[3] === 0x46 &&
    data[8] === 0x57 &&
    data[9] === 0x45 &&
    data[10] === 0x42 &&
    data[11] === 0x50
  ) {
    return { ext: 'webp', mediaType: 'image/webp' };
  }
  return null;
}

function splitIntoChapters(html: string): VirtualChapter[] {
  // Check for pagebreak markers or <h1>/<h2> tags
  const splitPattern =
    /<div class="lumina-pagebreak"><\/div>|(?=<h[12][^>]*>)|(?=<section[^>]*>)/i;
  const rawSections = html
    .split(splitPattern)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (rawSections.length === 0) {
    rawSections.push(html);
  }

  const chapters: VirtualChapter[] = [];

  rawSections.forEach((sectionContent, index) => {
    // Extract title from <h1> or <h2> if present
    const titleMatch = sectionContent.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/i);
    let title = titleMatch ? stripTags(titleMatch[1]).trim() : '';

    if (!title) {
      title = index === 0 ? 'Introduction' : `Chapter ${index + 1}`;
    }

    const chapterId = `ch${String(index + 1).padStart(2, '0')}`;
    const xhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8"/>
  <title>${escapeXml(title)}</title>
</head>
<body class="lumina-mobi-body">
  ${sectionContent}
</body>
</html>`;

    chapters.push({
      id: chapterId,
      title,
      xhtml,
    });
  });

  return chapters;
}

function stripTags(text: string): string {
  return text.replace(/<[^>]+>/g, '').trim();
}

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
