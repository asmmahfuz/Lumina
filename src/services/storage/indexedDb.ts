/**
 * Lumina Reader - IndexedDB Storage Engine
 * Offline-first local database for books catalog, reading positions, cover caches, bookmarks, and annotations
 */

import {
  BookMetadata,
  ReaderSettings,
  ReadingProgress,
  DEFAULT_READER_SETTINGS,
  Bookmark,
  Annotation,
} from '@/types/book';

const DB_NAME = 'lumina_reader_db';
const DB_VERSION = 3;

export interface StoredCoverData {
  bookId: string;
  data: ArrayBuffer;
  mimeType: string;
}

function promisifyTx(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export class IndexedDbStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;
  private coverUrlCache: Map<string, string> = new Map();

  public async getDb(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('books')) {
          db.createObjectStore('books', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('reading_progress')) {
          db.createObjectStore('reading_progress', { keyPath: 'bookId' });
        }
        if (!db.objectStoreNames.contains('book_blobs')) {
          db.createObjectStore('book_blobs', { keyPath: 'bookId' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('book_covers')) {
          db.createObjectStore('book_covers', { keyPath: 'bookId' });
        }
        if (!db.objectStoreNames.contains('bookmarks')) {
          db.createObjectStore('bookmarks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('annotations')) {
          db.createObjectStore('annotations', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error || new Error('Failed to open IndexedDB'));
      };
    });

    return this.initPromise;
  }

  public async saveBook(
    book: BookMetadata,
    fileBlob?: ArrayBuffer,
    coverData?: ArrayBuffer,
    coverMime?: string
  ): Promise<void> {
    const db = await this.getDb();
    const stores = ['books', 'book_blobs', 'book_covers'];
    const tx = db.transaction(stores, 'readwrite');

    tx.objectStore('books').put(book);
    if (fileBlob) {
      tx.objectStore('book_blobs').put({ bookId: book.id, data: fileBlob });
    }
    if (coverData) {
      tx.objectStore('book_covers').put({
        bookId: book.id,
        data: coverData,
        mimeType: coverMime || 'image/jpeg',
      });
    }
    return promisifyTx(tx);
  }

  public async getBook(id: string): Promise<BookMetadata | null> {
    const db = await this.getDb();
    const tx = db.transaction('books', 'readonly');
    const request = tx.objectStore('books').get(id);

    return new Promise((resolve, reject) => {
      request.onsuccess = async () => {
        const book = request.result as BookMetadata | undefined;
        if (!book) {
          resolve(null);
          return;
        }
        const coverUrl = await this.getCoverObjectUrl(book.id);
        if (coverUrl) book.coverBlobUrl = coverUrl;
        resolve(book);
      };
      request.onerror = () => reject(request.error);
    });
  }

  public async getAllBooks(): Promise<BookMetadata[]> {
    const db = await this.getDb();
    const tx = db.transaction('books', 'readonly');
    const request = tx.objectStore('books').getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = async () => {
        const books = (request.result || []) as BookMetadata[];
        for (const book of books) {
          const coverUrl = await this.getCoverObjectUrl(book.id);
          if (coverUrl) book.coverBlobUrl = coverUrl;
        }
        resolve(books);
      };
      request.onerror = () => reject(request.error);
    });
  }

  public async deleteBook(id: string): Promise<void> {
    const db = await this.getDb();
    const stores = ['books', 'book_blobs', 'reading_progress', 'book_covers', 'bookmarks', 'annotations'];
    const tx = db.transaction(stores, 'readwrite');
    tx.objectStore('books').delete(id);
    tx.objectStore('book_blobs').delete(id);
    tx.objectStore('reading_progress').delete(id);
    tx.objectStore('book_covers').delete(id);

    const cachedUrl = this.coverUrlCache.get(id);
    if (cachedUrl) {
      try {
        URL.revokeObjectURL(cachedUrl);
      } catch {
        // ignore
      }
      this.coverUrlCache.delete(id);
    }
    return promisifyTx(tx);
  }

  public async getBookBlob(bookId: string): Promise<ArrayBuffer | null> {
    const db = await this.getDb();
    const tx = db.transaction('book_blobs', 'readonly');
    const request = tx.objectStore('book_blobs').get(bookId);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result ? request.result.data : null);
      request.onerror = () => reject(request.error);
    });
  }

  public async saveBookBlob(bookId: string, data: ArrayBuffer): Promise<void> {
    const db = await this.getDb();
    const tx = db.transaction('book_blobs', 'readwrite');
    tx.objectStore('book_blobs').put({ bookId, data });
    return promisifyTx(tx);
  }

  public async saveBookCover(bookId: string, data: ArrayBuffer, mimeType = 'image/jpeg'): Promise<void> {
    const db = await this.getDb();
    const tx = db.transaction('book_covers', 'readwrite');
    tx.objectStore('book_covers').put({ bookId, data, mimeType });
    return promisifyTx(tx);
  }

  public async getCoverObjectUrl(bookId: string): Promise<string | null> {
    if (this.coverUrlCache.has(bookId)) {
      return this.coverUrlCache.get(bookId)!;
    }

    const db = await this.getDb();
    const tx = db.transaction('book_covers', 'readonly');
    const request = tx.objectStore('book_covers').get(bookId);

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const stored = request.result as StoredCoverData | undefined;
        if (stored && stored.data) {
          const blob = new Blob([stored.data], { type: stored.mimeType || 'image/jpeg' });
          const url = URL.createObjectURL(blob);
          this.coverUrlCache.set(bookId, url);
          resolve(url);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  }

  public async saveReadingProgress(progress: ReadingProgress): Promise<void> {
    const db = await this.getDb();
    const tx = db.transaction(['reading_progress', 'books'], 'readwrite');
    tx.objectStore('reading_progress').put(progress);

    const bookStore = tx.objectStore('books');
    const getReq = bookStore.get(progress.bookId);
    getReq.onsuccess = () => {
      const book = getReq.result as BookMetadata | undefined;
      if (book) {
        book.progress = progress;
        book.lastReadAt = progress.updatedAt;
        bookStore.put(book);
      }
    };
    return promisifyTx(tx);
  }

  public async getReadingProgress(bookId: string): Promise<ReadingProgress | null> {
    const db = await this.getDb();
    const tx = db.transaction('reading_progress', 'readonly');
    const request = tx.objectStore('reading_progress').get(bookId);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  public async saveBookmark(bookmark: Bookmark): Promise<void> {
    const db = await this.getDb();
    const tx = db.transaction('bookmarks', 'readwrite');
    tx.objectStore('bookmarks').put(bookmark);
    return promisifyTx(tx);
  }

  public async getBookmarks(bookId: string): Promise<Bookmark[]> {
    const db = await this.getDb();
    const tx = db.transaction('bookmarks', 'readonly');
    const request = tx.objectStore('bookmarks').getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const all = (request.result || []) as Bookmark[];
        const filtered = all.filter((b) => b.bookId === bookId);
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        resolve(filtered);
      };
      request.onerror = () => reject(request.error);
    });
  }

  public async deleteBookmark(bookmarkId: string): Promise<void> {
    const db = await this.getDb();
    const tx = db.transaction('bookmarks', 'readwrite');
    tx.objectStore('bookmarks').delete(bookmarkId);
    return promisifyTx(tx);
  }

  public async saveAnnotation(annotation: Annotation): Promise<void> {
    const db = await this.getDb();
    const tx = db.transaction('annotations', 'readwrite');
    tx.objectStore('annotations').put(annotation);
    return promisifyTx(tx);
  }

  public async getAnnotations(bookId: string): Promise<Annotation[]> {
    const db = await this.getDb();
    const tx = db.transaction('annotations', 'readonly');
    const request = tx.objectStore('annotations').getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const all = (request.result || []) as Annotation[];
        const filtered = all.filter((a) => a.bookId === bookId);
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        resolve(filtered);
      };
      request.onerror = () => reject(request.error);
    });
  }

  public async deleteAnnotation(annotationId: string): Promise<void> {
    const db = await this.getDb();
    const tx = db.transaction('annotations', 'readwrite');
    tx.objectStore('annotations').delete(annotationId);
    return promisifyTx(tx);
  }

  public async saveSettings(settings: ReaderSettings): Promise<void> {
    const db = await this.getDb();
    const tx = db.transaction('settings', 'readwrite');
    tx.objectStore('settings').put({ id: 'current', ...settings });
    return promisifyTx(tx);
  }

  public async getSettings(): Promise<ReaderSettings> {
    const db = await this.getDb();
    const tx = db.transaction('settings', 'readonly');
    const request = tx.objectStore('settings').get('current');

    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result) {
          const { id: _, ...rest } = request.result;
          resolve(rest as ReaderSettings);
        } else {
          resolve(DEFAULT_READER_SETTINGS);
        }
      };
      request.onerror = () => resolve(DEFAULT_READER_SETTINGS);
    });
  }
}

export const localDb = new IndexedDbStorage();
