/**
 * Lumina Reader - FictionBook (FB2 & FB2.zip) Engine
 * Unified coordinator for parsing FB2/FB2.zip archives into normalized reflowable reading books
 */

import { ParsedEpubBook, DublinCoreMetadata } from '@/types/epub';
import { SafeArchiveReader } from '@/services/archive/safeDecompressor';
import { Fb2XmlParser } from './fb2XmlParser';
import { Fb2HtmlConverter } from './fb2HtmlConverter';
import { VirtualArchiveBuilder } from '@/services/archive/virtualArchiveBuilder';

export interface ParsedFb2Result {
  book: ParsedEpubBook;
  archive: SafeArchiveReader;
  buffer: ArrayBuffer;
}

export class Fb2Engine {
  /**
   * Parses an FB2 or FB2.zip file into a normalized reflowable EPUB archive
   */
  public static async parseFb2(data: ArrayBuffer, fileName: string): Promise<ParsedFb2Result> {
    // 1. Parse XML DOM and extract binaries
    const doc = await Fb2XmlParser.parse(data, fileName);

    // 2. Convert DOM elements to XHTML chapters and assets
    const converted = Fb2HtmlConverter.convert(doc);

    // 3. Construct Dublin Core Metadata
    let coverBlobUrl: string | undefined;
    if (converted.coverData) {
      const blob = new Blob([converted.coverData], {
        type: converted.coverMediaType || 'image/jpeg',
      });
      coverBlobUrl = URL.createObjectURL(blob);
    }

    const metadata: DublinCoreMetadata = {
      title: doc.title,
      creator: doc.author,
      description: doc.description,
      publisher: doc.publisher || 'FictionBook Edition',
      language: doc.language || 'en',
      pubdate: doc.date || new Date().toISOString().split('T')[0],
      identifier: `fb2-${Date.now()}`,
      rights: 'Public Domain / Free Distribution',
      coverBlobUrl,
      coverData: converted.coverData,
      coverMediaType: converted.coverMediaType,
    };

    // 4. Build in-memory virtual EPUB archive
    const { book, archive, buffer } = await VirtualArchiveBuilder.build({
      metadata,
      chapters: converted.chapters,
      assets: converted.assets,
      coverData: converted.coverData,
      coverMediaType: converted.coverMediaType,
    });

    return {
      book,
      archive,
      buffer,
    };
  }
}
