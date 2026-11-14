/**
 * Lumina Reader - Continuous Vertical Webtoon Scroll
 * Seamless gapless vertical image strip with virtualized loading and real-time scroll tracking
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ComicPage } from '@/types/comic';
import { ComicImageStreamer } from '@/services/comic/comicImageStreamer';

interface ComicWebtoonViewProps {
  pages: ComicPage[];
  streamer: ComicImageStreamer;
  initialPageIndex: number;
  gapless: boolean;
  maxWidth: number;
  onPageChange: (index: number) => void;
  onToggleControls?: () => void;
}

export const ComicWebtoonView: React.FC<ComicWebtoonViewProps> = ({
  pages,
  streamer,
  initialPageIndex,
  gapless,
  maxWidth,
  onPageChange,
  onToggleControls,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadedUrls, setLoadedUrls] = useState<Record<number, string>>({});
  const requestedRef = useRef<Set<number>>(new Set());
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Virtualized IntersectionObserver for loading page images without observer recreation churn
  useEffect(() => {
    requestedRef.current.clear();
    let mounted = true;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute('data-index'));
          if (isNaN(index)) return;
          if (entry.isIntersecting) {
            if (!requestedRef.current.has(index)) {
              requestedRef.current.add(index);
              streamer
                .getPageObjectUrl(index)
                .then((url) => {
                  if (mounted) setLoadedUrls((prev) => ({ ...prev, [index]: url }));
                })
                .catch(console.warn);
            }
          } else {
            const rect = entry.boundingClientRect;
            if (rect.bottom < -1200 || rect.top > window.innerHeight + 1200) {
              requestedRef.current.delete(index);
              setLoadedUrls((prev) => {
                if (!(index in prev)) return prev;
                const next = { ...prev };
                delete next[index];
                return next;
              });
            }
          }
        });
      },
      {
        root: containerRef.current,
        rootMargin: '450px 0px 450px 0px',
        threshold: 0.01,
      }
    );

    pageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      mounted = false;
      observer.disconnect();
    };
  }, [pages, streamer]);

  // Track active page based on scroll position in viewport center
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerCenter = container.scrollTop + container.clientHeight / 2;
    let closestIndex = 0;
    let minDistance = Infinity;

    pageRefs.current.forEach((el, index) => {
      if (!el) return;
      const elCenter = el.offsetTop + el.clientHeight / 2;
      const distance = Math.abs(containerCenter - elCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    onPageChange(closestIndex);
  }, [onPageChange]);

  // Initial scroll to resumed page
  useEffect(() => {
    if (initialPageIndex > 0 && pageRefs.current[initialPageIndex] && containerRef.current) {
      const target = pageRefs.current[initialPageIndex];
      const container = containerRef.current;
      setTimeout(() => {
        if (target && container) {
          container.scrollTo({ top: Math.max(0, target.offsetTop - 16), behavior: 'smooth' });
        }
      }, 150);
    }
  }, [initialPageIndex]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        flex: 1,
        height: '100%',
        width: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0',
        position: 'relative',
        scrollBehavior: 'smooth',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: `${maxWidth}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: 'var(--shadow-xl)',
          backgroundColor: 'var(--color-surface)',
          minHeight: '100%',
          paddingBottom: '80px',
        }}
      >
        {pages.map((page, index) => {
          const url = loadedUrls[index];

          return (
            <div
              key={page.path}
              data-index={index}
              ref={(el) => {
                pageRefs.current[index] = el;
              }}
              onClick={onToggleControls}
              style={{
                width: '100%',
                minHeight: page.height ? `${(page.height / (page.width || 800)) * maxWidth}px` : '500px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: gapless ? '0px' : '8px',
                backgroundColor: 'var(--color-bg)',
                position: 'relative',
                cursor: 'pointer',
              }}
            >
              {url ? (
                <img
                  src={url}
                  alt={`Page ${index + 1}`}
                  loading="lazy"
                  style={{
                    maxWidth: '100%',
                    width: 'auto',
                    height: 'auto',
                    display: 'block',
                    margin: '0 auto',
                    padding: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    padding: '80px',
                    color: 'var(--color-text-muted)',
                    fontSize: '12px',
                    textAlign: 'center',
                  }}
                >
                  Loading page {index + 1}...
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
