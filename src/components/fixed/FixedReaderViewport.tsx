/**
 * Lumina Reader - Master Fixed-Layout Documents Studio Viewport
 * Orchestrates PDF & DjVu virtualized rendering, zoom & fit modes, sidebar rail, and keyboard controls
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ParsedFixedDocument,
  FixedSettings,
  DEFAULT_FIXED_SETTINGS,
  FixedFitMode,
} from '@/types/pdf';
import { Bookmark } from '@/types/book';
import { PdfDocumentHandle } from '@/services/pdf/pdfEngine';
import { DjvuDocumentHandle } from '@/services/djvu/djvuEngine';
import { useReaderToolbar } from '@/app/ReaderToolbarContext';
import { localDb } from '@/services/storage/indexedDb';
import { FixedSidebar } from './FixedSidebar';
import { FixedContinuousView } from './FixedContinuousView';
import { FixedSpreadView } from './FixedSpreadView';
import { FixedFloatingNav } from './FixedFloatingNav';

interface FixedReaderViewportProps {
  document: ParsedFixedDocument;
  bookId?: string | null;
  initialPageNumber?: number;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onPageChange: (newPageNumber: number, percent: number) => void;
  bookmarks: Bookmark[];
  onAddBookmark: (pageNumber: number) => void;
  onDeleteBookmark: (bookmarkId: string) => void;
  pdfHandle?: PdfDocumentHandle;
  djvuHandle?: DjvuDocumentHandle;
}

export const FixedReaderViewport: React.FC<FixedReaderViewportProps> = ({
  document,
  bookId,
  initialPageNumber = 1,
  sidebarOpen,
  onToggleSidebar,
  onPageChange,
  bookmarks,
  onAddBookmark,
  onDeleteBookmark,
  pdfHandle,
  djvuHandle,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(initialPageNumber);
  const [settings, setSettings] = useState<FixedSettings>(() => ({
    ...DEFAULT_FIXED_SETTINGS,
    showTextLayer: document.hasTextLayer ?? DEFAULT_FIXED_SETTINGS.showTextLayer,
  }));
  const viewportRef = useRef<HTMLDivElement>(null);
  const { setToolbarControls } = useReaderToolbar();

  useEffect(() => {
    setCurrentPage(initialPageNumber);
    setSettings((prev) => ({
      ...prev,
      showTextLayer: document.hasTextLayer ?? false,
    }));
  }, [document, initialPageNumber]);

  const handleCoverCaptured = useCallback(
    (blob: Blob) => {
      if (!bookId) return;
      blob
        .arrayBuffer()
        .then((buf) => localDb.saveBookCover(bookId, buf))
        .catch(() => {});
    },
    [bookId]
  );

  const totalPages = document.pages.length;
  const currentPageInfo = document.pages[currentPage - 1] || document.pages[0];

  // 1. Calculate Dynamic Scale for Fit Modes
  const calculateFitScale = useCallback(
    (mode: FixedFitMode): number => {
      if (!viewportRef.current || !currentPageInfo) return 1.0;
      const { clientWidth, clientHeight } = viewportRef.current;
      const horizontalPadding = 48;
      const verticalPadding = 96;

      const availWidth = Math.max(clientWidth - horizontalPadding, 300);
      const availHeight = Math.max(clientHeight - verticalPadding, 300);

      const targetWidth = currentPageInfo.width || 612;
      const targetHeight = currentPageInfo.height || 792;

      if (mode === 'fit-width') {
        return Math.min(Math.max(availWidth / targetWidth, 0.4), 3.0);
      } else if (mode === 'fit-page') {
        const scaleW = availWidth / targetWidth;
        const scaleH = availHeight / targetHeight;
        return Math.min(Math.max(Math.min(scaleW, scaleH), 0.3), 2.5);
      } else if (mode === 'original') {
        return 1.0;
      }
      return settings.scale;
    },
    [currentPageInfo, settings.scale]
  );

  // Recalculate scale on window resize or page/fit change
  useEffect(() => {
    if (settings.fitMode !== 'custom') {
      const newScale = calculateFitScale(settings.fitMode);
      setSettings((prev) => ({ ...prev, scale: newScale }));
    }
  }, [settings.fitMode, calculateFitScale]);

  useEffect(() => {
    const handleResize = () => {
      if (settings.fitMode !== 'custom') {
        const newScale = calculateFitScale(settings.fitMode);
        setSettings((prev) => ({ ...prev, scale: newScale }));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [settings.fitMode, calculateFitScale]);

  // 2. Handle Page Turns & Progress Sync
  const handlePageSelect = useCallback(
    (newPage: number) => {
      const clamped = Math.max(1, Math.min(totalPages, newPage));
      setCurrentPage(clamped);
      const percent = totalPages > 0 ? Math.round((clamped / totalPages) * 100) : 0;
      onPageChange(clamped, percent);
    },
    [totalPages, onPageChange]
  );

  // 3. Zoom & Display Actions
  const handleZoomIn = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      fitMode: 'custom',
      scale: Math.min(Math.round((prev.scale + 0.15) * 100) / 100, 3.5),
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      fitMode: 'custom',
      scale: Math.max(Math.round((prev.scale - 0.15) * 100) / 100, 0.3),
    }));
  }, []);

  const handleResetZoom = useCallback(() => {
    setSettings((prev) => ({ ...prev, fitMode: 'original', scale: 1.0 }));
  }, []);

  const handleSetFitMode = useCallback(
    (mode: FixedFitMode) => {
      const newScale = calculateFitScale(mode);
      setSettings((prev) => ({ ...prev, fitMode: mode, scale: newScale }));
    },
    [calculateFitScale]
  );

  const handleToggleReadingMode = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      readingMode: prev.readingMode === 'continuous' ? 'single' : 'continuous',
    }));
  }, []);

  const handleToggleTextLayer = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      showTextLayer: !prev.showTextLayer,
    }));
  }, []);

  useEffect(() => {
    setToolbarControls({
      kind: 'fixed',
      currentPage,
      totalPages,
      scale: settings.scale,
      fitMode: settings.fitMode,
      readingMode: settings.readingMode,
      showTextLayer: settings.showTextLayer,
      onPageChange: handlePageSelect,
      onZoomIn: handleZoomIn,
      onZoomOut: handleZoomOut,
      onResetZoom: handleResetZoom,
      onSetFitMode: handleSetFitMode,
      onToggleReadingMode: handleToggleReadingMode,
      onToggleTextLayer: handleToggleTextLayer,
    });
  }, [
    setToolbarControls,
    currentPage,
    totalPages,
    settings.scale,
    settings.fitMode,
    settings.readingMode,
    settings.showTextLayer,
    handlePageSelect,
    handleZoomIn,
    handleZoomOut,
    handleResetZoom,
    handleSetFitMode,
    handleToggleReadingMode,
    handleToggleTextLayer,
  ]);

  useEffect(() => () => setToolbarControls(null), [setToolbarControls]);

  // 4. Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'j' || e.key === ']') {
        e.preventDefault();
        handlePageSelect(currentPage + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'k' || e.key === '[') {
        e.preventDefault();
        handlePageSelect(currentPage - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        handlePageSelect(1);
      } else if (e.key === 'End') {
        e.preventDefault();
        handlePageSelect(totalPages);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        onToggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, handlePageSelect, onToggleSidebar]);

  return (
    <div
      ref={viewportRef}
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: 'var(--color-bg)',
      }}
    >
      {/* 1. Left Collapsible Sidebar Dock */}
      <FixedSidebar
        document={document}
        currentPage={currentPage}
        isOpen={sidebarOpen}
        onClose={onToggleSidebar}
        onSelectPage={handlePageSelect}
        bookmarks={bookmarks}
        onAddBookmark={onAddBookmark}
        onDeleteBookmark={onDeleteBookmark}
        pdfHandle={pdfHandle}
        djvuHandle={djvuHandle}
      />

      {/* 2. Main Document Viewport (Continuous Scroll vs Paginated Spread) */}
      <div style={{ flex: 1, height: '100%', display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {settings.readingMode === 'continuous' ? (
          <FixedContinuousView
            pages={document.pages}
            currentPage={currentPage}
            scale={settings.scale}
            showTextLayer={settings.showTextLayer}
            format={document.format}
            continuousGap={settings.continuousGap}
            pdfHandle={pdfHandle}
            djvuHandle={djvuHandle}
            onPageChange={handlePageSelect}
            onCoverCaptured={bookId ? handleCoverCaptured : undefined}
          />
        ) : (
          <FixedSpreadView
            pages={document.pages}
            currentPage={currentPage}
            scale={settings.scale}
            showTextLayer={settings.showTextLayer}
            format={document.format}
            isDualSpread={settings.readingMode === 'spread'}
            twoPageSpreadCoverAlone={settings.twoPageSpreadCoverAlone}
            pdfHandle={pdfHandle}
            djvuHandle={djvuHandle}
            onPageChange={handlePageSelect}
            onCoverCaptured={bookId ? handleCoverCaptured : undefined}
          />
        )}

        {/* 3. Slim Floating Navigation Pill */}
        <FixedFloatingNav
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageSelect}
        />
      </div>
    </div>
  );
};
