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

export interface ImportFileInput {
  name: string;
  data: ArrayBuffer;
  filePath?: string;
  fileHandle?: FileSystemFileHandle;
}

export class UniversalBookImporter {
  public static async importFile(file: ImportFileInput): Promise<BookMetadata> {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const format = (ext as BookFormat) || 'epub';
    const cleanBaseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    if (format === 'epub') {
      return await this.importEpub(file);
    } else if (['cbz', 'cbr', 'cbt', 'cb7'].includes(format)) {
      return await this.importComic(file, format as 'cbz' | 'cbr');
    } else if (format === 'pdf') {
      return await this.importPdf(file);
    } else if (format === 'djvu') {
      return await this.importDjvu(file);
    } else if (format === 'mobi' || format === 'azw3' || ext === 'azw') {
      return await this.importMobi(file, format === 'azw3' ? 'azw3' : 'mobi');
    } else if (format === 'fb2' || file.name.toLowerCase().endsWith('.fb2.zip')) {
      return await this.importFb2(file);
    } else if (format === 'md' || format === 'txt') {
      return await this.importTextDocument(file, format);
    } else {
      return await this.importGenericDocument(cleanBaseName, file, format);
    }
  }

  private static async persistImportedBook(
    metadata: BookMetadata,
    data: ArrayBuffer,
    coverData?: ArrayBuffer,
    coverMime?: string
  ): Promise<BookMetadata> {
    await localDb.saveBook(metadata, undefined, coverData, coverMime);
    await localDb.setActiveBookBlob(metadata.id, data);
    return metadata;
  }

  private static async importEpub(file: ImportFileInput): Promise<BookMetadata> {
    const { book } = await EpubEngine.parseEpub(file.data);
    const bookId =
      book.metadata.identifier ||
      file.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() ||
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
      fileSizeBytes: file.data.byteLength,
      coverBlobUrl: book.metadata.coverBlobUrl,
      importedAt: Date.now(),
      fileName: file.name,
      filePath: file.filePath,
      fileHandle: file.fileHandle,
      progress: {
        bookId,
        percent: 0,
        currentSpineIndex: 0,
        totalSpineItems: book.spine.length,
        updatedAt: Date.now(),
      },
    };

