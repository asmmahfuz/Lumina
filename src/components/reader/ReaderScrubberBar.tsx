/**
 * Lumina Reader - Reader Scrubber & Progress Bar
 * Bottom navigation controls for chapter transitions and progress visualization
 */

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ReaderScrubberBarProps {
  currentChapter: number;
  totalChapters: number;
  progressPercent: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export const ReaderScrubberBar: React.FC<ReaderScrubberBarProps> = ({
  currentChapter,
  totalChapters,
  progressPercent,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
}) => {
  return (
    <div
      className="glass-panel"
      style={{
        height: '34px',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid var(--color-border)',
        fontSize: '11px',
      }}
    >
      <button
        onClick={onPrev}
        disabled={!canGoPrev}
        style={{
          background: 'none',
          border: 'none',
          cursor: canGoPrev ? 'pointer' : 'default',
          color: canGoPrev ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11px',
          fontWeight: 500,
        }}
      >
        <ChevronLeft size={14} />
        <span>Previous Chapter</span>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: '11px' }}>
          Chapter {currentChapter} of {totalChapters}
        </span>
        <div
          style={{
            width: '80px',
            height: '4px',
            backgroundColor: 'var(--color-surface-hover)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              backgroundColor: 'var(--color-accent)',
            }}
          />
        </div>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '10px' }}>{progressPercent}%</span>
      </div>

      <button
        onClick={onNext}
        disabled={!canGoNext}
        style={{
          background: 'none',
          border: 'none',
          cursor: canGoNext ? 'pointer' : 'default',
          color: canGoNext ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11px',
          fontWeight: 500,
        }}
      >
        <span>Next Chapter</span>
        <ChevronRight size={14} />
      </button>
    </div>
  );
};
