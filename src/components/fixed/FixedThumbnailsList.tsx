/**
 * Lumina Reader - Fixed Document Page Thumbnails Rail
 * Lazy-rendered visual thumbnail grid with active page indicator and click-to-jump
 */

import React, { useEffect, useState } from 'react';
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
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});

  useEffect(() => {
    let isMounted = true;

    // Load thumbnails progressively for visible & initial pages
    const loadThumbs = async () => {
      // Prioritize current page and surrounding pages
      const priorityPages = [
        currentPage,
        ...pages.map((p) => p.pageNumber).filter((p) => Math.abs(p - currentPage) <= 5),
        ...pages.map((p) => p.pageNumber),
      ];

      const seen = new Set<number>();
      for (const pageNum of priorityPages) {
        if (!isMounted || seen.has(pageNum)) continue;
        seen.add(pageNum);

        if (thumbnails[pageNum]) continue;

        try {
          let thumbUrl = '';
          if (format === 'pdf' && pdfHandle) {
            thumbUrl = await pdfHandle.getPageThumbnail(pageNum, 160);
          } else if (format === 'djvu' && djvuHandle) {
            thumbUrl = await djvuHandle.getPageThumbnail(pageNum, 160);
          }

          if (isMounted && thumbUrl) {
            setThumbnails((prev) => ({ ...prev, [pageNum]: thumbUrl }));
          }
        } catch {
          // Ignore individual thumbnail failure
        }
      }
    };

    loadThumbs();

    return () => {
      isMounted = false;
    };
  }, [pages, currentPage, format, pdfHandle, djvuHandle]);

  return (
    <div
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
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  display: 'block',
                }}
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
                P. {page.pageNumber}
              </div>
            )}

            {/* Bottom Page Badge */}
            <div
              style={{
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                padding: '1px 5px',
                fontSize: '9px',
                fontWeight: 600,
                backgroundColor: isActive ? 'var(--color-accent)' : 'rgba(0, 0, 0, 0.65)',
                color: '#ffffff',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              {page.pageNumber}
            </div>
          </div>
        );
      })}
    </div>
  );
};
