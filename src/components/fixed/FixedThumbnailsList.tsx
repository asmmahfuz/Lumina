/**
 * Lumina Reader - Fixed Document Page Thumbnails Rail
 * Viewport-virtualized thumbnail grid that reuses main-canvas renders first and only decodes visible cards.
 */

import React, { useEffect, useRef, useState } from 'react';
import { FixedPageInfo, FixedDocumentType } from '@/types/pdf';
import { PdfDocumentHandle } from '@/services/pdf/pdfEngine';
import { DjvuDocumentHandle } from '@/services/djvu/djvuEngine';

interface FixedThumbnailsListProps {
  pages: FixedPageInfo[];
  currentPage: number;
  format: FixedDocumentType;
  pdfHandle?: PdfDocumentHandle;
  djvuHandle?: DjvuDocumentHandle;
  onSelectPage: (pageNumber: number) => void;
}

export const FixedThumbnailsList: React.FC<FixedThumbnailsListProps> = ({
  pages,
  currentPage,
  format,
  pdfHandle,
  djvuHandle,
  onSelectPage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const requestedRef = useRef<Set<number>>(new Set());
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});

  // Seed immediately from already-rendered main canvas captures without extra PDF work
  useEffect(() => {
    requestedRef.current.clear();
    const handle = format === 'pdf' ? pdfHandle : djvuHandle;
    if (!handle) return;

    const seeded: Record<number, string> = {};
    for (const p of pages) {
      const cached = handle.getCachedThumbnail(p.pageNumber);
      if (cached) {
        seeded[p.pageNumber] = cached;
        requestedRef.current.add(p.pageNumber);
      }
    }
    setThumbnails(seeded);
  }, [pages, format, pdfHandle, djvuHandle]);

  // Decode ONLY thumbnails visible inside the sidebar viewport
  useEffect(() => {
    const root = containerRef.current;
    const handle = format === 'pdf' ? pdfHandle : djvuHandle;
    if (!root || !handle) return;

    let mounted = true;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const pageNum = Number(entry.target.getAttribute('data-thumb-page'));
          if (!pageNum || requestedRef.current.has(pageNum)) continue;

          const cached = handle.getCachedThumbnail(pageNum);
          if (cached) {
            requestedRef.current.add(pageNum);
            setThumbnails((prev) => (prev[pageNum] ? prev : { ...prev, [pageNum]: cached }));
            continue;
          }

          requestedRef.current.add(pageNum);
          handle
            .getPageThumbnail(pageNum, 140)
            .then((url) => {
              if (mounted && url) {
                setThumbnails((prev) => ({ ...prev, [pageNum]: url }));
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
  }, [pages, format, pdfHandle, djvuHandle]);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px',
        padding: '12px',
        overflowY: 'auto',
        maxHeight: '100%',
      }}
    >
      {pages.map((page) => {
        const isActive = page.pageNumber === currentPage;
        const thumbUrl = thumbnails[page.pageNumber];

        return (
          <div
            key={page.pageNumber}
            ref={(el) => {
              if (el) itemRefs.current.set(page.pageNumber, el);
              else itemRefs.current.delete(page.pageNumber);
            }}
            data-thumb-page={page.pageNumber}
            className={`lumina-thumb-card ${isActive ? 'active' : ''}`}
            onClick={() => onSelectPage(page.pageNumber)}
            title={`Jump to Page ${page.pageNumber}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              aspectRatio: `${page.aspectRatio || 0.77}`,
              backgroundColor: '#ffffff',
            }}
          >
            {thumbUrl ? (
              <img
                src={thumbUrl}
                alt={`Page ${page.pageNumber}`}
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
            ) : (
              <div
                className="lumina-fixed-skeleton"
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-muted)',
                  fontSize: '10px',
                }}
              >
                <span>{page.pageNumber}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
