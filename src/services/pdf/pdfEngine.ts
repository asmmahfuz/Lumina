/**
 * Lumina Reader - Low-RAM Streaming PDF Engine
 * Supports disk range streaming, instant page-1 first paint, reusable canvas thumbnails,
 * auto-detected text layer, and strict GPU/memory cleanup.
 */

import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { FixedPageInfo, ParsedFixedDocument } from '@/types/pdf';
import { createTauriPdfRangeTransport, PDF_RANGE_CHUNK_SIZE } from './TauriPdfRangeTransport';
import { initializeFixedPdfDocument } from './pdfDocumentInit';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const MAX_THUMBNAIL_CACHE = 32;
const MAX_DPR = 1.5;

export interface RenderPageResult {
  width: number;
  height: number;
  cssWidth: number;
  cssHeight: number;
  cancelled?: boolean;
}

export class PdfDocumentHandle {
  private pdfDoc: pdfjsLib.PDFDocumentProxy;
  private thumbnailCache = new Map<number, string>(); // Bounded LRU of ObjectURLs
  private activeRenderTasks = new Map<number, pdfjsLib.RenderTask>();
  private disposed = false;

  constructor(pdfDoc: pdfjsLib.PDFDocumentProxy) {
    this.pdfDoc = pdfDoc;
  }

  public get pageCount(): number {
    return this.pdfDoc.numPages;
  }

  public getCachedThumbnail(pageNumber: number): string | undefined {
    const url = this.thumbnailCache.get(pageNumber);
    if (url) {
      this.thumbnailCache.delete(pageNumber);
      this.thumbnailCache.set(pageNumber, url);
    }
    return url;
  }

  private putThumbnail(pageNumber: number, url: string): void {
    const existing = this.thumbnailCache.get(pageNumber);
    if (existing && existing !== url) {
      try { URL.revokeObjectURL(existing); } catch { /* ignore */ }
      this.thumbnailCache.delete(pageNumber);
    }
    this.thumbnailCache.set(pageNumber, url);

    if (this.thumbnailCache.size > MAX_THUMBNAIL_CACHE) {
      const oldestKey = this.thumbnailCache.keys().next().value;
      if (oldestKey !== undefined) {
        const oldUrl = this.thumbnailCache.get(oldestKey);
        this.thumbnailCache.delete(oldestKey);
        if (oldUrl) {
          try { URL.revokeObjectURL(oldUrl); } catch { /* ignore */ }
        }
      }
    }
  }

