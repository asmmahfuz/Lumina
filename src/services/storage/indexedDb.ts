/** Lumina Reader - IndexedDB Storage Engine */
import {
  BookMetadata, ReaderSettings, ReadingProgress,
  DEFAULT_READER_SETTINGS, Bookmark, Annotation,
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

function promisifyReq<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
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
        const stores: [string, string][] = [
          ['books', 'id'], ['reading_progress', 'bookId'], ['book_blobs', 'bookId'],
          ['settings', 'id'], ['book_covers', 'bookId'], ['bookmarks', 'id'], ['annotations', 'id'],
        ];
        for (const [name, keyPath] of stores) {
          if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.pruneOldBlobsOnStartup(request.result);
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
    _fileBlob?: ArrayBuffer,
    coverData?: ArrayBuffer,
    coverMime?: string
  ): Promise<void> {
    const db = await this.getDb();
    const stores = ['books', 'book_covers'];
    const tx = db.transaction(stores, 'readwrite');
    tx.objectStore('books').put(book);
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
    const req = db.transaction('books', 'readonly').objectStore('books').get(id);
    const book = ((await promisifyReq(req)) as BookMetadata | undefined) || null;
    if (book) {
      const coverUrl = await this.getCoverObjectUrl(book.id);
      if (coverUrl) book.coverBlobUrl = coverUrl;
    }
    return book;
  }

  public async getAllBooks(): Promise<BookMetadata[]> {
    const db = await this.getDb();
    const req = db.transaction('books', 'readonly').objectStore('books').getAll();
    const books = ((await promisifyReq(req)) || []) as BookMetadata[];
    await Promise.all(
      books.map(async (book) => {
        const coverUrl = await this.getCoverObjectUrl(book.id);
        if (coverUrl) book.coverBlobUrl = coverUrl;
      })
    );
    return books;
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

  public async clearAllBooks(): Promise<void> {
    const db = await this.getDb();
    const stores = ['books', 'book_blobs', 'reading_progress', 'book_covers', 'bookmarks', 'annotations'];
    const tx = db.transaction(stores, 'readwrite');
    stores.forEach((s) => tx.objectStore(s).clear());
    for (const url of this.coverUrlCache.values()) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }
    this.coverUrlCache.clear();
    return promisifyTx(tx);
  }

  public async getBookBlob(bookId: string): Promise<ArrayBuffer | null> {
    const db = await this.getDb();
    const req = db.transaction('book_blobs', 'readonly').objectStore('book_blobs').get(bookId);
    const res = (await promisifyReq(req)) as { bookId: string; data: ArrayBuffer } | undefined;
    return res ? res.data : null;
  }

  public async setActiveBookBlob(bookId: string, data: ArrayBuffer): Promise<void> {
    const db = await this.getDb();
    const tx = db.transaction('book_blobs', 'readwrite');
    const store = tx.objectStore('book_blobs');
    store.clear();
    store.put({ bookId, data });
    return promisifyTx(tx);
  }

  public async getActiveBookBlob(bookId: string): Promise<ArrayBuffer | null> {
    return this.getBookBlob(bookId);
  }

  public async pruneInactiveBlobs(activeBookId?: string): Promise<void> {
    const db = await this.getDb();
    const tx = db.transaction('book_blobs', 'readwrite');
    const store = tx.objectStore('book_blobs');
    const req = store.getAllKeys();
    return new Promise((resolve, reject) => {
      req.onsuccess = () => {
        const keys = (req.result || []) as string[];
        for (const key of keys) {
          if (!activeBookId || key !== activeBookId) store.delete(key);
        }
        promisifyTx(tx).then(resolve).catch(reject);
      };
      req.onerror = () => reject(req.error);
    });
  }

  private pruneOldBlobsOnStartup(db: IDBDatabase): void {
    try {
      if (!db.objectStoreNames.contains('book_blobs')) return;
      const tx = db.transaction('book_blobs', 'readwrite');
      const store = tx.objectStore('book_blobs');
      const countReq = store.count();
      countReq.onsuccess = () => {
        if (countReq.result > 1) {
          const keysReq = store.getAllKeys();
          keysReq.onsuccess = () => {
            const keys = (keysReq.result || []) as string[];
            for (let i = 0; i < keys.length - 1; i++) store.delete(keys[i]);
          };
        }
      };
    } catch {
      // ignore
    }
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
    const req = db.transaction('reading_progress', 'readonly').objectStore('reading_progress').get(bookId);
    return ((await promisifyReq(req)) as ReadingProgress | undefined) || null;
  }

  public async saveBookmark(bookmark: Bookmark): Promise<void> {
    const db = await this.getDb();
    const tx = db.transaction('bookmarks', 'readwrite');
    tx.objectStore('bookmarks').put(bookmark);
    return promisifyTx(tx);
  }

  public async getBookmarks(bookId: string): Promise<Bookmark[]> {
    const db = await this.getDb();
    const req = db.transaction('bookmarks', 'readonly').objectStore('bookmarks').getAll();
    const all = ((await promisifyReq(req)) || []) as Bookmark[];
    return all.filter((b) => b.bookId === bookId).sort((a, b) => b.createdAt - a.createdAt);
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
    const req = db.transaction('annotations', 'readonly').objectStore('annotations').getAll();
    const all = ((await promisifyReq(req)) || []) as Annotation[];
    return all.filter((a) => a.bookId === bookId).sort((a, b) => b.createdAt - a.createdAt);
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
