/**
 * Lumina Reader - Universal Multi-Format Book Importer
 * Normalizes EPUB, CBZ, PDF, Markdown, TXT, MOBI, and FB2 documents into local storage
 */

import { BookFormat, BookMetadata } from '@/types/book';
import { EpubEngine } from '@/services/epub/epubEngine';
import { SafeArchiveReader } from '@/services/archive/safeDecompressor';
import { PdfEngine } from '@/services/pdf/pdfEngine';
import { DjvuEngine } from '@/services/djvu/djvuEngine';
import { MobiEngine } from '@/services/kindle/mobiEngine';
import { Fb2Engine } from '@/services/fb2/fb2Engine';
import { TextEngine } from '@/services/text/textEngine';
import { localDb } from './indexedDb';

export class UniversalBookImporter {
  /**
   * Imports an arbitrary supported book file into the local library
   */
  public static async importFile(file: { name: string; data: ArrayBuffer }): Promise<BookMetadata> {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const format = (ext as BookFormat) || 'epub';
    const cleanBaseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    if (format === 'epub') {
      return await this.importEpub(file.name, file.data);
    } else if (['cbz', 'cbr', 'cbt', 'cb7'].includes(format)) {
      return await this.importComic(file.name, file.data, format as 'cbz' | 'cbr');
    } else if (format === 'pdf') {
      return await this.importPdf(file.name, file.data);
    } else if (format === 'djvu') {
      return await this.importDjvu(file.name, file.data);
    } else if (format === 'mobi' || format === 'azw3' || ext === 'azw') {
      return await this.importMobi(file.name, file.data, format === 'azw3' ? 'azw3' : 'mobi');
    } else if (format === 'fb2' || file.name.toLowerCase().endsWith('.fb2.zip')) {
      return await this.importFb2(file.name, file.data);
    } else if (format === 'md' || format === 'txt') {
      return await this.importTextDocument(file.name, file.data, format);
    } else {
      return await this.importGenericDocument(cleanBaseName, file.name, file.data, format);
    }
  }

  private static async importEpub(fileName: string, data: ArrayBuffer): Promise<BookMetadata> {
    const { book } = await EpubEngine.parseEpub(data);
    const bookId =
      book.metadata.identifier ||
      fileName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() ||
      `epub-${Date.now()}`;

    const metadata: BookMetadata = {
      id: bookId,
      title: book.metadata.title,
      creator: book.metadata.creator || 'Unknown Author',
      description: book.metadata.description,
      publisher: book.metadata.publisher,
      language: book.metadata.language || 'en',
      pubdate: book.metadata.pubdate,
      format: 'epub',
      fileSizeBytes: data.byteLength,
      coverBlobUrl: book.metadata.coverBlobUrl,
      importedAt: Date.now(),
      progress: {
        bookId,
        percent: 0,
        currentSpineIndex: 0,
        totalSpineItems: book.spine.length,
        updatedAt: Date.now(),
      },
    };

    await localDb.saveBook(metadata, data, book.metadata.coverData, book.metadata.coverMediaType);
    return metadata;
  }

  private static async importComic(
    fileName: string,
    data: ArrayBuffer,
    format: 'cbz' | 'cbr'
  ): Promise<BookMetadata> {
    const bookId = `comic-${fileName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}`;
    const title = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    let coverData: ArrayBuffer | undefined;
    let coverBlobUrl: string | undefined;

    try {
      const archive = await SafeArchiveReader.fromData(data);
      const imageFiles = archive
        .getSafeFileList()
        .filter((path) => /\.(jpe?g|png|webp)$/i.test(path))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

      if (imageFiles.length > 0) {
        const coverPath = imageFiles[0];
        coverData = await archive.readAsArrayBuffer(coverPath);
        coverBlobUrl = await archive.readAsObjectUrl(coverPath);
      }
    } catch (err) {
      console.warn('Could not extract comic cover:', err);
    }

    const metadata: BookMetadata = {
      id: bookId,
      title,
      creator: 'Graphic Novel / Manga',
      format,
      fileSizeBytes: data.byteLength,
      coverBlobUrl,
      importedAt: Date.now(),
      progress: {
        bookId,
        percent: 0,
        updatedAt: Date.now(),
      },
    };

    await localDb.saveBook(metadata, data, coverData, 'image/jpeg');
    return metadata;
  }

  private static async importMobi(
    fileName: string,
    data: ArrayBuffer,
    format: 'mobi' | 'azw3'
  ): Promise<BookMetadata> {
    const { book } = await MobiEngine.parseMobi(data.slice(0), fileName);
    const bookId = `${format}-${fileName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}`;

    const metadata: BookMetadata = {
      id: bookId,
      title: book.metadata.title,
      creator: book.metadata.creator || 'Kindle Author',
      description: book.metadata.description,
      publisher: book.metadata.publisher,
      language: book.metadata.language || 'en',
      pubdate: book.metadata.pubdate,
      format,
      fileSizeBytes: data.byteLength,
      coverBlobUrl: book.metadata.coverBlobUrl,
      importedAt: Date.now(),
      progress: {
        bookId,
        percent: 0,
        currentSpineIndex: 0,
        totalSpineItems: book.spine.length,
        updatedAt: Date.now(),
      },
    };

    await localDb.saveBook(metadata, data, book.metadata.coverData, book.metadata.coverMediaType);
    return metadata;
  }

