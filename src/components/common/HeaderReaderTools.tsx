/**
 * Lumina Reader - Top Header Reader Tool Cluster
 * Houses zoom, fit, reading mode, text-layer, and quick page jump controls in the spacious top bar.
 */

import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  MoveHorizontal,
  Scroll,
  BookOpen,
  Type,
  Sliders,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ActiveToolbarControls } from '@/app/ReaderToolbarContext';

interface HeaderReaderToolsProps {
  controls: NonNullable<ActiveToolbarControls>;
  onOpenTypography?: () => void;
}

export const HeaderReaderTools: React.FC<HeaderReaderToolsProps> = ({
  controls,
  onOpenTypography,
}) => {
  const [jumpInput, setJumpInput] = useState('');
  const [showJump, setShowJump] = useState(false);

  const btnStyle: React.CSSProperties = {
    height: '22px',
    minWidth: '22px',
    padding: '0 5px',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
    fontSize: '10.5px',
    fontWeight: 500,
    cursor: 'pointer',
  };

  const divider = <div style={{ width: '1px', height: '12px', backgroundColor: 'var(--color-border)', margin: '0 2px' }} />;

  if (controls.kind === 'fixed') {
    const zoomPercent = Math.round(controls.scale * 100);
    const handleJumpSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const p = parseInt(jumpInput, 10);
      if (!isNaN(p) && p >= 1 && p <= controls.totalPages) {
        controls.onPageChange(p);
        setShowJump(false);
        setJumpInput('');
      }
    };

    return (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-full)',
          padding: '1px 6px',
          height: '24px',
        }}
      >
        <button
          onClick={() => setShowJump((v) => !v)}
          title="Jump to page"
          style={{ ...btnStyle, color: 'var(--color-text-primary)', fontWeight: 600 }}
        >
          <span>{controls.currentPage}</span>
          <span style={{ color: 'var(--color-text-muted)' }}>/</span>
          <span>{controls.totalPages}</span>
        </button>

        {showJump && (
          <form
            onSubmit={handleJumpSubmit}
            className="glass-panel"
            style={{
              position: 'absolute',
              top: '28px',
              left: '8px',
              padding: '6px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--color-border)',
              zIndex: 80,
            }}
          >
            <input
              type="number"
              min={1}
              max={controls.totalPages}
              placeholder={`1-${controls.totalPages}`}
              value={jumpInput}
              autoFocus
              onChange={(e) => setJumpInput(e.target.value)}
              style={{ width: '56px', height: '22px', fontSize: '11px', textAlign: 'center' }}
            />
            <button
              type="submit"
              style={{
                height: '22px',
                padding: '0 8px',
                fontSize: '10px',
                fontWeight: 600,
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-accent-text)',
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Go
            </button>
          </form>
        )}

        {divider}

        <button onClick={controls.onZoomOut} title="Zoom Out (-)" style={btnStyle}>
          <ZoomOut size={12} />
        </button>
        <button
          onClick={controls.onResetZoom}
          title="Reset Zoom to 100% (0)"
          style={{
            ...btnStyle,
            backgroundColor: controls.fitMode === 'original' ? 'var(--color-accent-subtle)' : 'transparent',
            color: controls.fitMode === 'original' ? 'var(--color-accent)' : 'var(--color-text-primary)',
            fontWeight: 600,
          }}
        >
          {zoomPercent}%
        </button>
        <button onClick={controls.onZoomIn} title="Zoom In (+)" style={btnStyle}>
          <ZoomIn size={12} />
        </button>

        {divider}

        <button
          onClick={() => controls.onSetFitMode('fit-width')}
          title="Fit Width"
          style={{
            ...btnStyle,
            backgroundColor: controls.fitMode === 'fit-width' ? 'var(--color-accent-subtle)' : 'transparent',
            color: controls.fitMode === 'fit-width' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
          }}
        >
          <MoveHorizontal size={12} />
          <span>Width</span>
        </button>
        <button
          onClick={() => controls.onSetFitMode('fit-page')}
          title="Fit Full Page"
          style={{
            ...btnStyle,
            backgroundColor: controls.fitMode === 'fit-page' ? 'var(--color-accent-subtle)' : 'transparent',
            color: controls.fitMode === 'fit-page' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
          }}
        >
          <Maximize size={11} />
          <span>Page</span>
        </button>

        {divider}

        <button
          onClick={controls.onToggleReadingMode}
          title={controls.readingMode === 'continuous' ? 'Switch to Paginated View' : 'Switch to Continuous Scroll'}
          style={{ ...btnStyle, color: 'var(--color-accent)' }}
        >
          {controls.readingMode === 'continuous' ? <Scroll size={12} /> : <BookOpen size={12} />}
          <span>{controls.readingMode === 'continuous' ? 'Scroll' : 'Page'}</span>
        </button>

        <button
          onClick={controls.onToggleTextLayer}
          title={controls.showTextLayer ? 'Text Selection: ON (click to disable)' : 'Text Selection: OFF (click to enable)'}
          style={{
            ...btnStyle,
            backgroundColor: controls.showTextLayer ? 'var(--color-accent-subtle)' : 'transparent',
            color: controls.showTextLayer ? 'var(--color-accent)' : 'var(--color-text-muted)',
          }}
        >
          <Type size={12} />
        </button>
      </div>
    );
  }

  if (controls.kind === 'comic') {
    const percent = controls.totalPages > 0 ? Math.round((controls.currentPage / controls.totalPages) * 100) : 0;
    const modeLabel =
      controls.readingMode === 'dual-rtl' ? 'Manga RTL' :
      controls.readingMode === 'dual-ltr' ? 'LTR Spread' :
      controls.readingMode === 'webtoon' ? 'Webtoon' : 'Single';

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-full)',
          padding: '1px 8px',
          height: '24px',
          fontSize: '10.5px',
        }}
      >
        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {controls.currentPage} / {controls.totalPages}
        </span>
        <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{percent}%</span>
        {divider}
        <span style={{ color: 'var(--color-text-secondary)' }}>{modeLabel}</span>
        {divider}
        <button onClick={controls.onToggleSettings} title="Comic & Manga Settings" style={btnStyle}>
          <Sliders size={12} />
          <span>Options</span>
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-full)',
        padding: '1px 8px',
        height: '24px',
        fontSize: '10.5px',
      }}
    >
      <button
        onClick={controls.onPrevChapter}
        disabled={controls.currentChapter <= 1}
        title="Previous Chapter"
        style={{ ...btnStyle, minWidth: '18px', padding: 0, color: controls.currentChapter > 1 ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
      >
        <ChevronLeft size={12} />
      </button>
      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
        Ch. {controls.currentChapter} / {controls.totalChapters}
      </span>
      <button
        onClick={controls.onNextChapter}
        disabled={controls.currentChapter >= controls.totalChapters}
        title="Next Chapter"
        style={{ ...btnStyle, minWidth: '18px', padding: 0, color: controls.currentChapter < controls.totalChapters ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
      >
        <ChevronRight size={12} />
      </button>
      {controls.progressPercent !== undefined && (
        <>
          {divider}
          <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>{controls.progressPercent}%</span>
        </>
      )}
      {onOpenTypography && (
        <>
          {divider}
          <button onClick={onOpenTypography} title="Typography & Theme Settings" style={btnStyle}>
            <Sliders size={12} />
            <span>Layout</span>
          </button>
        </>
      )}
    </div>
  );
};
