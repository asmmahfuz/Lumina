/**
 * Lumina Reader - Single-Bar Header Center Control
 * Renders chapter stepper when reading, or library search when browsing.
 */

import React from 'react';
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useReaderToolbar } from '@/app/ReaderToolbarContext';
import { HeaderReaderTools } from './HeaderReaderTools';

interface HeaderNavCenterProps {
  isReading: boolean;
  readingChapterInfo?: { current: number; total: number };
  onPrevChapter?: () => void;
  onNextChapter?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenTypography?: () => void;
}

export const HeaderNavCenter: React.FC<HeaderNavCenterProps> = ({
  isReading,
  readingChapterInfo,
  onPrevChapter,
  onNextChapter,
  searchQuery,
  onSearchChange,
  onOpenTypography,
}) => {
  const { toolbarControls } = useReaderToolbar();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        margin: '0 8px',
        minWidth: 0,
      }}
    >
      {isReading && toolbarControls ? (
        <HeaderReaderTools controls={toolbarControls} onOpenTypography={onOpenTypography} />
      ) : isReading && readingChapterInfo ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            padding: '1px 6px',
            borderRadius: 'var(--radius-full)',
            fontSize: '10.5px',
            height: '22px',
          }}
        >
          <button
            onClick={onPrevChapter}
            disabled={readingChapterInfo.current <= 1}
            style={{
              background: 'none',
              border: 'none',
              cursor: readingChapterInfo.current > 1 ? 'pointer' : 'default',
              color: readingChapterInfo.current > 1 ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: 0,
            }}
            title="Previous Chapter"
          >
            <ChevronLeft size={12} />
          </button>

          <span style={{ fontWeight: 500, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
            Ch. {readingChapterInfo.current} / {readingChapterInfo.total}
          </span>

          <button
            onClick={onNextChapter}
            disabled={readingChapterInfo.current >= readingChapterInfo.total}
            style={{
              background: 'none',
              border: 'none',
              cursor: readingChapterInfo.current < readingChapterInfo.total ? 'pointer' : 'default',
              color: readingChapterInfo.current < readingChapterInfo.total ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: 0,
            }}
            title="Next Chapter"
          >
            <ChevronRight size={12} />
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            width: '100%',
            maxWidth: '340px',
            height: '22px',
            padding: '0 6px',
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-full)',
          }}
        >
          <Search size={11} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search books, authors, or TOC..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              height: '100%',
              width: '100%',
              fontSize: '11px',
              color: 'var(--color-text-primary)',
              outline: 'none',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              title="Clear search"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '1px',
              }}
            >
              <X size={10} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
