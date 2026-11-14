/**
 * Lumina Reader - Web Platform Adapter
 * Implements IPlatformAdapter using modern Web APIs (File Picker, IndexedDB)
 */

import {
  BookFile,
  BookFormat,
  BookMetadata,
  BookSource,
  FileFilter,
  IPlatformAdapter,
  PlatformType,
  ReaderSettings,
  ReadingProgress,
  Bookmark,
  Annotation,
  SUPPORTED_BOOK_EXTENSIONS,
} from '@/types/platform';
import { localDb } from '@/services/storage/indexedDb';

export class WebAdapter implements IPlatformAdapter {
  public readonly platformType: PlatformType = 'web';

  public async init(): Promise<void> {
    await localDb.getDb();
  }

  public async openFileDialog(filter?: FileFilter): Promise<BookFile | null> {
    const extensions = filter?.extensions || SUPPORTED_BOOK_EXTENSIONS;

    // Modern Web File System Access API
    if (typeof window !== 'undefined' && 'showOpenFilePicker' in window) {
      try {
        const pickerTypes = [
          {
            description: filter?.name || 'Supported E-Books and Documents',
            accept: {
              'application/octet-stream': extensions.map((ext) => `.${ext}`),
            },
          },
        ];
        // @ts-expect-error - File System Access API types
        const [handle] = await window.showOpenFilePicker({ types: pickerTypes, multiple: false });
        if (handle) {
          const file = await handle.getFile();
          const ext = file.name.split('.').pop()?.toLowerCase() || '';
          const format = ext as BookFormat;
          const arrayBuffer = await file.arrayBuffer();
          return {
            name: file.name,
            size: file.size,
            filePath: file.name,
            fileHandle: handle,
            data: arrayBuffer,
            format,
          };
        }
      } catch (err) {
        // If user cancelled, return null
        if (err instanceof Error && err.name === 'AbortError') return null;
        // Otherwise fall through to standard file input
      }
    }

    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = extensions.map((ext) => `.${ext}`).join(',');

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const format = ext as BookFormat;
        const arrayBuffer = await file.arrayBuffer();

        resolve({
          name: file.name,
          size: file.size,
          filePath: file.name,
          data: arrayBuffer,
          format,
        });
      };

      input.oncancel = () => resolve(null);
      input.click();
    });
  }

  public async readBookArchive(source: BookSource): Promise<ArrayBuffer> {
    if (source.blob) {
      return await source.blob.arrayBuffer();
    }
    const data = await localDb.getBookBlob(source.bookId);
    if (data) {
      return data;
    }

    // Tier 2: Check for FileSystemFileHandle on source or book metadata
    let handle = source.fileHandle;
    if (!handle) {
      const book = await localDb.getBook(source.bookId);
      if (book?.fileHandle) {
        handle = book.fileHandle;
      }
    }

    if (handle) {
      try {
        // @ts-expect-error - queryPermission mode
        let perm = await handle.queryPermission({ mode: 'read' });
        if (perm !== 'granted') {
          // @ts-expect-error - requestPermission mode
          perm = await handle.requestPermission({ mode: 'read' });
        }
        if (perm === 'granted') {
          const file = await handle.getFile();
          const arrayBuffer = await file.arrayBuffer();
          await localDb.setActiveBookBlob(source.bookId, arrayBuffer);
          return arrayBuffer;
        }
      } catch (err) {
        console.warn('Failed to read from FileSystemFileHandle:', err);
      }
    }

    throw new Error(`OFFLINE_FILE_NOT_CACHED:${source.bookId}`);
  }

  public async saveBookMetadata(book: BookMetadata): Promise<void> {
    await localDb.saveBook(book);
  }

  public async getAllBooks(): Promise<BookMetadata[]> {
    return await localDb.getAllBooks();
  }

  public async deleteBook(bookId: string): Promise<void> {
    await localDb.deleteBook(bookId);
  }

  public async clearAllBooks(): Promise<void> {
    await localDb.clearAllBooks();
  }

  public async updateReadingProgress(_bookId: string, progress: ReadingProgress): Promise<void> {
    await localDb.saveReadingProgress(progress);
  }

  public async saveBookmark(bookmark: Bookmark): Promise<void> {
    await localDb.saveBookmark(bookmark);
  }

  public async getBookmarks(bookId: string): Promise<Bookmark[]> {
    return await localDb.getBookmarks(bookId);
  }

  public async deleteBookmark(bookmarkId: string): Promise<void> {
    await localDb.deleteBookmark(bookmarkId);
  }

  public async saveAnnotation(annotation: Annotation): Promise<void> {
    await localDb.saveAnnotation(annotation);
  }

  public async getAnnotations(bookId: string): Promise<Annotation[]> {
    return await localDb.getAnnotations(bookId);
  }

  public async deleteAnnotation(annotationId: string): Promise<void> {
    await localDb.deleteAnnotation(annotationId);
  }

  public async extractCover(bookId: string): Promise<string | null> {
    return await localDb.getCoverObjectUrl(bookId);
  }

  public async getSettings(): Promise<ReaderSettings> {
    return await localDb.getSettings();
  }

  public async saveSettings(settings: ReaderSettings): Promise<void> {
    await localDb.saveSettings(settings);
  }
}
