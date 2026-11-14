/**
 * Lumina Reader - Minimal Comic Floating Navigation Pill
 * Displays only `< current / total >` with optional click-to-scrub slider.
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { ComicReadingMode } from '@/types/comic';
import { useReaderContext } from '@/app/Providers';

interface ComicFloatingNavProps {
  currentPage: number; // 1-based
  totalPages: number;
  readingMode: ComicReadingMode;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onGoToPage: (page: number) => void;
}

export const ComicFloatingNav: React.FC<ComicFloatingNavProps> = ({
  currentPage,
  totalPages,
  readingMode,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  onGoToPage,
}) => {
  const [showScrubber, setShowScrubber] = useState(false);
  const { settings } = useReaderContext();
  const isVertical = settings.navPosition === 'right';

  const iconBtnStyle: React.CSSProperties = {
    width: '20px',
    height: '20px',
    padding: 0,
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'transparent',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const PrevIcon = isVertical ? ChevronUp : ChevronLeft;
  const NextIcon = isVertical ? ChevronDown : ChevronRight;

  return (
    <div
      style={{
        position: 'absolute',
        ...(isVertical
          ? { right: '10px', top: '50%', transform: 'translateY(-50%)', flexDirection: 'row-reverse' }
          : { bottom: '10px', left: '50%', transform: 'translateX(-50%)', flexDirection: 'column' }),
        zIndex: 'var(--z-toolbar)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        pointerEvents: 'auto',
      }}
    >
      {showScrubber && (
        <div
          className="glass-panel"
          style={{
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--color-border)',
            fontSize: '10px',
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
            style={{ width: '150px', accentColor: 'var(--color-accent)', cursor: 'pointer' }}
          />
          <span>{totalPages}</span>
        </div>
      )}

      <nav
        className="glass-panel"
        style={{
          display: 'flex',
          flexDirection: isVertical ? 'column' : 'row',
          alignItems: 'center',
          gap: '3px',
          padding: isVertical ? '4px 3px' : '2px 6px',
          borderRadius: 'var(--radius-full)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--color-border)',
          userSelect: 'none',
        }}
      >
        <button
          onClick={onPrev}
          disabled={!canGoPrev}
          title={readingMode === 'dual-rtl' ? 'Next Manga Spread' : 'Previous Page'}
          style={{
            ...iconBtnStyle,
            color: canGoPrev ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            cursor: canGoPrev ? 'pointer' : 'default',
          }}
        >
          <PrevIcon size={13} />
        </button>

        <button
          onClick={() => setShowScrubber((prev) => !prev)}
          title="Click to toggle page scrubber"
          style={{
            height: isVertical ? 'auto' : '20px',
            padding: isVertical ? '3px 2px' : '0 6px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: '10.5px',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: isVertical ? 'column' : 'row',
            alignItems: 'center',
            gap: isVertical ? '0px' : '3px',
            lineHeight: 1.15,
          }}
        >
          <span>{currentPage}</span>
          {!isVertical && <span style={{ color: 'var(--color-text-muted)' }}>/</span>}
          <span style={{ color: 'var(--color-text-muted)', fontSize: isVertical ? '9px' : '10.5px' }}>
            {totalPages}
          </span>
        </button>

        <button
          onClick={onNext}
          disabled={!canGoNext}
          title={readingMode === 'dual-rtl' ? 'Previous Manga Spread' : 'Next Page'}
          style={{
            ...iconBtnStyle,
            color: canGoNext ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            cursor: canGoNext ? 'pointer' : 'default',
          }}
        >
          <NextIcon size={13} />
        </button>
      </nav>
    </div>
  );
};
