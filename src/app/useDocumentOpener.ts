/**
 * Lumina Reader - Universal Document Opener Hook
 * Single-pass instant open with zero-copy desktop streaming and deferred background persistence.
 */

import { useEffect, useRef } from 'react';
import { BookFormat, BookMetadata } from '@/types/book';
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
import { getPlatformAdapter } from '@/services/platform';
import { TauriAdapter } from '@/services/platform/TauriAdapter';
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

const COMIC_FORMATS = new Set<string>(['cbz', 'cbr', 'cbt', 'cb7']);

function detectBookFormat(fileName: string): BookFormat {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.fb2.zip') || lower.endsWith('.fb2')) return 'fb2';
  const ext = lower.split('.').pop() || 'epub';
  if (ext === 'azw') return 'mobi';
  return ext as BookFormat;
}

function isRealDiskPath(path?: string): path is string {
  return Boolean(path && (path.includes('/') || path.includes('\\') || /^[A-Za-z]:/.test(path)));
}

function scheduleBackgroundPersist(
  metadata: BookMetadata,
  webBlobData?: ArrayBuffer,
  coverData?: ArrayBuffer,
  coverMime?: string
): void {
  setTimeout(() => {
    void (async () => {
      try {
        await localDb.saveBook(metadata, undefined, coverData, coverMime);
        if (webBlobData) await localDb.setActiveBookBlob(metadata.id, webBlobData);
      } catch (err) {
        console.warn('Background book persistence failed:', err);
      }
    })();
  }, 50);
}

