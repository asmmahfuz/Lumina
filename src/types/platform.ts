/**
 * Lumina Reader - Platform Abstraction Layer (PAL) Interface & Types
 * Decouples Desktop (Tauri/Rust/SQLite) from Modern Web (IndexedDB/Web APIs)
 */

import { BookFormat, BookMetadata, ReaderSettings, ReadingProgress, Bookmark, Annotation, HighlightColor } from './book';

export type { BookFormat, BookMetadata, ReaderSettings, ReadingProgress, Bookmark, Annotation, HighlightColor };

export type PlatformType = 'tauri' | 'web';

export interface FileFilter {
  name: string;
  extensions: string[];
}

export interface BookFile {
  name: string;
  size: number;
  filePath?: string;
  fileHandle?: FileSystemFileHandle;
  data?: ArrayBuffer;
  format: BookFormat;
}

export interface BookSource {
  bookId: string;
  filePath?: string;
  fileHandle?: FileSystemFileHandle;
  blob?: Blob;
}

export interface IPlatformAdapter {
  readonly platformType: PlatformType;

  /** Initialize underlying storage or IPC channel */
  init(): Promise<void>;

  /** Prompt user to pick a book file */
  openFileDialog(filter?: FileFilter): Promise<BookFile | null>;

  /** Read entire book archive binary data into memory */
  readBookArchive(source: BookSource): Promise<ArrayBuffer>;

  /** Persist book metadata entry in local storage/database */
  saveBookMetadata(book: BookMetadata): Promise<void>;

  /** Retrieve all indexed books from local library catalog */
  getAllBooks(): Promise<BookMetadata[]>;

  /** Remove a book and its associated reading data from local storage */
  deleteBook(bookId: string): Promise<void>;

  /** Clear all books and reading history from local storage while preserving settings */
  clearAllBooks(): Promise<void>;

  /** Save persistent reading position (CFI or page offset) */
  updateReadingProgress(bookId: string, progress: ReadingProgress): Promise<void>;

  /** Add or update a bookmark */
  saveBookmark(bookmark: Bookmark): Promise<void>;

  /** Retrieve all bookmarks for a specific book */
  getBookmarks(bookId: string): Promise<Bookmark[]>;

  /** Delete a bookmark by ID */
  deleteBookmark(bookmarkId: string): Promise<void>;

  /** Add or update an annotation/highlight */
  saveAnnotation(annotation: Annotation): Promise<void>;

  /** Retrieve all annotations for a specific book */
  getAnnotations(bookId: string): Promise<Annotation[]>;

  /** Delete an annotation by ID */
  deleteAnnotation(annotationId: string): Promise<void>;

  /** Extract or retrieve cached cover image object URL */
  extractCover(bookId: string): Promise<string | null>;

  /** Load persistent reader settings */
  getSettings(): Promise<ReaderSettings>;

  /** Save persistent reader settings */
  saveSettings(settings: ReaderSettings): Promise<void>;
}

export const SUPPORTED_BOOK_EXTENSIONS: string[] = [
  'epub',
  'pdf',
  'cbz',
  'cbr',
  'cbt',
  'cb7',
  'djvu',
  'mobi',
  'azw3',
  'fb2',
  'md',
  'txt',
];
