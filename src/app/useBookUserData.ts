/**
 * Lumina Reader - Book User Data Hook (Bookmarks & Annotations)
 * Manages loading, saving, toggling, and deleting bookmarks and annotations for the active book.
 */

import { useState, useCallback, useMemo } from 'react';
import { Bookmark, Annotation } from '@/types/book';
import { getPlatformAdapter } from '@/services/platform';

export function useBookUserData(
  bookId: string | null,
  currentSpineIndex: number,
  readingCfi?: string,
  chapterTitle?: string,
  onNotify?: (msg: string) => void
) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  const loadUserData = useCallback(async (id: string) => {
    try {
      const adapter = getPlatformAdapter();
      const [bmList, annList] = await Promise.all([
        adapter.getBookmarks(id),
        adapter.getAnnotations(id),
      ]);
      setBookmarks(bmList);
      setAnnotations(annList);
    } catch (err) {
      console.warn('Failed to load bookmarks or annotations:', err);
    }
  }, []);

  const isCurrentBookmarked = useMemo(() => {
    return bookmarks.some((b) => b.spineIndex === currentSpineIndex);
  }, [bookmarks, currentSpineIndex]);

  const handleAddCurrentBookmark = useCallback(async (customPageNumber?: number) => {
    if (!bookId) return;
    const pageNum = customPageNumber !== undefined ? customPageNumber : currentSpineIndex + 1;
    const title = chapterTitle || `Page ${pageNum}`;
    const newBookmark: Bookmark = {
      id: `bm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      bookId,
      title,
      spineIndex: currentSpineIndex,
      cfi: readingCfi,
      pageNumber: pageNum,
      createdAt: Date.now(),
    };
    try {
      const adapter = getPlatformAdapter();
      await adapter.saveBookmark(newBookmark);
      setBookmarks((prev) => [newBookmark, ...prev]);
      onNotify?.(`Bookmark added: ${title}`);
    } catch (err) {
      onNotify?.(`Failed to add bookmark: ${String(err)}`);
    }
  }, [bookId, chapterTitle, currentSpineIndex, readingCfi, onNotify]);

  const handleDeleteBookmark = useCallback(async (bookmarkId: string) => {
    try {
      const adapter = getPlatformAdapter();
      await adapter.deleteBookmark(bookmarkId);
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
      onNotify?.('Bookmark removed');
    } catch (err) {
      onNotify?.(`Failed to remove bookmark: ${String(err)}`);
    }
  }, [onNotify]);

  const handleToggleQuickBookmark = useCallback(async () => {
    const existing = bookmarks.find((b) => b.spineIndex === currentSpineIndex);
    if (existing) {
      await handleDeleteBookmark(existing.id);
    } else {
      await handleAddCurrentBookmark();
    }
  }, [bookmarks, currentSpineIndex, handleDeleteBookmark, handleAddCurrentBookmark]);

  const handleSaveAnnotation = useCallback(async (annotation: Annotation) => {
    try {
      const adapter = getPlatformAdapter();
      await adapter.saveAnnotation(annotation);
      setAnnotations((prev) => {
        const idx = prev.findIndex((a) => a.id === annotation.id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = annotation;
          return updated;
        }
        return [annotation, ...prev];
      });
      onNotify?.(annotation.note ? 'Sticky note saved' : 'Highlight saved');
    } catch (err) {
      onNotify?.(`Failed to save annotation: ${String(err)}`);
    }
  }, [onNotify]);

  const handleDeleteAnnotation = useCallback(async (annotationId: string) => {
    try {
      const adapter = getPlatformAdapter();
      await adapter.deleteAnnotation(annotationId);
      setAnnotations((prev) => prev.filter((a) => a.id !== annotationId));
      onNotify?.('Highlight removed');
    } catch (err) {
      onNotify?.(`Failed to delete annotation: ${String(err)}`);
    }
  }, [onNotify]);

  return {
    bookmarks,
    annotations,
    isCurrentBookmarked,
    loadUserData,
    handleAddCurrentBookmark,
    handleDeleteBookmark,
    handleToggleQuickBookmark,
    handleSaveAnnotation,
    handleDeleteAnnotation,
  };
}
