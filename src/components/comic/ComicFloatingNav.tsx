/**
 * Lumina Reader - Comic Floating Navigation Bar
 * Glassmorphic floating control pill with page stepper, reading mode toggle, and page scrubber
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Sliders, BookOpen } from 'lucide-react';
import { ComicReadingMode } from '@/types/comic';

interface ComicFloatingNavProps {
  currentPage: number; // 1-based
  totalPages: number;
  readingMode: ComicReadingMode;
  isSpread: boolean;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onGoToPage: (page: number) => void;
  onToggleSettings?: () => void;
}

export const ComicFloatingNav: React.FC<ComicFloatingNavProps> = ({
  currentPage,
  totalPages,
  readingMode,
  isSpread,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  onGoToPage,
  onToggleSettings,
}) => {
  const [showScrubber, setShowScrubber] = useState(false);

  const displayPageStr = isSpread && currentPage < totalPages
    ? `Pages ${currentPage}–${currentPage + 1} of ${totalPages}`
    : `Page ${currentPage} of ${totalPages}`;

  const progressPercent = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

  const modeBadge =
    readingMode === 'dual-rtl'
      ? 'RTL Manga'
      : readingMode === 'dual-ltr'
      ? 'LTR Spread'
      : readingMode === 'webtoon'
      ? 'Webtoon'
      : 'Single Page';

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 'var(--z-toolbar)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'auto',
      }}
    >
      {/* Optional Page Scrubber Bar */}
      {showScrubber && (
        <div
          className="glass-panel animate-slide-up"
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--color-border)',
            fontSize: '11px',
            color: 'var(--color-text-secondary)',
          }}
        >
          <span>1</span>
          <input
            type="range"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={(e) => onGoToPage(Number(e.target.value))}
            style={{ width: '180px', accentColor: 'var(--color-accent)', cursor: 'pointer' }}
          />
          <span>{totalPages}</span>
        </div>
      )}

      {/* Main Glassmorphic Control Pill */}
      <div
        className="glass-panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          borderRadius: 'var(--radius-full)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Prev Page Button */}
        <button
          onClick={onPrev}
          disabled={!canGoPrev}
          title={readingMode === 'dual-rtl' ? 'Next Manga Spread (Left Arrow)' : 'Previous Page (Left Arrow)'}
          style={{
            height: '28px',
            padding: '0 8px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'transparent',
            border: 'none',
            color: canGoPrev ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            cursor: canGoPrev ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            fontSize: '11px',
            fontWeight: 500,
          }}
        >
          <ChevronLeft size={14} />
          <span>Prev</span>
        </button>

        {/* Central Page & Progress Badge */}
        <div
          onClick={() => setShowScrubber((prev) => !prev)}
          title="Click to toggle rapid page scrubber"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
          }}
        >
          <BookOpen size={12} style={{ color: 'var(--color-accent)' }} />
          <span>{displayPageStr}</span>
          <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>•</span>
          <span style={{ color: 'var(--color-accent)' }}>{progressPercent}%</span>
          <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>•</span>
          <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{modeBadge}</span>
        </div>

        {/* Next Page Button */}
        <button
          onClick={onNext}
          disabled={!canGoNext}
          title={readingMode === 'dual-rtl' ? 'Previous Manga Spread (Right Arrow)' : 'Next Page (Right Arrow)'}
          style={{
            height: '28px',
            padding: '0 8px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'transparent',
            border: 'none',
            color: canGoNext ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            cursor: canGoNext ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            fontSize: '11px',
            fontWeight: 500,
          }}
        >
          <span>Next</span>
          <ChevronRight size={14} />
        </button>

        {/* Comic Settings Button */}
        {onToggleSettings && (
          <button
            onClick={onToggleSettings}
            title="Comic & Manga Settings (Spread, RTL, Webtoon, Zoom)"
            style={{
              height: '28px',
              width: '28px',
              padding: 0,
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sliders size={13} />
          </button>
        )}
      </div>
    </div>
  );
};
