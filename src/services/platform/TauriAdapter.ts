/**
 * Lumina Reader - Tauri Desktop Platform Adapter
 * Implements IPlatformAdapter using native Rust IPC via Tauri 2.0
 */

import {
  BookFile,
  BookMetadata,
  BookSource,
  FileFilter,
  IPlatformAdapter,
  PlatformType,
  ReaderSettings,
  ReadingProgress,
  Bookmark,
  Annotation,
} from '@/types/platform';
import { WebAdapter } from './WebAdapter';

export interface SystemInfoResponse {
  app_name: string;
  version: string;
  os: string;
  arch: string;
  local_first: boolean;
}

export class TauriAdapter implements IPlatformAdapter {
  public readonly platformType: PlatformType = 'tauri';
  private fallbackAdapter = new WebAdapter();

  public async init(): Promise<void> {
    await this.fallbackAdapter.init();
  }

  public async isTauriAvailable(): Promise<boolean> {
    return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  }

  public async getSystemInfo(): Promise<SystemInfoResponse | null> {
    if (await this.isTauriAvailable()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<SystemInfoResponse>('get_system_info');
      } catch (err) {
        console.warn('Failed to invoke get_system_info from Tauri:', err);
      }
    }
    return null;
  }

  public async openFileDialog(filter?: FileFilter): Promise<BookFile | null> {
    // For web preview & unified cross-platform behavior, delegate to standard file picker
    return await this.fallbackAdapter.openFileDialog(filter);
  }

  public async readBookArchive(source: BookSource): Promise<ArrayBuffer> {
    return await this.fallbackAdapter.readBookArchive(source);
  }

  public async saveBookMetadata(book: BookMetadata): Promise<void> {
    await this.fallbackAdapter.saveBookMetadata(book);
  }

  public async getAllBooks(): Promise<BookMetadata[]> {
    return await this.fallbackAdapter.getAllBooks();
  }

  public async deleteBook(bookId: string): Promise<void> {
    await this.fallbackAdapter.deleteBook(bookId);
  }

  public async updateReadingProgress(bookId: string, progress: ReadingProgress): Promise<void> {
    await this.fallbackAdapter.updateReadingProgress(bookId, progress);
  }

  public async saveBookmark(bookmark: Bookmark): Promise<void> {
    await this.fallbackAdapter.saveBookmark(bookmark);
  }

  public async getBookmarks(bookId: string): Promise<Bookmark[]> {
    return await this.fallbackAdapter.getBookmarks(bookId);
  }

  public async deleteBookmark(bookmarkId: string): Promise<void> {
    await this.fallbackAdapter.deleteBookmark(bookmarkId);
  }

  public async saveAnnotation(annotation: Annotation): Promise<void> {
    await this.fallbackAdapter.saveAnnotation(annotation);
  }

  public async getAnnotations(bookId: string): Promise<Annotation[]> {
    return await this.fallbackAdapter.getAnnotations(bookId);
  }

  public async deleteAnnotation(annotationId: string): Promise<void> {
    await this.fallbackAdapter.deleteAnnotation(annotationId);
  }

  public async extractCover(bookId: string): Promise<string | null> {
    return await this.fallbackAdapter.extractCover(bookId);
  }

  public async getSettings(): Promise<ReaderSettings> {
    return await this.fallbackAdapter.getSettings();
  }

  public async saveSettings(settings: ReaderSettings): Promise<void> {
    await this.fallbackAdapter.saveSettings(settings);
  }
}
