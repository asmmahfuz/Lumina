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
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Virtualized IntersectionObserver for loading page images
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(index) && !loadedUrls[index]) {
              streamer
                .getPageObjectUrl(index)
                .then((url) => {
                  setLoadedUrls((prev) => ({ ...prev, [index]: url }));
                })
                .catch(console.warn);
            }
          }
        });
      },
      {
        root: containerRef.current,
        rootMargin: '600px 0px 600px 0px', // Preload 600px before appearing
        threshold: 0.01,
      }
    );

    pageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [pages, streamer, loadedUrls]);

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
    if (initialPageIndex > 0 && pageRefs.current[initialPageIndex]) {
      const target = pageRefs.current[initialPageIndex];
      setTimeout(() => {
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    margin: 0,
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
