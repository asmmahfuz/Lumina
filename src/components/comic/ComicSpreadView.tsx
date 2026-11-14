/**
 * Lumina Reader - Comic & Manga Dual-Page Spread View
 * Implements Single Page, Western LTR Dual-Page Spread, and authentic Japanese RTL Manga reading order
 * with cover auto-split and smart image fit scaling.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { ComicFitMode, ComicPage, ComicReadingMode } from '@/types/comic';
import { ComicImageStreamer } from '@/services/comic/comicImageStreamer';

interface ComicSpreadViewProps {
  pages: ComicPage[];
  streamer: ComicImageStreamer;
  currentPageIndex: number;
  readingMode: ComicReadingMode;
  fitMode: ComicFitMode;
  firstPageCover: boolean;
  onNext: () => void;
  onPrev: () => void;
  onToggleControls?: () => void;
}

export const ComicSpreadView: React.FC<ComicSpreadViewProps> = ({
  pages,
  streamer,
  currentPageIndex,
  readingMode,
  fitMode,
  firstPageCover,
  onNext,
  onPrev,
  onToggleControls,
}) => {
  const [leftPageUrl, setLeftPageUrl] = useState<string | null>(null);
  const [rightPageUrl, setRightPageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Compute active pages for current view
  const { leftPage, rightPage, isSpread } = useMemo(() => {
    if (pages.length === 0) return { leftPage: null, rightPage: null, isSpread: false };

    const pageA = pages[currentPageIndex] || null;

    if (readingMode === 'single') {
      return { leftPage: null, rightPage: pageA, isSpread: false };
    }

    // Cover page offset: Page 0 is displayed alone if firstPageCover is true
    if (firstPageCover && currentPageIndex === 0) {
      return { leftPage: null, rightPage: pageA, isSpread: false };
    }

    // If current page is naturally landscape, render it solo across full spread
    if (pageA?.isLandscape) {
      return { leftPage: null, rightPage: pageA, isSpread: false };
    }

    const pageB = pages[currentPageIndex + 1] || null;
    if (!pageB || pageB.isLandscape) {
      // Solo page at end of chapter or before landscape spread
      return { leftPage: null, rightPage: pageA, isSpread: false };
    }

    // Dual Spread Ordering:
    // LTR (Western): Page A on Left, Page B on Right
    // RTL (Japanese Manga): Page B on Left, Page A on Right (Reads Right-to-Left!)
    if (readingMode === 'dual-rtl') {
      return { leftPage: pageB, rightPage: pageA, isSpread: true };
    } else {
      return { leftPage: pageA, rightPage: pageB, isSpread: true };
    }
  }, [pages, currentPageIndex, readingMode, firstPageCover]);

  // Load images and trigger preloading
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadImages = async () => {
      try {
        let leftUrl: string | null = null;
        let rightUrl: string | null = null;

        if (leftPage) leftUrl = await streamer.getPageObjectUrl(leftPage.index);
        if (rightPage) rightUrl = await streamer.getPageObjectUrl(rightPage.index);

        if (isMounted) {
          setLeftPageUrl(leftUrl);
          setRightPageUrl(rightUrl);
          setLoading(false);
        }

        // Preload next 2 pages in background
        const nextIndices = [currentPageIndex + 1, currentPageIndex + 2, currentPageIndex + 3];
        streamer.preloadPages(nextIndices).catch(() => {});
      } catch (err) {
        console.warn('Failed to load comic spread pages:', err);
        if (isMounted) setLoading(false);
      }
    };

    loadImages();
    return () => {
      isMounted = false;
    };
  }, [leftPage, rightPage, currentPageIndex, streamer]);

  // Handle click zones for page navigation
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    const leftZone = width * 0.25;
    const rightZone = width * 0.75;

    if (clickX < leftZone) {
      // In RTL Manga: Left click advances to NEXT page!
      // In LTR / Single: Left click goes to PREVIOUS page!
      if (readingMode === 'dual-rtl') onNext();
      else onPrev();
    } else if (clickX > rightZone) {
      // In RTL Manga: Right click goes to PREVIOUS page!
      // In LTR / Single: Right click advances to NEXT page!
      if (readingMode === 'dual-rtl') onPrev();
      else onNext();
    } else {
      onToggleControls?.();
    }
  };

  const getImageStyle = (): React.CSSProperties => {
    switch (fitMode) {
      case 'original':
        return {
          width: 'auto',
          height: 'auto',
          maxWidth: isSpread ? '50%' : '100%',
          maxHeight: '100%',
          objectFit: 'none',
        };
      case 'fit-height':
        return {
          height: '100%',
          maxHeight: '100%',
          width: 'auto',
          maxWidth: isSpread ? '50%' : '100%',
          objectFit: 'contain',
        };
      case 'fit-width':
        return {
          width: isSpread ? '50%' : '100%',
          height: 'auto',
          maxHeight: '100%',
          objectFit: 'contain',
        };
      case 'fit-screen':
      default:
        return {
          maxWidth: isSpread ? '50%' : '100%',
          maxHeight: '100%',
          objectFit: 'contain',
        };
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        flex: 1,
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        userSelect: 'none',
        backgroundColor: 'var(--color-bg)',
        cursor: 'pointer',
      }}
    >
      {loading && !rightPageUrl && (
        <div style={{ position: 'absolute', color: 'var(--color-text-muted)', fontSize: '13px' }}>
          Loading comic page...
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
          padding: '12px',
          boxSizing: 'border-box',
          gap: isSpread ? '4px' : '0px',
        }}
      >
        {isSpread && leftPageUrl && (
          <img
            src={leftPageUrl}
            alt={leftPage ? `Page ${leftPage.index + 1}` : 'Left Page'}
            style={{
              ...getImageStyle(),
              boxShadow: 'var(--shadow-md)',
              borderRadius: '2px',
              transition: 'opacity 150ms ease',
            }}
          />
        )}

        {rightPageUrl && (
          <img
            src={rightPageUrl}
            alt={rightPage ? `Page ${rightPage.index + 1}` : 'Right Page'}
            style={{
              ...getImageStyle(),
              boxShadow: 'var(--shadow-md)',
              borderRadius: '2px',
              transition: 'opacity 150ms ease',
            }}
          />
        )}
      </div>

      {/* Subtle indicator of reading flow */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '16px',
          fontSize: '10px',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-muted)',
          opacity: 0.6,
          pointerEvents: 'none',
        }}
      >
        {readingMode === 'dual-rtl'
          ? 'Manga (RTL)'
          : readingMode === 'dual-ltr'
          ? 'Spread (LTR)'
          : 'Single Page'}
      </div>
    </div>
  );
};
