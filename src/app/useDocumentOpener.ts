/**
 * Lumina Reader - Universal Document Opener Hook
 * Handles format sniffing, decompression dispatch, and progress restoration across all formats
 */

import { BookMetadata } from '@/types/book';
import { ParsedEpubBook } from '@/types/epub';
import { ParsedComic } from '@/types/comic';
import { ParsedFixedDocument } from '@/types/pdf';
import { SafeArchiveReader } from '@/services/archive/safeDecompressor';
import { ComicImageStreamer } from '@/services/comic/comicImageStreamer';
import { PdfDocumentHandle, PdfEngine } from '@/services/pdf/pdfEngine';
import { DjvuDocumentHandle, DjvuEngine } from '@/services/djvu/djvuEngine';
import { EpubEngine } from '@/services/epub/epubEngine';
import { ComicEngine } from '@/services/comic/comicEngine';
import { MobiEngine } from '@/services/kindle/mobiEngine';
import { Fb2Engine } from '@/services/fb2/fb2Engine';
import { TextEngine } from '@/services/text/textEngine';
import { UniversalBookImporter } from '@/services/storage/bookImporter';
import { getPlatformAdapter } from '@/services/platform';
import { localDb } from '@/services/storage/indexedDb';

interface DocumentOpenerActions {
  handleReadBook: (book: ParsedEpubBook, archive: SafeArchiveReader, spineIndex: number, cfi?: string, id?: string) => Promise<void>;
  handleReadComic: (comic: ParsedComic, streamer: ComicImageStreamer, pageIndex: number, id?: string) => Promise<void>;
  handleReadPdf: (doc: ParsedFixedDocument, handle: PdfDocumentHandle, page: number, id?: string) => Promise<void>;
  handleReadDjvu: (doc: ParsedFixedDocument, handle: DjvuDocumentHandle, page: number, id?: string) => Promise<void>;
  showToast: (msg: string) => void;
  setActiveView: (view: 'library' | 'reader' | 'comic' | 'fixed' | 'scaffold' | 'epub-engine') => void;
  setLastOpenedBook: (name: string) => void;
}

