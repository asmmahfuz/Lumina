/**
 * Lumina Reader - Fixed Paginated Spread View
 * Single-page and dual-page facing spreads with edge-click zones and keyboard turns
 */

import React from 'react';
import { FixedPageInfo, FixedDocumentType } from '@/types/pdf';
import { PdfDocumentHandle } from '@/services/pdf/pdfEngine';
import { DjvuDocumentHandle } from '@/services/djvu/djvuEngine';
import { FixedCanvasPage } from './FixedCanvasPage';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FixedSpreadViewProps {
  pages: FixedPageInfo[];
  currentPage: number;
  scale: number;
  showTextLayer: boolean;
  format: FixedDocumentType;
  isDualSpread: boolean;
  twoPageSpreadCoverAlone: boolean;
  pdfHandle?: PdfDocumentHandle;
  djvuHandle?: DjvuDocumentHandle;
  onPageChange: (newPage: number) => void;
  onCoverCaptured?: (blob: Blob) => void;
}

export const FixedSpreadView: React.FC<FixedSpreadViewProps> = ({
  pages,
  currentPage,
  scale,
  showTextLayer,
  format,
  isDualSpread,
  twoPageSpreadCoverAlone,
  pdfHandle,
  djvuHandle,
  onPageChange,
  onCoverCaptured,
}) => {
  const totalPages = pages.length;

  // Determine active visible pages
  let visiblePageNumbers: number[] = [currentPage];

  if (isDualSpread) {
    if (currentPage === 1 && twoPageSpreadCoverAlone) {
      visiblePageNumbers = [1];
    } else {
      const isEven = currentPage % 2 === 0;
      const leftPage = isEven ? currentPage : currentPage - 1;
      const rightPage = leftPage + 1;

      visiblePageNumbers = [leftPage];
      if (rightPage <= totalPages) {
        visiblePageNumbers.push(rightPage);
      }
    }
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    const step = isDualSpread && currentPage > 2 ? 2 : 1;
    if (currentPage > 1) {
      onPageChange(Math.max(1, currentPage - step));
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const step = isDualSpread && currentPage > 1 ? 2 : 1;
    if (currentPage < totalPages) {
      onPageChange(Math.min(totalPages, currentPage + step));
    }
  };

  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto',
        padding: '32px 16px 80px 16px',
        backgroundColor: 'var(--color-bg)',
      }}
    >
      {/* Edge Click Navigation Zones */}
      <div
        onClick={handlePrev}
        title="Previous Page"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '12%',
          height: '100%',
          cursor: currentPage > 1 ? 'pointer' : 'default',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingLeft: '12px',
          opacity: 0,
          transition: 'opacity 150ms ease',
        }}
        onMouseEnter={(e) => {
          if (currentPage > 1) e.currentTarget.style.opacity = '0.6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0';
        }}
      >
        {currentPage > 1 && (
          <div
            className="glass-panel"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <ChevronLeft size={20} />
          </div>
        )}
      </div>

      <div
        onClick={handleNext}
        title="Next Page"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '12%',
          height: '100%',
          cursor: currentPage < totalPages ? 'pointer' : 'default',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: '12px',
          opacity: 0,
          transition: 'opacity 150ms ease',
        }}
        onMouseEnter={(e) => {
          if (currentPage < totalPages) e.currentTarget.style.opacity = '0.6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0';
        }}
      >
        {currentPage < totalPages && (
          <div
            className="glass-panel"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <ChevronRight size={20} />
          </div>
        )}
      </div>

      {/* Pages Container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          maxWidth: '100%',
        }}
      >
        {visiblePageNumbers.map((pageNum) => {
          const pageInfo = pages[pageNum - 1];
          if (!pageInfo) return null;

          return (
            <FixedCanvasPage
              key={pageNum}
              pageNumber={pageNum}
              pageInfo={pageInfo}
              scale={scale}
              showTextLayer={showTextLayer}
              format={format}
              pdfHandle={pdfHandle}
              djvuHandle={djvuHandle}
              onCoverCaptured={pageNum === 1 ? onCoverCaptured : undefined}
            />
          );
        })}
      </div>
    </div>
  );
};
