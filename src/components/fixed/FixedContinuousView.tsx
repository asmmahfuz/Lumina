/**
 * Lumina Reader - Fixed Continuous Vertical Scroll View
 * Smooth gapless or spaced continuous page strip with real-time viewport center tracking
 */

import React, { useEffect, useRef } from 'react';
import { FixedPageInfo, FixedDocumentType } from '@/types/pdf';
import { PdfDocumentHandle } from '@/services/pdf/pdfEngine';
import { DjvuDocumentHandle } from '@/services/djvu/djvuEngine';
import { FixedCanvasPage } from './FixedCanvasPage';

interface FixedContinuousViewProps {
  pages: FixedPageInfo[];
  currentPage: number;
  scale: number;
  showTextLayer: boolean;
  format: FixedDocumentType;
  continuousGap: number;
  pdfHandle?: PdfDocumentHandle;
  djvuHandle?: DjvuDocumentHandle;
  onPageChange: (newPage: number) => void;
  onCoverCaptured?: (blob: Blob) => void;
}

export const FixedContinuousView: React.FC<FixedContinuousViewProps> = ({
  pages,
  currentPage,
  scale,
  showTextLayer,
  format,
  continuousGap,
  pdfHandle,
  djvuHandle,
  onPageChange,
  onCoverCaptured,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef<boolean>(false);

  // 1. Center Viewport Page Tracking on User Scroll
  const handleScroll = () => {
    if (isProgrammaticScrollRef.current) return;
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const centerY = containerRect.top + containerRect.height / 2;

    const pageElements = container.querySelectorAll<HTMLElement>('.lumina-fixed-page-wrapper');
    let closestPage = currentPage;
    let minDistance = Infinity;

    pageElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const pageCenter = rect.top + rect.height / 2;
      const dist = Math.abs(pageCenter - centerY);
      if (dist < minDistance) {
        minDistance = dist;
        const pageNum = parseInt(el.getAttribute('data-page-number') || '1', 10);
        closestPage = pageNum;
      }
    });

    if (closestPage !== currentPage) {
      onPageChange(closestPage);
    }
  };

  // 2. Programmatic Scroll to Current Page on External Jump
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const targetEl = container.querySelector<HTMLElement>(
      `.lumina-fixed-page-wrapper[data-page-number="${currentPage}"]`
    );
    if (!targetEl) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const currentDist = Math.abs(targetRect.top - containerRect.top);

    // Only scroll if not already near view
    if (currentDist > 80) {
      isProgrammaticScrollRef.current = true;
      const scrollDelta = targetRect.top - containerRect.top;
      container.scrollTo({
        top: Math.max(0, container.scrollTop + scrollDelta - 24),
        behavior: 'smooth',
      });
      const timer = setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentPage]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 16px 80px 16px',
        gap: `${continuousGap}px`,
        backgroundColor: 'var(--color-bg)',
      }}
    >
      {pages.map((page) => (
        <FixedCanvasPage
          key={page.pageNumber}
          pageNumber={page.pageNumber}
          pageInfo={page}
          scale={scale}
          showTextLayer={showTextLayer}
          format={format}
          pdfHandle={pdfHandle}
          djvuHandle={djvuHandle}
          onCoverCaptured={page.pageNumber === 1 ? onCoverCaptured : undefined}
        />
      ))}
    </div>
  );
};