export function useDocumentOpener({
  handleReadBook,
  handleReadComic,
  handleReadPdf,
  handleReadDjvu,
  showToast,
  setActiveView,
  setLastOpenedBook,
}: DocumentOpenerActions) {
  const handleBookOpened = async (bookName: string, fileData?: ArrayBuffer) => {
    setLastOpenedBook(bookName);
    if (fileData) {
      try {
        showToast(`Importing ${bookName}...`);
        const importedMeta = await UniversalBookImporter.importFile({
          name: bookName,
          data: fileData,
        });

        if (importedMeta.format === 'epub') {
          const { book, archive } = await EpubEngine.parseEpub(fileData);
          const savedProgress = await localDb.getReadingProgress(importedMeta.id);
          const resumeIndex = savedProgress?.currentSpineIndex ?? 0;
          await handleReadBook(book, archive, resumeIndex, savedProgress?.cfi, importedMeta.id);
          return;
        } else if (['cbz', 'cbr', 'cbt', 'cb7'].includes(importedMeta.format)) {
          const { comic, streamer } = await ComicEngine.parseComic(fileData, bookName);
          const savedProgress = await localDb.getReadingProgress(importedMeta.id);
          const resumeIndex = savedProgress?.pageNumber ? savedProgress.pageNumber - 1 : 0;
          await handleReadComic(comic, streamer, resumeIndex, importedMeta.id);
          return;
        } else if (importedMeta.format === 'pdf') {
          const { handle, document } = await PdfEngine.parsePdf(fileData, bookName);
          const savedProgress = await localDb.getReadingProgress(importedMeta.id);
          const resumePage = savedProgress?.pageNumber || 1;
          await handleReadPdf(document, handle, resumePage, importedMeta.id);
          return;
        } else if (importedMeta.format === 'djvu') {
          const { handle, document } = await DjvuEngine.parseDjvu(fileData, bookName);
          const savedProgress = await localDb.getReadingProgress(importedMeta.id);
          const resumePage = savedProgress?.pageNumber || 1;
          await handleReadDjvu(document, handle, resumePage, importedMeta.id);
          return;
        } else if (importedMeta.format === 'mobi' || importedMeta.format === 'azw3') {
          const { book, archive } = await MobiEngine.parseMobi(fileData, bookName);
          const savedProgress = await localDb.getReadingProgress(importedMeta.id);
          const resumeIndex = savedProgress?.currentSpineIndex ?? 0;
          await handleReadBook(book, archive, resumeIndex, savedProgress?.cfi, importedMeta.id);
          return;
        } else if (importedMeta.format === 'fb2') {
          const { book, archive } = await Fb2Engine.parseFb2(fileData, bookName);
          const savedProgress = await localDb.getReadingProgress(importedMeta.id);
          const resumeIndex = savedProgress?.currentSpineIndex ?? 0;
          await handleReadBook(book, archive, resumeIndex, savedProgress?.cfi, importedMeta.id);
          return;
        } else if (importedMeta.format === 'md' || importedMeta.format === 'txt') {
          const { book, archive } = await TextEngine.parseTextDocument(fileData, bookName, importedMeta.format);
          const savedProgress = await localDb.getReadingProgress(importedMeta.id);
          const resumeIndex = savedProgress?.currentSpineIndex ?? 0;
          await handleReadBook(book, archive, resumeIndex, savedProgress?.cfi, importedMeta.id);
          return;
        }

        showToast(`Imported ${bookName} (${importedMeta.format.toUpperCase()}) to Library`);
        setActiveView('library');
      } catch (err) {
        showToast(`Error importing ${bookName}: ${String(err)}`);
      }
      return;
    }
    showToast(`Book opened: ${bookName}`);
  };

  const handleOpenLibraryBook = async (book: BookMetadata) => {
    try {
      showToast(`Loading "${book.title}"...`);
      const adapter = getPlatformAdapter();
      const buffer = await adapter.readBookArchive({ bookId: book.id });

      if (book.format === 'epub') {
        const { book: parsedBook, archive } = await EpubEngine.parseEpub(buffer);
        const savedProgress = await localDb.getReadingProgress(book.id);
        const resumeIndex = savedProgress?.currentSpineIndex ?? book.progress?.currentSpineIndex ?? 0;
        await handleReadBook(parsedBook, archive, resumeIndex, savedProgress?.cfi ?? book.progress?.cfi, book.id);
      } else if (['cbz', 'cbr', 'cbt', 'cb7'].includes(book.format)) {
        const { comic, streamer } = await ComicEngine.parseComic(buffer, book.title);
        const savedProgress = await localDb.getReadingProgress(book.id);
        const resumeIndex = savedProgress?.pageNumber ? savedProgress.pageNumber - 1 : 0;
        await handleReadComic(comic, streamer, resumeIndex, book.id);
      } else if (book.format === 'pdf') {
        const { handle, document } = await PdfEngine.parsePdf(buffer, book.title);
        const savedProgress = await localDb.getReadingProgress(book.id);
        const resumePage = savedProgress?.pageNumber || book.progress?.pageNumber || 1;
        await handleReadPdf(document, handle, resumePage, book.id);
      } else if (book.format === 'djvu') {
        const { handle, document } = await DjvuEngine.parseDjvu(buffer, book.title);
        const savedProgress = await localDb.getReadingProgress(book.id);
        const resumePage = savedProgress?.pageNumber || book.progress?.pageNumber || 1;
        await handleReadDjvu(document, handle, resumePage, book.id);
      } else if (book.format === 'mobi' || book.format === 'azw3') {
        const { book: parsedBook, archive } = await MobiEngine.parseMobi(buffer, book.title);
        const savedProgress = await localDb.getReadingProgress(book.id);
        const resumeIndex = savedProgress?.currentSpineIndex ?? book.progress?.currentSpineIndex ?? 0;
        await handleReadBook(parsedBook, archive, resumeIndex, savedProgress?.cfi ?? book.progress?.cfi, book.id);
      } else if (book.format === 'fb2') {
        const { book: parsedBook, archive } = await Fb2Engine.parseFb2(buffer, book.title);
        const savedProgress = await localDb.getReadingProgress(book.id);
        const resumeIndex = savedProgress?.currentSpineIndex ?? book.progress?.currentSpineIndex ?? 0;
        await handleReadBook(parsedBook, archive, resumeIndex, savedProgress?.cfi ?? book.progress?.cfi, book.id);
      } else if (book.format === 'md' || book.format === 'txt') {
        const { book: parsedBook, archive } = await TextEngine.parseTextDocument(buffer, book.title, book.format);
        const savedProgress = await localDb.getReadingProgress(book.id);
        const resumeIndex = savedProgress?.currentSpineIndex ?? book.progress?.currentSpineIndex ?? 0;
        await handleReadBook(parsedBook, archive, resumeIndex, savedProgress?.cfi ?? book.progress?.cfi, book.id);
      } else {
        showToast(`Loaded ${book.title} (${book.format.toUpperCase()})`);
      }
    } catch (err) {
      console.warn('Could not read archive:', err);
      showToast(`Could not open "${book.title}": ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleOpenFileClick = async () => {
    try {
      const adapter = getPlatformAdapter();
      const file = await adapter.openFileDialog();
      if (file) await handleBookOpened(file.name, file.data);
    } catch (err) {
      console.warn('Open file error:', err);
    }
  };

  return {
    handleBookOpened,
    handleOpenLibraryBook,
    handleOpenFileClick,
  };
}
