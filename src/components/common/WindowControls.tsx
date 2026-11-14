/**
 * Lumina Reader - Desktop Window Controls
 * Native window management controls (minimize, maximize/restore, close) for frameless window
 */

import React, { useEffect, useState } from 'react';
import { Minus, Square, Minimize2, X } from 'lucide-react';
import { isDesktopEnvironment } from '@/services/platform';

export const WindowControls: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!isDesktopEnvironment()) return;

    let unlisten: (() => void) | undefined;

    const setupWindowListeners = async () => {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const win = getCurrentWindow();
        setIsMaximized(await win.isMaximized());

        unlisten = await win.onResized(async () => {
          setIsMaximized(await win.isMaximized());
        });
      } catch (err) {
        console.warn('Failed to initialize window controls listener:', err);
      }
    };

    setupWindowListeners();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const handleMinimize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDesktopEnvironment()) return;
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().minimize();
    } catch (err) {
      console.error('Failed to minimize window:', err);
    }
  };

  const handleToggleMaximize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDesktopEnvironment()) return;
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      await win.toggleMaximize();
      setIsMaximized(await win.isMaximized());
    } catch (err) {
      console.error('Failed to toggle maximize window:', err);
    }
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDesktopEnvironment()) return;
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().close();
    } catch (err) {
      console.error('Failed to close window:', err);
    }
  };

  const btnBaseStyle: React.CSSProperties = {
    width: '32px',
    height: '26px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: 'background-color 120ms ease, color 120ms ease',
  };

  return (
    <div
      className="no-drag"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        marginLeft: '4px',
        paddingLeft: '4px',
        borderLeft: '1px solid var(--color-border)',
      }}
    >
      <button
        onClick={handleMinimize}
        title="Minimize"
        aria-label="Minimize"
        style={btnBaseStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
          e.currentTarget.style.color = 'var(--color-text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--color-text-secondary)';
        }}
      >
        <Minus size={13} />
      </button>

      <button
        onClick={handleToggleMaximize}
        title={isMaximized ? 'Restore' : 'Maximize'}
        aria-label={isMaximized ? 'Restore' : 'Maximize'}
        style={btnBaseStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
          e.currentTarget.style.color = 'var(--color-text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--color-text-secondary)';
        }}
      >
        {isMaximized ? <Minimize2 size={12} /> : <Square size={11} />}
      </button>

      <button
        onClick={handleClose}
        title="Close"
        aria-label="Close"
        style={btnBaseStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#e81123';
          e.currentTarget.style.color = '#ffffff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--color-text-secondary)';
        }}
      >
        <X size={13} />
      </button>
    </div>
  );
};
