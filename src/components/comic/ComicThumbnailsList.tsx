/**
 * Lumina Reader - Comic Thumbnails Grid
 * Viewport-virtualized comic thumbnails with micro-scaled image reuse and zero observer churn.
 */

import React, { useEffect, useRef, useState } from 'react';
import { ComicPage } from '@/types/comic';
import { ComicImageStreamer } from '@/services/comic/comicImageStreamer';

interface ComicThumbnailsListProps {
  pages: ComicPage[];
  streamer: ComicImageStreamer;
  currentPageIndex: number;
  onSelectPage: (index: number) => void;
}

export const ComicThumbnailsList: React.FC<ComicThumbnailsListProps> = ({
  pages,
  streamer,
  currentPageIndex,
  onSelectPage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const requestedRef = useRef<Set<number>>(new Set());
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});

  useEffect(() => {
    requestedRef.current.clear();
    const seeded: Record<number, string> = {};
    for (const p of pages) {
      const cached = streamer.getCachedThumbnailUrl(p.index);
      if (cached) {
        seeded[p.index] = cached;
        requestedRef.current.add(p.index);
      }
    }
    setThumbnails(seeded);
  }, [pages, streamer]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    let mounted = true;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = Number(entry.target.getAttribute('data-thumb-index'));
          if (isNaN(idx) || requestedRef.current.has(idx)) continue;

          requestedRef.current.add(idx);
          streamer
            .getPageThumbnailUrl(idx, 140)
            .then((url) => {
              if (mounted && url) {
                setThumbnails((prev) => ({ ...prev, [idx]: url }));
              }
            })
            .catch(() => {});
        }
      },
      { root, rootMargin: '120px 0px', threshold: 0.01 }
    );

    itemRefs.current.forEach((el) => observer.observe(el));
    return () => {
      mounted = false;
      observer.disconnect();
    };
  }, [pages, streamer]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px',
        alignContent: 'start',
      }}
    >
      {pages.map((page) => {
        const isActive = page.index === currentPageIndex;
        const thumbUrl = thumbnails[page.index];

        return (
          <div
            key={page.path}
            ref={(el) => {
              if (el) itemRefs.current.set(page.index, el);
              else itemRefs.current.delete(page.index);
            }}
            data-thumb-index={page.index}
            onClick={() => onSelectPage(page.index)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm)',
              border: isActive ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
              backgroundColor: isActive ? 'var(--color-accent-subtle)' : 'var(--color-bg)',
              padding: '4px',
              transition: 'transform 120ms ease',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '140px',
                backgroundColor: 'var(--color-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              {thumbUrl ? (
                <img
                  src={thumbUrl}
                  alt={`Page ${page.index + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                  #{page.index + 1}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: isActive ? 700 : 500,
                marginTop: '4px',
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              }}
            >
              Page {page.index + 1}
            </span>
          </div>
        );
      })}
    </div>
  );
};
