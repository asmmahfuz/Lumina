/**
 * Lumina Reader - Iframe Events & Interaction Hook
 * Manages event delegation inside sandboxed iframe: shortcuts, edge clicks, touch gestures, and TOC links.
 */

import { useCallback, RefObject } from 'react';

interface UseIframeEventsProps {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  onAddCurrentBookmark?: () => void;
  openSearchTab: () => void;
  handleKeyDown: (e: KeyboardEvent) => void;
  attachTouchListeners: (element: HTMLElement | Document) => () => void;
  handleSelectTocHref: (href: string) => void;
  handlePrev: () => void;
  handleNext: () => void;
}

export function useIframeEvents({
  iframeRef,
  onAddCurrentBookmark,
  openSearchTab,
  handleKeyDown,
  attachTouchListeners,
  handleSelectTocHref,
  handlePrev,
  handleNext,
}: UseIframeEventsProps) {
  const attachIframeEvents = useCallback(
    (doc: Document) => {
      // 1. Keyboard shortcuts forwarding
      doc.addEventListener('keydown', (e: KeyboardEvent) => {
        const isInput =
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement;

        if (e.key === 'Escape' || e.key === 'F11') {
          window.dispatchEvent(new CustomEvent('lumina:fullscreen-keydown', { detail: { key: e.key } }));
        }

        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
          e.preventDefault();
          onAddCurrentBookmark?.();
        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
          e.preventDefault();
          openSearchTab();
        } else if (e.key === '/' && !isInput) {
          e.preventDefault();
          openSearchTab();
        } else {
          handleKeyDown(e);
        }
      });

      // 1b. Forward top-edge mouse proximity when in fullscreen
      doc.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = iframeRef.current?.getBoundingClientRect();
        if (rect && rect.top + e.clientY <= 12) {
          window.dispatchEvent(new CustomEvent('lumina:fullscreen-top-hover'));
        }
      });

      // 2. Touch swipe listeners
      attachTouchListeners(doc);

      // 3. Anchor link interception & margin edge click navigation
      doc.addEventListener('click', (e: MouseEvent) => {
        const target = (e.target as HTMLElement)?.closest('a');
        if (target) {
          const href = target.getAttribute('href');
          if (!href) return;
          e.preventDefault();
          if (href.startsWith('#')) {
            const targetEl =
              doc.getElementById(href.slice(1)) ||
              doc.querySelector(`[name="${href.slice(1)}"]`);
            targetEl?.scrollIntoView({ behavior: 'smooth' });
          } else if (!/^(https?|mailto):/i.test(href)) {
            handleSelectTocHref(href);
          }
          return;
        }

        // Avoid stepping if user was selecting text
        if (doc.getSelection()?.toString().trim()) return;

        const width = doc.documentElement.clientWidth || (iframeRef.current?.clientWidth ?? 800);
        if (e.clientX < Math.min(100, width * 0.15)) {
          handlePrev();
        } else if (e.clientX > width - Math.min(100, width * 0.15)) {
          handleNext();
        }
      });
    },
    [
      iframeRef,
      onAddCurrentBookmark,
      openSearchTab,
      handleKeyDown,
      attachTouchListeners,
      handleSelectTocHref,
      handlePrev,
      handleNext,
    ]
  );

  return { attachIframeEvents };
}