  public async renderPageToCanvas(
    pageNumber: number,
    canvas: HTMLCanvasElement,
    scale: number,
    abortSignal?: AbortSignal
  ): Promise<RenderPageResult> {
    const existingTask = this.activeRenderTasks.get(pageNumber);
    if (existingTask) {
      try { existingTask.cancel(); } catch { /* ignore */ }
      this.activeRenderTasks.delete(pageNumber);
    }

    if (abortSignal?.aborted || this.disposed) {
      return { width: 0, height: 0, cssWidth: 0, cssHeight: 0, cancelled: true };
    }

    const page = await this.pdfDoc.getPage(pageNumber);
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), MAX_DPR);
    const viewport = page.getViewport({ scale: scale * dpr });

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const cssWidth = Math.floor(viewport.width / dpr);
    const cssHeight = Math.floor(viewport.height / dpr);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not obtain 2D canvas context');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderTask = page.render({ canvasContext: ctx, viewport });
    this.activeRenderTasks.set(pageNumber, renderTask);

    try {
      await renderTask.promise;
      this.activeRenderTasks.delete(pageNumber);
      return { width: canvas.width, height: canvas.height, cssWidth, cssHeight };
    } catch (err: unknown) {
      this.activeRenderTasks.delete(pageNumber);
      if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'RenderingCancelledException') {
        return { width: 0, height: 0, cssWidth, cssHeight, cancelled: true };
      }
      throw err;
    } finally {
      try { page.cleanup(); } catch { /* ignore */ }
    }
  }

  public async renderPageTextLayer(pageNumber: number, container: HTMLElement, scale: number): Promise<void> {
    if (this.disposed) return;
    container.innerHTML = '';
    const page = await this.pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const textContent = await page.getTextContent();

    container.style.width = `${Math.floor(viewport.width)}px`;
    container.style.height = `${Math.floor(viewport.height)}px`;

    const textLayer = new pdfjsLib.TextLayer({
      textContentSource: textContent,
      container,
      viewport,
    });
    await textLayer.render();
    try { page.cleanup(); } catch { /* ignore */ }
  }

  /**
   * Reuses an already-painted main canvas to populate the sidebar/cover thumbnail cache without re-decoding PDF.
   */
  public async captureThumbnailFromCanvas(
    pageNumber: number,
    sourceCanvas: HTMLCanvasElement,
    maxWidth = 140
  ): Promise<{ url: string; blob: Blob } | null> {
    if (this.disposed || sourceCanvas.width === 0 || sourceCanvas.height === 0) return null;

    const existing = this.getCachedThumbnail(pageNumber);
    if (existing && pageNumber !== 1) return { url: existing, blob: new Blob() };

    const ratio = sourceCanvas.height / sourceCanvas.width;
    const w = Math.min(maxWidth, sourceCanvas.width);
    const h = Math.max(1, Math.round(w * ratio));

    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    const ctx = offscreen.getContext('2d', { alpha: false });
    if (!ctx) return null;

    ctx.drawImage(sourceCanvas, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) => offscreen.toBlob(resolve, 'image/jpeg', 0.72));
    offscreen.width = 0;
    offscreen.height = 0;
    if (!blob || this.disposed) return null;

    const url = existing || URL.createObjectURL(blob);
    if (!existing) this.putThumbnail(pageNumber, url);
    return { url, blob };
  }

  public async getPageThumbnail(pageNumber: number, maxWidth = 140): Promise<string> {
    const cached = this.getCachedThumbnail(pageNumber);
    if (cached) return cached;
    if (this.disposed) return '';

    const page = await this.pdfDoc.getPage(pageNumber);
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const scale = maxWidth / unscaledViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return '';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    try {
      await page.render({ canvasContext: ctx, viewport }).promise;
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.72));
      if (!blob || this.disposed) return '';
      const url = URL.createObjectURL(blob);
      this.putThumbnail(pageNumber, url);
      return url;
    } finally {
      canvas.width = 0;
      canvas.height = 0;
      try { page.cleanup(); } catch { /* ignore */ }
    }
  }

  /**
   * Lazily scans mixed page sizes during idle time without blocking initial render.
   */
  public async refinePageDimensionsInBackground(
    pages: FixedPageInfo[],
    onComplete?: (sizes: Array<{ w: number; h: number }>) => void
  ): Promise<void> {
    const total = pages.length;
    const batchSize = 8;
    for (let i = 1; i <= total; i++) {
      if (this.disposed) return;
      try {
        const page = await this.pdfDoc.getPage(i);
        const vp = page.getViewport({ scale: 1.0 });
        pages[i - 1] = {
          pageNumber: i,
          width: Math.round(vp.width),
          height: Math.round(vp.height),
          aspectRatio: vp.width / vp.height,
          rotation: vp.rotation,
        };
        page.cleanup();
      } catch {
        // Keep seeded dimension
      }
      if (i % batchSize === 0) {
        await new Promise((r) => setTimeout(r, 16));
      }
    }
    if (!this.disposed && onComplete) {
      onComplete(pages.map((p) => ({ w: p.width, h: p.height })));
    }
  }

  public destroy(): void {
    this.disposed = true;
    for (const task of this.activeRenderTasks.values()) {
      try { task.cancel(); } catch { /* ignore */ }
    }
    this.activeRenderTasks.clear();
    for (const url of this.thumbnailCache.values()) {
      try { URL.revokeObjectURL(url); } catch { /* ignore */ }
    }
    this.thumbnailCache.clear();
    try { this.pdfDoc.destroy(); } catch { /* ignore */ }
  }
}

export class PdfEngine {
  public static async openFromPath(
    filePath: string,
    fileName: string,
    initialPage = 1,
    cachedPageSizes?: Array<{ w: number; h: number }>
  ): Promise<{ handle: PdfDocumentHandle; document: ParsedFixedDocument }> {
    const { transport, fileSize } = await createTauriPdfRangeTransport(filePath, fileName);
    const loadingTask = pdfjsLib.getDocument({
      length: fileSize,
      range: transport,
      rangeChunkSize: PDF_RANGE_CHUNK_SIZE,
      disableAutoFetch: true,
      disableStream: true,
      useSystemFonts: true,
      isEvalSupported: false,
    });
    const pdfDoc = await loadingTask.promise;
    return await this.initDocument(pdfDoc, fileName, fileSize, initialPage, cachedPageSizes);
  }

  public static async parsePdf(
    data: ArrayBuffer | Uint8Array,
    fileName: string,
    initialPage = 1,
    cachedPageSizes?: Array<{ w: number; h: number }>
  ): Promise<{ handle: PdfDocumentHandle; document: ParsedFixedDocument }> {
    const rawBytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const loadingTask = pdfjsLib.getDocument({
      data: rawBytes,
      disableAutoFetch: true,
      useSystemFonts: true,
      isEvalSupported: false,
    });
    const pdfDoc = await loadingTask.promise;
    return await this.initDocument(pdfDoc, fileName, rawBytes.byteLength, initialPage, cachedPageSizes);
  }

  private static async initDocument(
    pdfDoc: pdfjsLib.PDFDocumentProxy,
    fileName: string,
    fileSizeBytes: number,
    initialPage: number,
    cachedPageSizes?: Array<{ w: number; h: number }>
  ): Promise<{ handle: PdfDocumentHandle; document: ParsedFixedDocument }> {
    const handle = new PdfDocumentHandle(pdfDoc);
    const document = await initializeFixedPdfDocument(pdfDoc, fileName, fileSizeBytes, initialPage, cachedPageSizes);
    return { handle, document };
  }
}
