/**
 * Lumina Reader - Comic Thumbnails Grid
 * Visual grid of comic and manga page thumbnails with lazy image resolution and active page indicator
 */

import React, { useEffect, useState } from 'react';
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
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});

  useEffect(() => {
    pages.forEach((page) => {
      if (!thumbnails[page.index]) {
        streamer
          .getPageObjectUrl(page.index)
          .then((url) => {
            setThumbnails((prev) => ({ ...prev, [page.index]: url }));
          })
          .catch(() => {});
      }
    });
  }, [pages, streamer, thumbnails]);

  return (
    <div
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
