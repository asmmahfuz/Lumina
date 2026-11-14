/**
 * Lumina Reader - Minimal Floating Page Navigation Pill
 * Displays only `< current / total >` with optional click-to-jump popover,
 * honoring Bottom (horizontal) vs Right (vertical) placement.
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { useReaderContext } from '@/app/Providers';

interface FixedFloatingNavProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export const FixedFloatingNav: React.FC<FixedFloatingNavProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const [jumpInput, setJumpInput] = useState<string>('');
  const [showJumpPopover, setShowJumpPopover] = useState<boolean>(false);
  const { settings } = useReaderContext();

  const isVertical = settings.navPosition === 'right';

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      onPageChange(p);
      setShowJumpPopover(false);
      setJumpInput('');
    }
  };

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
    <nav
      className="glass-panel"
      style={{
        position: 'absolute',
        ...(isVertical
          ? { right: '10px', top: '50%', transform: 'translateY(-50%)', flexDirection: 'column', padding: '4px 3px' }
          : { bottom: '10px', left: '50%', transform: 'translateX(-50%)', flexDirection: 'row', padding: '2px 6px' }),
        display: 'flex',
        alignItems: 'center',
        gap: '3px',
        borderRadius: 'var(--radius-full)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--color-border)',
        zIndex: 50,
        userSelect: 'none',
      }}
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        title="Previous Page (Left Arrow / PageUp)"
        style={{
          ...iconBtnStyle,
          color: currentPage <= 1 ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
          cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
        }}
      >
        <PrevIcon size={13} />
      </button>

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowJumpPopover((prev) => !prev)}
          title="Click to jump to page"
          style={{
            height: isVertical ? 'auto' : '20px',
            padding: isVertical ? '3px 2px' : '0 6px',
            fontSize: '10.5px',
            fontWeight: 600,
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'transparent',
            color: 'var(--color-text-primary)',
            border: 'none',
            display: 'flex',
            flexDirection: isVertical ? 'column' : 'row',
            alignItems: 'center',
            gap: isVertical ? '0px' : '3px',
            lineHeight: 1.15,
            cursor: 'pointer',
          }}
        >
          <span>{currentPage}</span>
          {!isVertical && <span style={{ color: 'var(--color-text-muted)' }}>/</span>}
          <span style={{ color: 'var(--color-text-muted)', fontSize: isVertical ? '9px' : '10.5px' }}>
            {totalPages}
          </span>
        </button>

        {showJumpPopover && (
          <form
            onSubmit={handleJumpSubmit}
            className="glass-panel"
            style={{
              position: 'absolute',
              ...(isVertical
                ? { right: '30px', top: '50%', transform: 'translateY(-50%)' }
                : { bottom: '26px', left: '50%', transform: 'translateX(-50%)' }),
              padding: '6px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--color-border)',
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
              style={{ width: '56px', height: '22px', fontSize: '11px', textAlign: 'center', padding: '0 4px' }}
            />
            <button
              type="submit"
              style={{
                height: '22px',
                padding: '0 7px',
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
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        title="Next Page (Right Arrow / PageDown / Space)"
        style={{
          ...iconBtnStyle,
          color: currentPage >= totalPages ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
          cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
        }}
      >
        <NextIcon size={13} />
      </button>
    </nav>
  );
};
