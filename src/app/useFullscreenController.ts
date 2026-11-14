/**
 * Lumina Reader - Fullscreen State Controller
 * Synchronizes fullscreen mode with Tauri native window or Web Fullscreen API,
 * and handles standard keyboard shortcuts (Esc to exit, F11 to toggle).
 */

import { useState, useEffect, useCallback } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function useFullscreenController(isDesktop: boolean) {
  const [isFullscreen, setIsFullscreenState] = useState<boolean>(false);

  const setFullscreen = useCallback(
    async (next: boolean) => {
      if (isDesktop) {
        try {
          const win = getCurrentWindow();
          await win.setFullscreen(next);
          setIsFullscreenState(next);
          return;
        } catch (err) {
          console.warn('Tauri setFullscreen failed, falling back to state/web:', err);
        }
      }

      try {
        if (next && !document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        } else if (!next && document.fullscreenElement) {
          await document.exitFullscreen();
        }
      } catch (err) {
        console.warn('Web fullscreen API transition skipped:', err);
      }
      setIsFullscreenState(next);
    },
    [isDesktop]
  );

  const toggleFullscreen = useCallback(() => {
    setFullscreen(!isFullscreen);
  }, [isFullscreen, setFullscreen]);

  // Sync with browser fullscreenchange and Tauri window state
  useEffect(() => {
    const onWebFsChange = () => {
      if (!isDesktop) {
        setIsFullscreenState(Boolean(document.fullscreenElement));
      }
    };
    document.addEventListener('fullscreenchange', onWebFsChange);

    let unlistenResize: (() => void) | undefined;
    if (isDesktop) {
      const win = getCurrentWindow();
      win.isFullscreen()
        .then((fs) => setIsFullscreenState(fs))
        .catch(() => {});

      win.onResized(async () => {
        try {
          const fs = await win.isFullscreen();
          setIsFullscreenState(fs);
        } catch {
          // ignore
        }
      })
        .then((unlisten) => {
          unlistenResize = unlisten;
        })
        .catch(() => {});
    }

    return () => {
      document.removeEventListener('fullscreenchange', onWebFsChange);
      if (unlistenResize) unlistenResize();
    };
  }, [isDesktop]);

  // Global Esc (exit fullscreen) & F11 (toggle fullscreen), including iframe-forwarded events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape' && isFullscreen) {
        e.preventDefault();
        setFullscreen(false);
      }
    };

    const handleIframeForwarded = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string }>).detail;
      if (!detail) return;
      if (detail.key === 'F11') {
        toggleFullscreen();
      } else if (detail.key === 'Escape' && isFullscreen) {
        setFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('lumina:fullscreen-keydown', handleIframeForwarded);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('lumina:fullscreen-keydown', handleIframeForwarded);
    };
  }, [isFullscreen, setFullscreen, toggleFullscreen]);

  return { isFullscreen, setFullscreen, toggleFullscreen };
}
