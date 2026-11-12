/**
 * Lumina Reader - Fixed Canvas Page Renderer
 * Virtualized hardware-accelerated canvas page with synchronized text selection layer
 */

import React, { useEffect, useRef, useState } from 'react';
import { FixedPageInfo, FixedDocumentType } from '@/types/pdf';
import { PdfDocumentHandle } from '@/services/pdf/pdfEngine';
import { DjvuDocumentHandle } from '@/services/djvu/djvuEngine';

interface FixedCanvasPageProps {
  pageNumber: number;
  pageInfo: FixedPageInfo;
  scale: number;
  showTextLayer: boolean;
  format: FixedDocumentType;
  pdfHandle?: PdfDocumentHandle;
  djvuHandle?: DjvuDocumentHandle;
  onVisible?: (pageNumber: number) => void;
}

export const FixedCanvasPage: React.FC<FixedCanvasPageProps> = ({
  pageNumber,
  pageInfo,
  scale,
  showTextLayer,
  format,
  pdfHandle,
  djvuHandle,
  onVisible,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);

  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isRendered, setIsRendered] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const targetWidth = Math.round(pageInfo.width * scale);
  const targetHeight = Math.round(pageInfo.height * scale);

  // 1. Virtualization Intersection Observer (400px preload margin)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsVisible(true);
          onVisible?.(pageNumber);
        } else {
          // Keep rendered if near, or discard canvas if far off-screen
          const rect = entry.boundingClientRect;
          const isFar = rect.bottom < -800 || rect.top > window.innerHeight + 800;
          if (isFar) {
            setIsVisible(false);
            setIsRendered(false);
          }
        }
      },
      { rootMargin: '400px 0px 400px 0px', threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pageNumber, onVisible]);

  // 2. High-Performance Canvas Rendering
  useEffect(() => {
    if (!isVisible) return;

    let isMounted = true;
    const abortController = new AbortController();

    const renderPage = async () => {
      try {
        setRenderError(null);
        const canvas = canvasRef.current;
        if (!canvas) return;

        if (format === 'pdf' && pdfHandle) {
          const res = await pdfHandle.renderPageToCanvas(
            pageNumber,
            canvas,
            scale,
            abortController.signal
          );
          if (res.cancelled || !isMounted) return;

          // Render synchronized text layer
          if (showTextLayer && textLayerRef.current) {
            await pdfHandle.renderPageTextLayer(
              pageNumber,
              textLayerRef.current,
              scale
            );
          }
        } else if (format === 'djvu' && djvuHandle) {
          const res = await djvuHandle.renderPageToCanvas(
            pageNumber,
            canvas,
            scale,
            abortController.signal
          );
          if (res.cancelled || !isMounted) return;
        }

        if (isMounted) {
          setIsRendered(true);
        }
      } catch (err) {
        if (!isMounted || abortController.signal.aborted) return;
        console.warn(`Render error on page ${pageNumber}:`, err);
        setRenderError(String(err));
      }
    };

    renderPage();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [isVisible, pageNumber, scale, showTextLayer, format, pdfHandle, djvuHandle]);

  return (
    <div
      ref={containerRef}
      className="lumina-fixed-page-wrapper"
      data-page-number={pageNumber}
      style={{
        width: `${targetWidth}px`,
        height: `${targetHeight}px`,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {isVisible ? (
        <>
          <canvas
            ref={canvasRef}
            className="lumina-fixed-canvas"
            style={{
              width: `${targetWidth}px`,
              height: `${targetHeight}px`,
              display: isRendered ? 'block' : 'none',
            }}
          />

          {/* Transparent Selection Text Layer */}
          {format === 'pdf' && showTextLayer && (
            <div
              ref={textLayerRef}
              className="textLayer"
              style={{
                width: `${targetWidth}px`,
                height: `${targetHeight}px`,
              }}
            />
          )}

          {/* Loading Shimmer before first paint */}
          {!isRendered && !renderError && (
            <div
              className="lumina-fixed-skeleton"
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-muted)',
                fontSize: '11px',
                borderRadius: 'inherit',
              }}
            >
              <span>Rendering Page {pageNumber}...</span>
            </div>
          )}

          {renderError && (
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                color: 'var(--color-danger, #ef4444)',
                fontSize: '11px',
              }}
            >
              Failed to render page {pageNumber}
            </div>
          )}
        </>
      ) : (
        /* Off-screen Placeholder box with exact page dimensions */
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'var(--color-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-muted)',
            fontSize: '11px',
            borderRadius: 'inherit',
          }}
        >
          <span>Page {pageNumber}</span>
        </div>
      )}

      {/* Floating Page Badge watermark at bottom corner */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          padding: '2px 6px',
          fontSize: '9px',
          fontWeight: 600,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          color: '#ffffff',
          borderRadius: 'var(--radius-xs)',
          pointerEvents: 'none',
          userSelect: 'none',
          letterSpacing: '0.5px',
          zIndex: 4,
        }}
      >
        {pageNumber}
      </div>
    </div>
  );
};
