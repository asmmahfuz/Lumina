/**
 * Lumina Reader - Reader Pagination & Gesture Controller Hook
 * Manages CSS multi-column page calculations, horizontal column sliding,
 * CFI-based position persistence, keyboard shortcuts, and touch gestures.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { ReaderTypography } from '@/types/book';
import { generateCfi, resolveCfi, findFirstVisibleElement } from './cfiTracker';

interface UseReaderPaginationProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  currentSpineIndex: number;
  totalSpineItems: number;
  spineId?: string;
  typography: ReaderTypography;
  initialCfi?: string;
  onSetSpineIndex: (index: number) => void;
  onCfiChange?: (cfi: string, percent: number) => void;
}

export function useReaderPagination({
  iframeRef,
  currentSpineIndex,
  totalSpineItems,
  spineId,
  typography,
  initialCfi,
  onSetSpineIndex,
  onCfiChange,
}: UseReaderPaginationProps) {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const isPaginated = typography.readingMode !== 'continuous';
  const isTwoPage = isPaginated && typography.twoPageSpread;
  const pageStep = isTwoPage ? 2 : 1;

  const currentCfiRef = useRef<string | undefined>(initialCfi);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Recalculates total pages based on iframe dimensions and content scroll width
  const recalculatePagination = useCallback(
    (targetCfiToRestore?: string) => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      const doc = iframe.contentDocument;
      const win = iframe.contentWindow;
      if (!doc || !win) return;

      if (!isPaginated) {
        setTotalPages(1);
        setCurrentPage(0);
        return;
      }

      const clientWidth = doc.documentElement.clientWidth || iframe.clientWidth || 1;
      const scrollWidth = doc.documentElement.scrollWidth;

      // Spreads calculation
      const totalSpreads = Math.max(1, Math.round(scrollWidth / clientWidth));
      const calculatedPages = isTwoPage ? totalSpreads * 2 : totalSpreads;
      setTotalPages(calculatedPages);

      // Restore position via CFI if provided
      const cfiToRestore = targetCfiToRestore || currentCfiRef.current;
      if (cfiToRestore) {
        const targetEl = resolveCfi(doc, cfiToRestore);
        if (targetEl) {
          const rect = targetEl.getBoundingClientRect();
          const elementLeft = rect.left + win.scrollX;
          const spreadIndex = Math.max(0, Math.floor(elementLeft / clientWidth));
          const restoredPage = Math.min(
            calculatedPages - 1,
            spreadIndex * (isTwoPage ? 2 : 1)
          );
          setCurrentPage(restoredPage);
          win.scrollTo({ left: spreadIndex * clientWidth, top: 0, behavior: 'instant' });
          return;
        }
      }

      // Clamp current page
      setCurrentPage((prev) => {
        const clamped = Math.min(prev, Math.max(0, calculatedPages - 1));
        const spreadIndex = isTwoPage ? Math.floor(clamped / 2) : clamped;
        win.scrollTo({ left: spreadIndex * clientWidth, top: 0, behavior: 'instant' });
        return clamped;
      });
    },
    [iframeRef, isPaginated, isTwoPage]
  );

  // Smoothly scrolls to a specific page index
  const goToPage = useCallback(
    (pageIndex: number, smooth = true) => {
      const iframe = iframeRef.current;
      if (!iframe || !isPaginated) return;

      const doc = iframe.contentDocument;
      const win = iframe.contentWindow;
      if (!doc || !win) return;

      const clampedPage = Math.max(0, Math.min(pageIndex, totalPages - 1));
      const clientWidth = doc.documentElement.clientWidth || iframe.clientWidth || 1;
      const spreadIndex = isTwoPage ? Math.floor(clampedPage / 2) : clampedPage;
      const targetScrollLeft = spreadIndex * clientWidth;

      win.scrollTo({
        left: targetScrollLeft,
        top: 0,
        behavior: smooth ? 'smooth' : 'instant',
      });

      setCurrentPage(clampedPage);

      // Track CFI and compute reading progress
      try {
        const visibleEl = findFirstVisibleElement(doc, win, true, targetScrollLeft, clientWidth);
        if (visibleEl) {
          const newCfi = generateCfi(visibleEl, currentSpineIndex, spineId);
          currentCfiRef.current = newCfi;

          // Calculate chapter percentage
          const chapterPercent = totalPages > 1 ? (clampedPage / (totalPages - 1)) : 1;
          const overallPercent = Math.round(
            ((currentSpineIndex + chapterPercent) / totalSpineItems) * 100
          );
          onCfiChange?.(newCfi, Math.min(100, Math.max(0, overallPercent)));
        }
      } catch (err) {
        console.warn('CFI update error:', err);
      }
    },
    [iframeRef, isPaginated, totalPages, isTwoPage, currentSpineIndex, spineId, totalSpineItems, onCfiChange]
  );

  // Turn to Next Page or Next Chapter
  const handleNext = useCallback(() => {
    if (!isPaginated) {
      if (currentSpineIndex < totalSpineItems - 1) {
        onSetSpineIndex(currentSpineIndex + 1);
      }
      return;
    }

    if (currentPage + pageStep < totalPages) {
      goToPage(currentPage + pageStep);
    } else if (currentSpineIndex < totalSpineItems - 1) {
      // Advance to next chapter, starting at page 0
      onSetSpineIndex(currentSpineIndex + 1);
      setCurrentPage(0);
      currentCfiRef.current = undefined;
    }
  }, [isPaginated, currentPage, pageStep, totalPages, currentSpineIndex, totalSpineItems, goToPage, onSetSpineIndex]);

  // Turn to Prev Page or Prev Chapter
  const handlePrev = useCallback(() => {
    if (!isPaginated) {
      if (currentSpineIndex > 0) {
        onSetSpineIndex(currentSpineIndex - 1);
      }
      return;
    }

    if (currentPage > 0) {
      goToPage(Math.max(0, currentPage - pageStep));
    } else if (currentSpineIndex > 0) {
      // Step to previous chapter
      onSetSpineIndex(currentSpineIndex - 1);
      setCurrentPage(0);
      currentCfiRef.current = undefined;
    }
  }, [isPaginated, currentPage, pageStep, currentSpineIndex, goToPage, onSetSpineIndex]);

  // Comprehensive keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ' || e.key === 'j' || e.key === 'l') {
        if (e.key === ' ' && e.shiftKey) {
          e.preventDefault();
          handlePrev();
        } else {
          e.preventDefault();
          handleNext();
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'k' || e.key === 'h') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToPage(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goToPage(totalPages - 1);
      } else if (e.key === ']') {
        e.preventDefault();
        if (currentSpineIndex < totalSpineItems - 1) onSetSpineIndex(currentSpineIndex + 1);
      } else if (e.key === '[') {
        e.preventDefault();
        if (currentSpineIndex > 0) onSetSpineIndex(currentSpineIndex - 1);
      }
    },
    [handleNext, handlePrev, goToPage, totalPages, currentSpineIndex, totalSpineItems, onSetSpineIndex]
  );

  // Attach touch listeners to any document
  const attachTouchListeners = useCallback(
    (target: EventTarget) => {
      const onTouchStart = (e: TouchEvent) => {
        const touch = e.touches[0];
        if (touch) {
          touchStartRef.current = { x: touch.clientX, y: touch.clientY };
        }
      };

      const onTouchEnd = (e: TouchEvent) => {
        if (!touchStartRef.current) return;
        const touch = e.changedTouches[0];
        if (!touch) return;

        const deltaX = touch.clientX - touchStartRef.current.x;
        const deltaY = touch.clientY - touchStartRef.current.y;
        touchStartRef.current = null;

        // Minimum swipe distance 40px and dominant horizontal movement
        if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
          if (deltaX < 0) {
            handleNext();
          } else {
            handlePrev();
          }
        }
      };

      target.addEventListener('touchstart', onTouchStart as EventListener, { passive: true });
      target.addEventListener('touchend', onTouchEnd as EventListener, { passive: true });

      return () => {
        target.removeEventListener('touchstart', onTouchStart as EventListener);
        target.removeEventListener('touchend', onTouchEnd as EventListener);
      };
    },
    [handleNext, handlePrev]
  );

  // Window resize observer
  useEffect(() => {
    const handleResize = () => {
      recalculatePagination();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [recalculatePagination]);

  const canGoPrev = currentSpineIndex > 0 || currentPage > 0;
  const canGoNext =
    currentSpineIndex < totalSpineItems - 1 || (isPaginated && currentPage + pageStep < totalPages);
  const isChapterBoundaryPrev = currentPage === 0 && currentSpineIndex > 0;
  const isChapterBoundaryNext =
    (currentPage + pageStep >= totalPages || !isPaginated) &&
    currentSpineIndex < totalSpineItems - 1;

  return {
    currentPage,
    totalPages,
    isPaginated,
    isTwoPage,
    canGoPrev,
    canGoNext,
    isChapterBoundaryPrev,
    isChapterBoundaryNext,
    goToPage,
    handleNext,
    handlePrev,
    handleKeyDown,
    attachTouchListeners,
    recalculatePagination,
  };
}
