/**
 * Lumina Reader - Minimal Floating Chapter & Page Navigation Pill
 * Displays only `< current / total >` supporting Bottom (horizontal) and Right (vertical) docking.
 */

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useReaderContext } from '@/app/Providers';

interface FloatingChapterNavProps {
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  currentPage?: number;
  totalPages?: number;
  isPaginated?: boolean;
  isChapterBoundaryPrev?: boolean;
  isChapterBoundaryNext?: boolean;
  progressPercent?: number;
}

export const FloatingChapterNav: React.FC<FloatingChapterNavProps> = ({
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  currentPage = 1,
  totalPages = 1,
  isPaginated = true,
  isChapterBoundaryPrev = false,
  isChapterBoundaryNext = false,
  progressPercent,
}) => {
  const { settings } = useReaderContext();
  const isVertical = settings.navPosition === 'right';

  const iconBtnStyle: React.CSSProperties = {
    width: '20px',
    height: '20px',
    padding: 0,
    borderRadius: 'var(--radius-full)',
    border: 'none',
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const PrevIcon = isVertical ? ChevronUp : isChapterBoundaryPrev ? ChevronsLeft : ChevronLeft;
  const NextIcon = isVertical ? ChevronDown : isChapterBoundaryNext ? ChevronsRight : ChevronRight;

  return (
    <nav
      className="glass-panel"
      style={{
        position: 'absolute',
        ...(isVertical
          ? { right: '10px', top: '50%', transform: 'translateY(-50%)', flexDirection: 'column', padding: '4px 3px' }
          : { bottom: '10px', left: '50%', transform: 'translateX(-50%)', flexDirection: 'row', padding: '2px 6px' }),
        borderRadius: 'var(--radius-full)',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-md)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        fontSize: '10.5px',
        color: 'var(--color-text-primary)',
        zIndex: 10,
        opacity: 0.94,
        userSelect: 'none',
      }}
    >
      <button
        onClick={onPrev}
        disabled={!canGoPrev}
        title={isChapterBoundaryPrev ? 'Previous Chapter' : 'Previous Page'}
        style={{
          ...iconBtnStyle,
          color: canGoPrev ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          cursor: canGoPrev ? 'pointer' : 'not-allowed',
        }}
      >
        <PrevIcon size={13} />
      </button>

      <div
        style={{
          display: 'flex',
          flexDirection: isVertical ? 'column' : 'row',
          alignItems: 'center',
          gap: isVertical ? '0px' : '3px',
          padding: isVertical ? '3px 2px' : '0 6px',
          fontWeight: 600,
          lineHeight: 1.15,
        }}
      >
        {isPaginated ? (
          <>
            <span>{currentPage}</span>
            {!isVertical && <span style={{ color: 'var(--color-text-muted)' }}>/</span>}
            <span style={{ color: 'var(--color-text-muted)', fontSize: isVertical ? '9px' : '10.5px' }}>
              {totalPages}
            </span>
          </>
        ) : (
          <span>{progressPercent !== undefined ? `${progressPercent}%` : 'Scroll'}</span>
        )}
      </div>

      <button
        onClick={onNext}
        disabled={!canGoNext}
        title={isChapterBoundaryNext ? 'Next Chapter' : 'Next Page'}
        style={{
          ...iconBtnStyle,
          color: canGoNext ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
          cursor: canGoNext ? 'pointer' : 'not-allowed',
        }}
      >
        <NextIcon size={13} />
      </button>
    </nav>
  );
};
