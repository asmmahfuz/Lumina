/**
 * Lumina Reader - Floating Chapter & Page Navigation
 * Floating controls for smooth page & chapter turning with a central
 * glassmorphic page & reading progress badge, strictly preserving the single-bar rule.
 */

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Clock } from 'lucide-react';

interface FloatingChapterNavProps {
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  currentPage?: number;
  totalPages?: number;
  isTwoPage?: boolean;
  isPaginated?: boolean;
  isChapterBoundaryPrev?: boolean;
  isChapterBoundaryNext?: boolean;
  progressPercent?: number;
  chapterTitle?: string;
  timeRemaining?: string;
  onOpenStats?: () => void;
}

export const FloatingChapterNav: React.FC<FloatingChapterNavProps> = ({
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  currentPage = 1,
  totalPages = 1,
  isTwoPage = false,
  isPaginated = true,
  isChapterBoundaryPrev = false,
  isChapterBoundaryNext = false,
  progressPercent,
  chapterTitle,
  timeRemaining,
  onOpenStats,
}) => {
  const pageLabel = isPaginated
    ? isTwoPage && totalPages > 1
      ? `Pages ${currentPage}–${Math.min(currentPage + 1, totalPages)} of ${totalPages}`
      : `Page ${currentPage} of ${totalPages}`
    : `${progressPercent !== undefined ? `${progressPercent}%` : 'Scroll'}`;

  return (
    <>
      {/* Floating Previous Button */}
      {canGoPrev && (
        <button
          onClick={onPrev}
          title={
            isChapterBoundaryPrev
              ? 'Previous Chapter (Left Arrow, [, or Page Up)'
              : 'Previous Page (Left Arrow, K, or Page Up)'
          }
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            height: '32px',
            padding: '0 12px 0 8px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)',
            backdropFilter: 'blur(10px)',
            color: 'var(--color-text-primary)',
            fontSize: '11px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            zIndex: 10,
            opacity: 0.9,
            transition: 'all 180ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.9';
            e.currentTarget.style.backgroundColor = 'var(--color-surface)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {isChapterBoundaryPrev ? <ChevronsLeft size={14} /> : <ChevronLeft size={14} />}
          <span>{isChapterBoundaryPrev ? 'Prev Ch.' : 'Prev'}</span>
        </button>
      )}

      {/* Center Floating Page & Progress Pill */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          height: '28px',
          padding: '0 12px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          color: 'var(--color-text-secondary)',
          pointerEvents: onOpenStats ? 'auto' : 'none',
          zIndex: 10,
          opacity: 0.92,
          userSelect: 'none',
        }}
      >
        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{pageLabel}</span>
        {progressPercent !== undefined && isPaginated && (
          <>
            <span style={{ opacity: 0.35 }}>•</span>
            <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{progressPercent}%</span>
          </>
        )}
        {timeRemaining && (
          <>
            <span style={{ opacity: 0.35 }}>•</span>
            <span
              onClick={onOpenStats}
              title="Estimated reading time remaining (click for Insights)"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                color: 'var(--color-text-secondary)',
                cursor: onOpenStats ? 'pointer' : 'default',
              }}
            >
              <Clock size={10} style={{ opacity: 0.8 }} />
              <span>{timeRemaining}</span>
            </span>
          </>
        )}
        {chapterTitle && (
          <>
            <span style={{ opacity: 0.35 }}>•</span>
            <span
              style={{
                maxWidth: '140px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: '10px',
              }}
              title={chapterTitle}
            >
              {chapterTitle}
            </span>
          </>
        )}
      </div>

      {/* Floating Next Button */}
      {canGoNext && (
        <button
          onClick={onNext}
          title={
            isChapterBoundaryNext
              ? 'Next Chapter (Right Arrow, ], Space, or Page Down)'
              : 'Next Page (Right Arrow, J, Space, or Page Down)'
          }
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            height: '32px',
            padding: '0 8px 0 12px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)',
            backdropFilter: 'blur(10px)',
            color: 'var(--color-text-primary)',
            fontSize: '11px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            zIndex: 10,
            opacity: 0.9,
            transition: 'all 180ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.9';
            e.currentTarget.style.backgroundColor = 'var(--color-surface)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span>{isChapterBoundaryNext ? 'Next Ch.' : 'Next'}</span>
          {isChapterBoundaryNext ? <ChevronsRight size={14} /> : <ChevronRight size={14} />}
        </button>
      )}
    </>
  );
};