  private static async importFb2(fileName: string, data: ArrayBuffer): Promise<BookMetadata> {
    const { book } = await Fb2Engine.parseFb2(data.slice(0), fileName);
    const bookId = `fb2-${fileName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}`;

    const metadata: BookMetadata = {
      id: bookId,
      title: book.metadata.title,
      creator: book.metadata.creator || 'FictionBook Author',
      description: book.metadata.description,
      publisher: book.metadata.publisher,
      language: book.metadata.language || 'en',
      pubdate: book.metadata.pubdate,
      format: 'fb2',
      fileSizeBytes: data.byteLength,
      coverBlobUrl: book.metadata.coverBlobUrl,
      importedAt: Date.now(),
      progress: {
        bookId,
        percent: 0,
        currentSpineIndex: 0,
        totalSpineItems: book.spine.length,
        updatedAt: Date.now(),
      },
    };

    await localDb.saveBook(metadata, data, book.metadata.coverData, book.metadata.coverMediaType);
    return metadata;
  }

  private static async importTextDocument(
    fileName: string,
    data: ArrayBuffer,
    format: 'md' | 'txt'
  ): Promise<BookMetadata> {
    const { book } = await TextEngine.parseTextDocument(data.slice(0), fileName, format);
    const bookId = `${format}-${fileName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}`;

    const metadata: BookMetadata = {
      id: bookId,
      title: book.metadata.title,
      creator: book.metadata.creator || (format === 'md' ? 'Markdown Author' : 'Plain Text Author'),
      description: book.metadata.description,
      format,
      fileSizeBytes: data.byteLength,
      coverBlobUrl: book.metadata.coverBlobUrl,
      importedAt: Date.now(),
      progress: {
        bookId,
        percent: 0,
        currentSpineIndex: 0,
        totalSpineItems: book.spine.length,
        updatedAt: Date.now(),
      },
    };

    await localDb.saveBook(metadata, data, book.metadata.coverData, book.metadata.coverMediaType);
    return metadata;
  }

  private static async importPdf(fileName: string, data: ArrayBuffer): Promise<BookMetadata> {
    const { document, handle } = await PdfEngine.parsePdf(data.slice(0), fileName);
    const bookId = document.id;

    let coverBlobUrl: string | undefined;
    try {
      coverBlobUrl = await handle.getPageThumbnail(1, 240);
    } catch {
      // Ignore
    }

    const metadata: BookMetadata = {
      id: bookId,
      title: document.metadata.title,
      creator: document.metadata.author || 'PDF Document',
      description: document.metadata.subject,
      format: 'pdf',
      fileSizeBytes: data.byteLength,
      coverBlobUrl,
      importedAt: Date.now(),
      progress: {
        bookId,
        percent: 0,
        pageNumber: 1,
        updatedAt: Date.now(),
      },
    };

    await localDb.saveBook(metadata, data);
    return metadata;
  }

  private static async importDjvu(fileName: string, data: ArrayBuffer): Promise<BookMetadata> {
    const { document, handle } = await DjvuEngine.parseDjvu(data.slice(0), fileName);
    const bookId = document.id;

    let coverBlobUrl: string | undefined;
    try {
      coverBlobUrl = await handle.getPageThumbnail(1, 240);
    } catch {
      // Ignore
    }

    const metadata: BookMetadata = {
      id: bookId,
      title: document.metadata.title,
      creator: document.metadata.author || 'DjVu Scanned Document',
      format: 'djvu',
      fileSizeBytes: data.byteLength,
      coverBlobUrl,
      importedAt: Date.now(),
      progress: {
        bookId,
        percent: 0,
        pageNumber: 1,
        updatedAt: Date.now(),
      },
    };

    await localDb.saveBook(metadata, data);
    return metadata;
  }

  private static async importGenericDocument(
    cleanTitle: string,
    fileName: string,
    data: ArrayBuffer,
    format: BookFormat
  ): Promise<BookMetadata> {
    const bookId = `${format}-${fileName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}`;

    const metadata: BookMetadata = {
      id: bookId,
      title: cleanTitle,
      creator: format.toUpperCase() + ' Document',
      format,
      fileSizeBytes: data.byteLength,
      importedAt: Date.now(),
      progress: {
        bookId,
        percent: 0,
        updatedAt: Date.now(),
      },
    };

    await localDb.saveBook(metadata, data);
    return metadata;
  }
}

