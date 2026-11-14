/**
 * Lumina Reader - Fixed Canvas Page Renderer
 * Virtualized hardware-accelerated canvas page with explicit GPU/RAM cleanup,
 * idle-deferred text selection layer, and thumbnail capture reuse.
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
  onCoverCaptured?: (blob: Blob) => void;
}

const FixedCanvasPageInner: React.FC<FixedCanvasPageProps> = ({
  pageNumber,
  pageInfo,
  scale,
  showTextLayer,
  format,
  pdfHandle,
  djvuHandle,
  onVisible,
  onCoverCaptured,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);

  const [isVisible, setIsVisible] = useState<boolean>(pageNumber <= 2);
  const [isRendered, setIsRendered] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const targetWidth = Math.round(pageInfo.width * scale);
  const targetHeight = Math.round(pageInfo.height * scale);

  // 1. Tight Sliding-Window Virtualization (release GPU/RAM buffers outside viewport)
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
          const rect = entry.boundingClientRect;
          const isFar = rect.bottom < -350 || rect.top > window.innerHeight + 350;
          if (isFar) {
            if (canvasRef.current) {
              canvasRef.current.width = 0;
              canvasRef.current.height = 0;
            }
            if (textLayerRef.current) {
              textLayerRef.current.innerHTML = '';
            }
            setIsVisible(false);
            setIsRendered(false);
          }
        }
      },
      { rootMargin: '240px 0px 240px 0px', threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pageNumber, onVisible]);

  // 2. Canvas Rasterization + Idle Thumbnail Reuse + Deferred Text Layer
  useEffect(() => {
    if (!isVisible) return;

    let isMounted = true;
    const abortController = new AbortController();
    let textTimer: number | undefined;
    let thumbTimer: number | undefined;

    const renderPage = async () => {
      try {
        setRenderError(null);
        const canvas = canvasRef.current;
        if (!canvas) return;

        let cancelled = false;
        if (format === 'pdf' && pdfHandle) {
          const res = await pdfHandle.renderPageToCanvas(pageNumber, canvas, scale, abortController.signal);
          cancelled = Boolean(res.cancelled);
        } else if (format === 'djvu' && djvuHandle) {
          const res = await djvuHandle.renderPageToCanvas(pageNumber, canvas, scale, abortController.signal);
          cancelled = Boolean(res.cancelled);
        }

        if (cancelled || !isMounted) return;
        setIsRendered(true);

        // Reuse main canvas render for sidebar thumbnail & Page 1 cover during idle time
        const handle = format === 'pdf' ? pdfHandle : djvuHandle;
        if (handle) {
          const runThumb = () => {
            if (!isMounted || abortController.signal.aborted || !canvasRef.current) return;
            handle.captureThumbnailFromCanvas(pageNumber, canvasRef.current, 140)
              .then((captured) => {
                if (pageNumber === 1 && captured && captured.blob.size > 0) {
                  onCoverCaptured?.(captured.blob);
                }
              })
              .catch(() => {});
          };
          if (typeof window.requestIdleCallback === 'function') {
            thumbTimer = window.requestIdleCallback(runThumb, { timeout: 600 });
          } else {
            thumbTimer = (window as Window).setTimeout(runThumb, 80);
          }
        }

        // Defer text-layer extraction until scroll settles so image-heavy PDFs stay instant
        if (format === 'pdf' && showTextLayer && pdfHandle && textLayerRef.current) {
          textTimer = window.setTimeout(() => {
            if (!isMounted || abortController.signal.aborted || !textLayerRef.current) return;
            pdfHandle.renderPageTextLayer(pageNumber, textLayerRef.current, scale).catch(() => {});
          }, 140);
        } else if (textLayerRef.current) {
          textLayerRef.current.innerHTML = '';
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
      if (textTimer !== undefined) window.clearTimeout(textTimer);
      if (thumbTimer !== undefined) {
        if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(thumbTimer);
        else (window as Window).clearTimeout(thumbTimer);
      }
    };
  }, [isVisible, pageNumber, scale, showTextLayer, format, pdfHandle, djvuHandle, onCoverCaptured]);

  // Explicitly zero GPU canvas buffer on unmount
  useEffect(() => {
    return () => {
      if (canvasRef.current) {
        canvasRef.current.width = 0;
        canvasRef.current.height = 0;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="lumina-fixed-page-wrapper"
      data-page-number={pageNumber}
      style={{
        width: `${targetWidth}px`,
        height: `${targetHeight}px`,
        flexShrink: 0,
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

          {format === 'pdf' && showTextLayer && (
            <div
              ref={textLayerRef}
              className="textLayer"
              style={{ width: `${targetWidth}px`, height: `${targetHeight}px` }}
            />
          )}

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
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-danger, #ef4444)', fontSize: '11px' }}>
              Failed to render page {pageNumber}
            </div>
          )}
        </>
      ) : (
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

export const FixedCanvasPage = React.memo(FixedCanvasPageInner);
