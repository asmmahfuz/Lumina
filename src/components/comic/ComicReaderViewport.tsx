/**
 * Lumina Reader - Comic & Manga Master Viewport
 * Coordinates dual-page spreads, RTL Japanese manga order, Webtoon continuous scroll,
 * keyboard navigation, and reading progress auto-resume.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ParsedComic, ComicSettings, DEFAULT_COMIC_SETTINGS } from '@/types/comic';
import { ComicImageStreamer } from '@/services/comic/comicImageStreamer';
import { Bookmark } from '@/types/book';
import { useReaderToolbar } from '@/app/ReaderToolbarContext';
import { ComicSpreadView } from './ComicSpreadView';
import { ComicWebtoonView } from './ComicWebtoonView';
import { ComicFloatingNav } from './ComicFloatingNav';
import { ComicSidebar } from './ComicSidebar';
import { ComicSettingsModal } from './ComicSettingsModal';

interface ComicReaderViewportProps {
  comic: ParsedComic;
  streamer: ComicImageStreamer;
  initialPageIndex?: number;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onPageChange?: (pageIndex: number, percent: number) => void;
  bookmarks?: Bookmark[];
  onAddBookmark?: () => void;
  onDeleteBookmark?: (id: string) => void;
  isCurrentBookmarked?: boolean;
}

export const ComicReaderViewport: React.FC<ComicReaderViewportProps> = ({
  comic,
  streamer,
  initialPageIndex = 0,
  sidebarOpen,
  onToggleSidebar,
  onPageChange,
  bookmarks = [],
  onAddBookmark,
  onDeleteBookmark,
  isCurrentBookmarked = false,
}) => {
  // Initialize settings based on comic metadata hints
  const [settings, setSettings] = useState<ComicSettings>(() => {
    const initial = { ...DEFAULT_COMIC_SETTINGS };
    if (comic.metadata.mangaHint === 'yesAndRightToLeft' || comic.metadata.mangaHint === 'yes') {
      initial.readingMode = 'dual-rtl';
    } else if (comic.metadata.webtoonHint) {
      initial.readingMode = 'webtoon';
    }
    return initial;
  });

  const [currentPageIndex, setCurrentPageIndex] = useState<number>(initialPageIndex);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const { setToolbarControls } = useReaderToolbar();

  const totalPages = comic.pages.length;

  // Determine if current spread is a dual page
  const isSpread = useMemo(() => {
    if (settings.readingMode === 'single' || settings.readingMode === 'webtoon') return false;
    if (settings.firstPageCover && currentPageIndex === 0) return false;
    const pageA = comic.pages[currentPageIndex];
    if (pageA?.isLandscape) return false;
    const pageB = comic.pages[currentPageIndex + 1];
    return Boolean(pageB && !pageB.isLandscape);
  }, [settings.readingMode, settings.firstPageCover, currentPageIndex, comic.pages]);

  // Stepping calculation
  const getNextIndex = useCallback(() => {
    if (currentPageIndex >= totalPages - 1) return currentPageIndex;
    if (settings.readingMode === 'single' || settings.readingMode === 'webtoon') {
      return currentPageIndex + 1;
    }
    if (settings.firstPageCover && currentPageIndex === 0) {
      return 1;
    }
    if (comic.pages[currentPageIndex]?.isLandscape) {
      return currentPageIndex + 1;
    }
    return Math.min(totalPages - 1, currentPageIndex + 2);
  }, [currentPageIndex, totalPages, settings.readingMode, settings.firstPageCover, comic.pages]);

  const getPrevIndex = useCallback(() => {
    if (currentPageIndex <= 0) return 0;
    if (settings.readingMode === 'single' || settings.readingMode === 'webtoon') {
      return currentPageIndex - 1;
    }
    if (settings.firstPageCover && currentPageIndex <= 2) {
      return 0;
    }
    const prevPage = comic.pages[currentPageIndex - 1];
    if (prevPage?.isLandscape) {
      return currentPageIndex - 1;
    }
    return Math.max(0, currentPageIndex - 2);
  }, [currentPageIndex, settings.readingMode, settings.firstPageCover, comic.pages]);

  const handleNext = useCallback(() => {
    const nextIdx = getNextIndex();
    setCurrentPageIndex(nextIdx);
  }, [getNextIndex]);

  const handlePrev = useCallback(() => {
    const prevIdx = getPrevIndex();
    setCurrentPageIndex(prevIdx);
  }, [getPrevIndex]);

  const handleGoToPage = useCallback(
    (page1Based: number) => {
      const idx = Math.max(0, Math.min(totalPages - 1, page1Based - 1));
      setCurrentPageIndex(idx);
    },
    [totalPages]
  );

  const handleToggleSettings = useCallback(() => {
    setSettingsModalOpen(true);
  }, []);

  useEffect(() => {
    setToolbarControls({
      kind: 'comic',
      currentPage: currentPageIndex + 1,
      totalPages,
      readingMode: settings.readingMode,
      isSpread,
      onGoToPage: handleGoToPage,
      onToggleSettings: handleToggleSettings,
    });
  }, [
    setToolbarControls,
    currentPageIndex,
    totalPages,
    settings.readingMode,
    isSpread,
    handleGoToPage,
    handleToggleSettings,
  ]);

  useEffect(() => () => setToolbarControls(null), [setToolbarControls]);

  // Notify parent of reading progress change
  useEffect(() => {
    const percent = totalPages > 0 ? Math.round(((currentPageIndex + 1) / totalPages) * 100) : 0;
    onPageChange?.(currentPageIndex, percent);
  }, [currentPageIndex, totalPages, onPageChange]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable;
      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        onAddBookmark?.();
        return;
      }

      if (settings.readingMode === 'dual-rtl') {
        // Japanese Manga keyboard bindings: Left Arrow advances next, Right Arrow goes prev
        if (e.key === 'ArrowLeft' || e.key === 'PageDown' || e.key === ' ' || e.key.toLowerCase() === 'j') {
          e.preventDefault();
          handleNext();
        } else if (e.key === 'ArrowRight' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey) || e.key.toLowerCase() === 'k') {
          e.preventDefault();
          handlePrev();
        }
      } else {
        // Western / Single page bindings: Right Arrow advances next, Left Arrow goes prev
        if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ' || e.key.toLowerCase() === 'j') {
          e.preventDefault();
          handleNext();
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey) || e.key.toLowerCase() === 'k') {
          e.preventDefault();
          handlePrev();
        }
      }

      if (e.key === 'Home') {
        e.preventDefault();
        setCurrentPageIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentPageIndex(totalPages - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.readingMode, handleNext, handlePrev, totalPages, onAddBookmark]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'row', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* 1. Left Collapsible Comic Sidebar */}
      <ComicSidebar
        comic={comic}
        streamer={streamer}
        currentPageIndex={currentPageIndex}
        isOpen={sidebarOpen}
        onClose={onToggleSidebar}
        onSelectPage={(idx) => setCurrentPageIndex(idx)}
        bookmarks={bookmarks}
        onAddBookmark={onAddBookmark || (() => {})}
        onSelectBookmark={(bm) => handleGoToPage(bm.pageNumber || 1)}
        onDeleteBookmark={onDeleteBookmark || (() => {})}
        isCurrentBookmarked={isCurrentBookmarked}
      />

      {/* 2. Reading Canvas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
        {settings.readingMode === 'webtoon' ? (
          <ComicWebtoonView
            pages={comic.pages}
            streamer={streamer}
            initialPageIndex={currentPageIndex}
            gapless={settings.gapless}
            maxWidth={settings.webtoonMaxWidth}
            onPageChange={(idx) => setCurrentPageIndex(idx)}
            onToggleControls={() => setControlsVisible((prev) => !prev)}
          />
        ) : (
          <ComicSpreadView
            pages={comic.pages}
            streamer={streamer}
            currentPageIndex={currentPageIndex}
            readingMode={settings.readingMode}
            fitMode={settings.fitMode}
            firstPageCover={settings.firstPageCover}
            onNext={handleNext}
            onPrev={handlePrev}
            onToggleControls={() => setControlsVisible((prev) => !prev)}
          />
        )}

        {/* 3. Slim Floating Navigation Pill */}
        {controlsVisible && (
          <ComicFloatingNav
            currentPage={currentPageIndex + 1}
            totalPages={totalPages}
            readingMode={settings.readingMode}
            canGoPrev={currentPageIndex > 0}
            canGoNext={currentPageIndex < totalPages - 1}
            onPrev={handlePrev}
            onNext={handleNext}
            onGoToPage={handleGoToPage}
          />
        )}
      </div>

      {/* 4. Comic Settings Popover Modal */}
      <ComicSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={(updates) => setSettings((prev) => ({ ...prev, ...updates }))}
      />
    </div>
  );
};
