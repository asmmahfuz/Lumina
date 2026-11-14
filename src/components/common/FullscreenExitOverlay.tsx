/**
 * Lumina Reader - Fullscreen Top Hover & Exit Overlay
 * Reveals a sleek exit bar when the user moves their mouse to the top edge of the screen
 * or briefly when entering fullscreen, providing multiple standard exit paths.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Minimize2, X } from 'lucide-react';

interface FullscreenExitOverlayProps {
  isFullscreen: boolean;
  onExitFullscreen: () => void;
  title?: string;
}

export const FullscreenExitOverlay: React.FC<FullscreenExitOverlayProps> = ({
  isFullscreen,
  onExitFullscreen,
  title,
}) => {
  const [revealed, setRevealed] = useState(false);
  const hideTimerRef = useRef<number | null>(null);

  const clearHideTimer = () => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const scheduleHide = (delayMs = 450) => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setRevealed(false);
    }, delayMs);
  };

  // Briefly reveal hint bar upon entering fullscreen
  useEffect(() => {
    if (!isFullscreen) {
      setRevealed(false);
      clearHideTimer();
      return;
    }

    setRevealed(true);
    scheduleHide(2400);
    return () => clearHideTimer();
  }, [isFullscreen]);

  // Track mouse proximity to the top edge (including iframe forwarded events)
  useEffect(() => {
    if (!isFullscreen) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY <= 12) {
        clearHideTimer();
        setRevealed(true);
      } else if (e.clientY > 68 && revealed) {
        scheduleHide(400);
      }
    };

    const handleTopTrigger = () => {
      clearHideTimer();
      setRevealed(true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('lumina:fullscreen-top-hover', handleTopTrigger);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('lumina:fullscreen-top-hover', handleTopTrigger);
    };
  }, [isFullscreen, revealed]);

  if (!isFullscreen) return null;

  return (
    <>
      {/* Full-width top edge hover sensor */}
      <div
        onMouseEnter={() => {
          clearHideTimer();
          setRevealed(true);
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '12px',
          zIndex: 95,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          pointerEvents: 'auto',
        }}
      >
        {/* Subtle handle notch indicating top-edge reveal */}
        {!revealed && (
          <div
            style={{
              marginTop: '3px',
              width: '44px',
              height: '3px',
              borderRadius: '999px',
              backgroundColor: 'rgba(160, 160, 180, 0.35)',
            }}
          />
        )}
      </div>

      {/* Floating Exit Full Screen Pill */}
      <div
        className="glass-panel"
        onMouseEnter={() => {
          clearHideTimer();
          setRevealed(true);
        }}
        onMouseLeave={() => scheduleHide(350)}
        style={{
          position: 'fixed',
          top: revealed ? '10px' : '-56px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '5px 8px 5px 12px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-lg)',
          opacity: revealed ? 1 : 0,
          pointerEvents: revealed ? 'auto' : 'none',
          transition: 'top 180ms cubic-bezier(0.16, 1, 0.3, 1), opacity 160ms ease',
          userSelect: 'none',
        }}
      >
        {title && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </span>
        )}

        <button
          onClick={onExitFullscreen}
          title="Exit Full Screen (Esc or F11)"
          style={{
            height: '24px',
            padding: '0 10px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-accent-text)',
            border: 'none',
            fontSize: '11px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
        >
          <Minimize2 size={12} />
          <span>Exit Full Screen</span>
          <kbd
            style={{
              fontSize: '9px',
              padding: '1px 5px',
              borderRadius: '4px',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              color: 'inherit',
              fontFamily: 'inherit',
            }}
          >
            Esc
          </kbd>
        </button>

        <button
          onClick={onExitFullscreen}
          title="Exit Full Screen (F11)"
          aria-label="Exit Full Screen"
          style={{
            width: '24px',
            height: '24px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-surface-hover)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={12} />
        </button>
      </div>
    </>
  );
};
