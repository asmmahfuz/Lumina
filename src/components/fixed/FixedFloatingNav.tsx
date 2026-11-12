/**
 * Lumina Reader - Fixed-Layout Floating Navigation & Zoom Chrome
 * Glassmorphic floating control bar for page jumping, zoom scaling, and view mode switching
 */

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  MoveHorizontal,
  Scroll,
  BookOpen,
  Type,
} from 'lucide-react';
import { FixedFitMode, FixedReadingMode } from '@/types/pdf';

interface FixedFloatingNavProps {
  currentPage: number;
  totalPages: number;
  scale: number;
  fitMode: FixedFitMode;
  readingMode: FixedReadingMode;
  showTextLayer: boolean;
  onPageChange: (newPage: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onSetFitMode: (mode: FixedFitMode) => void;
  onToggleReadingMode: () => void;
  onToggleTextLayer: () => void;
}

export const FixedFloatingNav: React.FC<FixedFloatingNavProps> = ({
  currentPage,
  totalPages,
  scale,
  fitMode,
  readingMode,
  showTextLayer,
  onPageChange,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onSetFitMode,
  onToggleReadingMode,
  onToggleTextLayer,
}) => {
  const [jumpInput, setJumpInput] = useState<string>('');
  const [showJumpPopover, setShowJumpPopover] = useState<boolean>(false);

  const percent = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
  const zoomPercent = Math.round(scale * 100);

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      onPageChange(p);
      setShowJumpPopover(false);
      setJumpInput('');
    }
  };

  return (
    <nav
      className="glass-panel animate-slide-down"
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 8px',
        borderRadius: 'var(--radius-full)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--color-border)',
        zIndex: 50,
        userSelect: 'none',
      }}
    >
      {/* 1. Page Navigation Steppers */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        title="Previous Page (Left Arrow / PageUp)"
        style={{
          width: '26px',
          height: '26px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'transparent',
          color: currentPage <= 1 ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
          cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
        }}
      >
        <ChevronLeft size={16} />
      </button>

      {/* Page Jump Pill with Popover */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowJumpPopover((prev) => !prev)}
          title="Click to jump to page"
          style={{
            height: '24px',
            padding: '0 8px',
            fontSize: '11px',
            fontWeight: 600,
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-surface-hover)',
            color: 'var(--color-text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>{currentPage}</span>
          <span style={{ color: 'var(--color-text-muted)' }}>/</span>
          <span>{totalPages}</span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '10px', marginLeft: '2px' }}>
            ({percent}%)
          </span>
        </button>

        {showJumpPopover && (
          <form
            onSubmit={handleJumpSubmit}
            className="glass-panel animate-slide-down"
            style={{
              position: 'absolute',
              bottom: '34px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <input
              type="number"
              min={1}
              max={totalPages}
              placeholder={`1-${totalPages}`}
              value={jumpInput}
              autoFocus
              onChange={(e) => setJumpInput(e.target.value)}
              style={{
                width: '64px',
                height: '24px',
                fontSize: '11px',
                textAlign: 'center',
                padding: '0 4px',
              }}
            />
            <button
              type="submit"
              style={{
                height: '24px',
                padding: '0 8px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-accent-text)',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              Go
            </button>
          </form>
        )}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        title="Next Page (Right Arrow / PageDown / Space)"
        style={{
          width: '26px',
          height: '26px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'transparent',
          color: currentPage >= totalPages ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
          cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
        }}
      >
        <ChevronRight size={16} />
      </button>

      <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--color-border)', margin: '0 2px' }} />

      {/* 2. Zoom Controls */}
      <button
        onClick={onZoomOut}
        title="Zoom Out (-)"
        style={{
          width: '26px',
          height: '26px',
          borderRadius: 'var(--radius-full)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <ZoomOut size={14} />
      </button>

      <button
        onClick={onResetZoom}
        title="Reset Zoom to 100% (0)"
        style={{
          height: '22px',
          padding: '0 6px',
          fontSize: '10px',
          fontWeight: 600,
          borderRadius: 'var(--radius-sm)',
          backgroundColor: fitMode === 'original' ? 'var(--color-accent-subtle)' : 'transparent',
          color: fitMode === 'original' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
        }}
      >
        {zoomPercent}%
      </button>

      <button
        onClick={onZoomIn}
        title="Zoom In (+)"
        style={{
          width: '26px',
          height: '26px',
          borderRadius: 'var(--radius-full)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <ZoomIn size={14} />
      </button>

      {/* Fit Modes */}
      <button
        onClick={() => onSetFitMode('fit-width')}
        title="Fit to Width"
        style={{
          width: '26px',
          height: '26px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: fitMode === 'fit-width' ? 'var(--color-accent-subtle)' : 'transparent',
          color: fitMode === 'fit-width' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
        }}
      >
        <MoveHorizontal size={14} />
      </button>

      <button
        onClick={() => onSetFitMode('fit-page')}
        title="Fit Full Page"
        style={{
          width: '26px',
          height: '26px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: fitMode === 'fit-page' ? 'var(--color-accent-subtle)' : 'transparent',
          color: fitMode === 'fit-page' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
        }}
      >
        <Maximize size={13} />
      </button>

      <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--color-border)', margin: '0 2px' }} />

      {/* 3. Reading Mode: Continuous vs Spread */}
      <button
        onClick={onToggleReadingMode}
        title={readingMode === 'continuous' ? 'Switch to Paginated View' : 'Switch to Continuous Scroll'}
        style={{
          width: '26px',
          height: '26px',
          borderRadius: 'var(--radius-full)',
          color: 'var(--color-accent)',
        }}
      >
        {readingMode === 'continuous' ? <Scroll size={14} /> : <BookOpen size={14} />}
      </button>

      {/* Text Layer Toggle */}
      <button
        onClick={onToggleTextLayer}
        title={showTextLayer ? 'Text Selection Layer: ON' : 'Text Selection Layer: OFF'}
        style={{
          width: '26px',
          height: '26px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: showTextLayer ? 'var(--color-accent-subtle)' : 'transparent',
          color: showTextLayer ? 'var(--color-accent)' : 'var(--color-text-muted)',
        }}
      >
        <Type size={14} />
      </button>
    </nav>
  );
};