    return await this.persistImportedBook(metadata, file.data, book.metadata.coverData, book.metadata.coverMediaType);
  }

  private static async importComic(
    file: ImportFileInput,
    format: 'cbz' | 'cbr'
  ): Promise<BookMetadata> {
    const bookId = `comic-${file.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}`;
    const title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    let coverData: ArrayBuffer | undefined;
    let coverBlobUrl: string | undefined;

    try {
      const archive = await SafeArchiveReader.fromData(file.data);
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
      fileSizeBytes: file.data.byteLength,
      coverBlobUrl,
      importedAt: Date.now(),
      fileName: file.name,
      filePath: file.filePath,
      fileHandle: file.fileHandle,
      progress: {
        bookId,
        percent: 0,
        updatedAt: Date.now(),
      },
    };

    return await this.persistImportedBook(metadata, file.data, coverData, 'image/jpeg');
  }

  private static async importMobi(
    file: ImportFileInput,
    format: 'mobi' | 'azw3'
  ): Promise<BookMetadata> {
    const { book } = await MobiEngine.parseMobi(file.data.slice(0), file.name);
    const bookId = `${format}-${file.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}`;

    const metadata: BookMetadata = {
      id: bookId,
      title: book.metadata.title,
      creator: book.metadata.creator || 'Kindle Author',
      description: book.metadata.description,
      publisher: book.metadata.publisher,
      language: book.metadata.language || 'en',
      pubdate: book.metadata.pubdate,
      format,
      fileSizeBytes: file.data.byteLength,
      coverBlobUrl: book.metadata.coverBlobUrl,
      importedAt: Date.now(),
      fileName: file.name,
      filePath: file.filePath,
      fileHandle: file.fileHandle,
      progress: {
        bookId,
        percent: 0,
        currentSpineIndex: 0,
        totalSpineItems: book.spine.length,
        updatedAt: Date.now(),
      },
    };

    return await this.persistImportedBook(metadata, file.data, book.metadata.coverData, book.metadata.coverMediaType);
  }

  private static async importFb2(file: ImportFileInput): Promise<BookMetadata> {
    const { book } = await Fb2Engine.parseFb2(file.data.slice(0), file.name);
    const bookId = `fb2-${file.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}`;

    const metadata: BookMetadata = {
      id: bookId,
      title: book.metadata.title,
      creator: book.metadata.creator || 'FictionBook Author',
      description: book.metadata.description,
      publisher: book.metadata.publisher,
      language: book.metadata.language || 'en',
      pubdate: book.metadata.pubdate,
      format: 'fb2',
      fileSizeBytes: file.data.byteLength,
      coverBlobUrl: book.metadata.coverBlobUrl,
      importedAt: Date.now(),
      fileName: file.name,
      filePath: file.filePath,
      fileHandle: file.fileHandle,
      progress: {
        bookId,
        percent: 0,
        currentSpineIndex: 0,
        totalSpineItems: book.spine.length,
        updatedAt: Date.now(),
      },
    };

    return await this.persistImportedBook(metadata, file.data, book.metadata.coverData, book.metadata.coverMediaType);
  }

  private static async importTextDocument(
    file: ImportFileInput,
    format: 'md' | 'txt'
  ): Promise<BookMetadata> {
    const { book } = await TextEngine.parseTextDocument(file.data.slice(0), file.name, format);
    const bookId = `${format}-${file.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}`;

    const metadata: BookMetadata = {
      id: bookId,
      title: book.metadata.title,
      creator: book.metadata.creator || (format === 'md' ? 'Markdown Author' : 'Plain Text Author'),
      description: book.metadata.description,
      format,
      fileSizeBytes: file.data.byteLength,
      coverBlobUrl: book.metadata.coverBlobUrl,
      importedAt: Date.now(),
      fileName: file.name,
      filePath: file.filePath,
      fileHandle: file.fileHandle,
      progress: {
        bookId,
        percent: 0,
        currentSpineIndex: 0,
        totalSpineItems: book.spine.length,
        updatedAt: Date.now(),
      },
    };

    return await this.persistImportedBook(metadata, file.data, book.metadata.coverData, book.metadata.coverMediaType);
  }

  private static async importPdf(file: ImportFileInput): Promise<BookMetadata> {
    const { document, handle } = await PdfEngine.parsePdf(file.data.slice(0), file.name);
    const bookId = document.id;

    let coverBlobUrl: string | undefined;
    try {
      coverBlobUrl = await handle.getPageThumbnail(1, 240);
    } catch {
      // Ignore
    } finally {
      handle.destroy();
    }

    const metadata: BookMetadata = {
      id: bookId,
      title: document.metadata.title,
      creator: document.metadata.author || 'PDF Document',
      description: document.metadata.subject,
      format: 'pdf',
      fileSizeBytes: file.data.byteLength,
      coverBlobUrl,
      importedAt: Date.now(),
      fileName: file.name,
      filePath: file.filePath,
      fileHandle: file.fileHandle,
      progress: {
        bookId,
        percent: 0,
        pageNumber: 1,
        updatedAt: Date.now(),
      },
    };

    return await this.persistImportedBook(metadata, file.data);
  }

  private static async importDjvu(file: ImportFileInput): Promise<BookMetadata> {
    const { document, handle } = await DjvuEngine.parseDjvu(file.data.slice(0), file.name);
    const bookId = document.id;

    let coverBlobUrl: string | undefined;
    try {
      coverBlobUrl = await handle.getPageThumbnail(1, 240);
    } catch {
      // Ignore
    } finally {
      handle.destroy();
    }

    const metadata: BookMetadata = {
      id: bookId,
      title: document.metadata.title,
      creator: document.metadata.author || 'DjVu Scanned Document',
      format: 'djvu',
      fileSizeBytes: file.data.byteLength,
      coverBlobUrl,
      importedAt: Date.now(),
      fileName: file.name,
      filePath: file.filePath,
      fileHandle: file.fileHandle,
      progress: {
        bookId,
        percent: 0,
        pageNumber: 1,
        updatedAt: Date.now(),
      },
    };

    return await this.persistImportedBook(metadata, file.data);
  }

  private static async importGenericDocument(
    cleanTitle: string,
    file: ImportFileInput,
    format: BookFormat
  ): Promise<BookMetadata> {
    const bookId = `${format}-${file.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}`;

    const metadata: BookMetadata = {
      id: bookId,
      title: cleanTitle,
      creator: format.toUpperCase() + ' Document',
      format,
      fileSizeBytes: file.data.byteLength,
      importedAt: Date.now(),
      fileName: file.name,
      filePath: file.filePath,
      fileHandle: file.fileHandle,
      progress: {
        bookId,
        percent: 0,
        updatedAt: Date.now(),
      },
    };

    return await this.persistImportedBook(metadata, file.data);
  }
}
