/**
 * Lumina Reader - Kindle MOBI & AZW3 (KF8) Decompressor Engine
 * Entry point for parsing Kindle PalmDOC/KF8 binary ebooks into normalized reading archives
 */

import { ParsedEpubBook, DublinCoreMetadata } from '@/types/epub';
import { SafeArchiveReader } from '@/services/archive/safeDecompressor';
import { PalmDocDecompressor } from './palmDocDecompressor';
import { MobiHeaderParser, ParsedMobiHeader } from './mobiHeaderParser';
import { MobiNormalizer } from './mobiNormalizer';
import { VirtualArchiveBuilder } from '@/services/archive/virtualArchiveBuilder';

export interface ParsedMobiResult {
  book: ParsedEpubBook;
  archive: SafeArchiveReader;
  buffer: ArrayBuffer;
  header: ParsedMobiHeader;
}

export class MobiEngine {
  /**
   * Parses a raw MOBI, AZW, or AZW3 (KF8) binary buffer into a normalized reading archive
   */
  public static async parseMobi(data: ArrayBuffer, fileName: string): Promise<ParsedMobiResult> {
    const defaultTitle = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    // 1. Parse Palm Database Structure
    const db = PalmDocDecompressor.parseDatabase(data);
    if (db.records.length === 0) {
      throw new Error(`Invalid Kindle file "${fileName}": zero Palm database records found`);
    }

    // 2. Parse Record 0 (PalmDOC & MOBI & EXTH headers)
    const header = MobiHeaderParser.parseRecordZero(db.records[0].data, defaultTitle);

    // 3. Normalize Markup, Extract Images, Split Chapters
    const normalized = MobiNormalizer.normalize(db, header);

    // 4. Construct Dublin Core Metadata
    let coverBlobUrl: string | undefined;
    if (normalized.coverData) {
      const blob = new Blob([normalized.coverData], {
        type: normalized.coverMediaType || 'image/jpeg',
      });
      coverBlobUrl = URL.createObjectURL(blob);
    }

    const metadata: DublinCoreMetadata = {
      title: header.title || defaultTitle,
      creator: header.exth.author || 'Kindle Author',
      description: header.exth.description || (header.isKf8 ? 'Kindle KF8 (AZW3) E-Book' : 'Kindle MOBI E-Book'),
      publisher: header.exth.publisher || 'Kindle Edition',
      language: 'en',
      pubdate: header.exth.date || new Date().toISOString().split('T')[0],
      identifier: header.exth.isbn || `mobi-${Date.now()}`,
      rights: header.exth.rights || 'All Rights Reserved',
      coverBlobUrl,
      coverData: normalized.coverData,
      coverMediaType: normalized.coverMediaType,
    };

    // 5. Build in-memory virtual EPUB archive
    const { book, archive, buffer } = await VirtualArchiveBuilder.build({
      metadata,
      chapters: normalized.chapters,
      assets: normalized.assets,
      coverData: normalized.coverData,
      coverMediaType: normalized.coverMediaType,
    });

    return {
      book,
      archive,
      buffer,
      header,
    };
  }
}