export function useDocumentOpener({
  handleReadBook,
  handleReadComic,
  handleReadPdf,
  handleReadDjvu,
  showToast,
  setLastOpenedBook,
}: DocumentOpenerActions) {
  const openSinglePass = async (opts: {
    bookName: string;
    format: BookFormat;
    fileData?: ArrayBuffer;
    filePath?: string;
    fileHandle?: FileSystemFileHandle;
    existing?: BookMetadata;
  }) => {
    const { bookName, format, fileData, filePath, fileHandle, existing } = opts;
    setLastOpenedBook(bookName);
    const adapter = getPlatformAdapter();
    const tauriActive = adapter instanceof TauriAdapter && (await adapter.isTauriAvailable());
    const hasDiskPath = tauriActive && isRealDiskPath(filePath);
    const cleanTitle = bookName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();

    const bookId =
      existing?.id || `${format}-${bookName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}`;
    const savedProgress = existing ? await localDb.getReadingProgress(existing.id) : null;

    const getBufferOnce = async (): Promise<ArrayBuffer> => {
      if (fileData) return fileData;
      if (hasDiskPath) return await (adapter as TauriAdapter).readLocalFile(filePath);
      return await adapter.readBookArchive({ bookId, filePath, fileHandle });
    };

    const buildBaseMeta = (overrides: Partial<BookMetadata>): BookMetadata => ({
      id: bookId,
      title: existing?.title || cleanTitle,
      creator: existing?.creator || 'Unknown Author',
      format,
      fileSizeBytes: existing?.fileSizeBytes || fileData?.byteLength || 0,
      importedAt: existing?.importedAt || Date.now(),
      fileName: bookName,
      filePath: filePath || existing?.filePath || bookName,
      fileHandle: fileHandle || existing?.fileHandle,
      cachedPageSizes: existing?.cachedPageSizes,
      progress: savedProgress || existing?.progress || { bookId, percent: 0, updatedAt: Date.now() },
      ...overrides,
    });

    if (format === 'pdf') {
      const resumePage = savedProgress?.pageNumber || existing?.progress?.pageNumber || 1;
      let webCopyForIdb: ArrayBuffer | undefined;
      if (!hasDiskPath && fileData) webCopyForIdb = fileData.slice(0);

      const { handle, document } = hasDiskPath
        ? await PdfEngine.openFromPath(filePath, bookName, resumePage, existing?.cachedPageSizes)
        : await PdfEngine.parsePdf(await getBufferOnce(), bookName, resumePage, existing?.cachedPageSizes);

      await handleReadPdf(document, handle, resumePage, bookId);
      const meta = buildBaseMeta({
        title: document.metadata.title,
        creator: document.metadata.author || 'PDF Document',
        description: document.metadata.subject,
        fileSizeBytes: document.metadata.fileSizeBytes || existing?.fileSizeBytes || 0,
        progress: savedProgress || existing?.progress || { bookId, percent: 0, pageNumber: resumePage, updatedAt: Date.now() },
      });
      scheduleBackgroundPersist(meta, webCopyForIdb);

      if (!existing?.cachedPageSizes || existing.cachedPageSizes.length !== document.pages.length) {
        void handle.refinePageDimensionsInBackground(document.pages, (sizes) => {
          void localDb.saveBook({ ...meta, cachedPageSizes: sizes });
        });
      }
      return;
    }

    if (format === 'epub') {
      const buf = hasDiskPath ? undefined : await getBufferOnce();
      const { book, archive } = hasDiskPath
        ? await EpubEngine.parseEpubFromPath(filePath)
        : await EpubEngine.parseEpub(buf!);
      const resumeIdx = savedProgress?.currentSpineIndex ?? existing?.progress?.currentSpineIndex ?? 0;
      const resumeCfi = savedProgress?.cfi ?? existing?.progress?.cfi;
      await handleReadBook(book, archive, resumeIdx, resumeCfi, bookId);
      const meta = buildBaseMeta({
        title: book.metadata.title,
        creator: book.metadata.creator || 'Unknown Author',
        description: book.metadata.description,
        publisher: book.metadata.publisher,
        language: book.metadata.language || 'en',
        pubdate: book.metadata.pubdate,
        coverBlobUrl: book.metadata.coverBlobUrl,
        fileSizeBytes: buf?.byteLength || existing?.fileSizeBytes || 0,
        progress: savedProgress || existing?.progress || {
          bookId, percent: 0, currentSpineIndex: resumeIdx, totalSpineItems: book.spine.length, updatedAt: Date.now(),
        },
      });
      scheduleBackgroundPersist(meta, hasDiskPath ? undefined : buf, book.metadata.coverData, book.metadata.coverMediaType);
      return;
    }

    if (COMIC_FORMATS.has(format)) {
      const resumePage = savedProgress?.pageNumber || existing?.progress?.pageNumber || 1;
      const resumeIndex = Math.max(0, resumePage - 1);
      let webBuf: ArrayBuffer | undefined;
      let parsed: { comic: ParsedComic; streamer: ComicImageStreamer };
      if (hasDiskPath) {
        try {
          parsed = await ComicEngine.parseComicFromPath(filePath, bookName);
        } catch (zipErr) {
          if (format === 'cbr') {
            parsed = await ComicEngine.parseComic(await getBufferOnce(), bookName);
          } else {
            throw zipErr;
          }
        }
      } else {
        webBuf = await getBufferOnce();
        parsed = await ComicEngine.parseComic(webBuf, bookName);
      }
      await handleReadComic(parsed.comic, parsed.streamer, resumeIndex, bookId);
      const meta = buildBaseMeta({
        title: parsed.comic.metadata.title,
        creator: parsed.comic.metadata.writer || parsed.comic.metadata.series || 'Comic Archive',
        description: parsed.comic.metadata.summary,
        fileSizeBytes: webBuf?.byteLength || existing?.fileSizeBytes || 0,
        progress: savedProgress || existing?.progress || { bookId, percent: 0, pageNumber: resumePage, updatedAt: Date.now() },
      });
      scheduleBackgroundPersist(meta, webBuf);
      return;
    }

    const buffer = await getBufferOnce();
    if (format === 'djvu') {
      const resumePage = savedProgress?.pageNumber || existing?.progress?.pageNumber || 1;
      const { handle, document } = await DjvuEngine.parseDjvu(buffer, bookName);
      await handleReadDjvu(document, handle, resumePage, bookId);
      const meta = buildBaseMeta({
        title: document.metadata.title,
        creator: document.metadata.author || 'DjVu Scanned Document',
        fileSizeBytes: buffer.byteLength,
        progress: savedProgress || existing?.progress || { bookId, percent: 0, pageNumber: resumePage, updatedAt: Date.now() },
      });
      scheduleBackgroundPersist(meta, hasDiskPath ? undefined : buffer);
      return;
    }

    const parsedReflow =
      format === 'mobi' || format === 'azw3'
        ? await MobiEngine.parseMobi(buffer, bookName)
        : format === 'fb2'
        ? await Fb2Engine.parseFb2(buffer, bookName)
        : await TextEngine.parseTextDocument(buffer, bookName, format === 'md' ? 'md' : 'txt');

    const resumeIdx = savedProgress?.currentSpineIndex ?? existing?.progress?.currentSpineIndex ?? 0;
    const resumeCfi = savedProgress?.cfi ?? existing?.progress?.cfi;
    await handleReadBook(parsedReflow.book, parsedReflow.archive, resumeIdx, resumeCfi, bookId);
    const meta = buildBaseMeta({
      title: parsedReflow.book.metadata.title,
      creator: parsedReflow.book.metadata.creator || 'Unknown Author',
      description: parsedReflow.book.metadata.description,
      coverBlobUrl: parsedReflow.book.metadata.coverBlobUrl,
      fileSizeBytes: buffer.byteLength,
      progress: savedProgress || existing?.progress || {
        bookId, percent: 0, currentSpineIndex: resumeIdx, totalSpineItems: parsedReflow.book.spine.length, updatedAt: Date.now(),
      },
    });
    scheduleBackgroundPersist(
      meta,
      hasDiskPath ? undefined : buffer,
      parsedReflow.book.metadata.coverData,
      parsedReflow.book.metadata.coverMediaType
    );
  };

  const handleBookOpened = async (
    bookName: string,
    fileData?: ArrayBuffer,
    filePath?: string,
    fileHandle?: FileSystemFileHandle
  ) => {
    try {
      const format = detectBookFormat(bookName);
      const allBooks = await localDb.getAllBooks();
      const existing = allBooks.find((b) =>
        isRealDiskPath(filePath)
          ? b.filePath === filePath
          : b.fileName === bookName && b.format === format
      );
      await openSinglePass({ bookName, format, fileData, filePath, fileHandle, existing });
    } catch (err) {
      showToast(`Error opening ${bookName}: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleOpenLibraryBook = async (book: BookMetadata) => {
    try {
      await openSinglePass({
        bookName: book.fileName || `${book.title}.${book.format}`,
        format: book.format,
        filePath: book.filePath,
        fileHandle: book.fileHandle,
        existing: book,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('OFFLINE_FILE_NOT_CACHED') || msg.includes('not found') || msg.includes('No such file')) {
        showToast(`Locate "${book.fileName || book.title}" to reopen...`);
        try {
          const adapter = getPlatformAdapter();
          const picked = await adapter.openFileDialog({ name: `${book.format.toUpperCase()} Document`, extensions: [book.format] });
          if (picked) {
            const updated: BookMetadata = { ...book, fileHandle: picked.fileHandle, filePath: picked.filePath || picked.name, fileName: picked.name };
            await openSinglePass({ bookName: picked.name, format: book.format, fileData: picked.data, filePath: picked.filePath, fileHandle: picked.fileHandle, existing: updated });
            return;
          }
        } catch { /* ignore */ }
      }
      showToast(`Could not open "${book.title}": ${msg}`);
    }
  };

  const handleOpenFileClick = async () => {
    try {
      const picked = await getPlatformAdapter().openFileDialog();
      if (picked) await handleBookOpened(picked.name, picked.data, picked.filePath, picked.fileHandle);
    } catch (err) {
      console.warn('Open file error:', err);
    }
  };

  const startupCheckedRef = useRef(false);
  useEffect(() => {
    if (startupCheckedRef.current) return;
    startupCheckedRef.current = true;
    const adapter = getPlatformAdapter();
    if (!(adapter instanceof TauriAdapter)) return;

    void (async () => {
      const startupPath = await adapter.takeStartupFilePath();
      if (!startupPath) return;
      const fileName = startupPath.split(/[/\\]/).pop() || startupPath;
      await handleBookOpened(fileName, undefined, startupPath);
    })();
  }, []);

  return { handleBookOpened, handleOpenLibraryBook, handleOpenFileClick };
}
