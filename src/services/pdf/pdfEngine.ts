/**
 * Lumina Reader - High-Performance PDF Engine
 * Virtualized canvas rendering, text selection layer, outlines, and Dublin Core metadata extraction
 */

import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import {
  FixedDocumentMetadata,
  FixedDocumentOutline,
  FixedPageInfo,
  ParsedFixedDocument,
} from '@/types/pdf';

// Initialize PDF.js worker securely with bundled Vite asset URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface RenderPageResult {
  width: number;
  height: number;
  cssWidth: number;
  cssHeight: number;
  cancelled?: boolean;
}

export class PdfDocumentHandle {
  private pdfDoc: pdfjsLib.PDFDocumentProxy;
  private thumbnailCache = new Map<number, string>();
  private activeRenderTasks = new Map<number, pdfjsLib.RenderTask>();

  constructor(pdfDoc: pdfjsLib.PDFDocumentProxy) {
    this.pdfDoc = pdfDoc;
  }

  public get pageCount(): number {
    return this.pdfDoc.numPages;
  }

  /**
   * High-DPI hardware-accelerated canvas page rasterization
   */
  public async renderPageToCanvas(
    pageNumber: number,
    canvas: HTMLCanvasElement,
    scale: number,
    abortSignal?: AbortSignal
  ): Promise<RenderPageResult> {
    // Cancel any previous in-flight render for this page number
    const existingTask = this.activeRenderTasks.get(pageNumber);
    if (existingTask) {
      try {
        existingTask.cancel();
      } catch {
        // Ignore cancellation error
      }
      this.activeRenderTasks.delete(pageNumber);
    }

    if (abortSignal?.aborted) {
      return { width: 0, height: 0, cssWidth: 0, cssHeight: 0, cancelled: true };
    }

    const page = await this.pdfDoc.getPage(pageNumber);
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    const viewport = page.getViewport({ scale: scale * dpr });

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const cssWidth = Math.floor(viewport.width / dpr);
    const cssHeight = Math.floor(viewport.height / dpr);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not obtain 2D canvas context');

    // Solid white background for clear contrast under dark themes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderTask = page.render({
      canvasContext: ctx,
      viewport,
    });

    this.activeRenderTasks.set(pageNumber, renderTask);

    try {
      await renderTask.promise;
      this.activeRenderTasks.delete(pageNumber);
      return {
        width: canvas.width,
        height: canvas.height,
        cssWidth,
        cssHeight,
      };
    } catch (err: unknown) {
      this.activeRenderTasks.delete(pageNumber);
      if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'RenderingCancelledException') {
        return { width: 0, height: 0, cssWidth, cssHeight, cancelled: true };
      }
      throw err;
    }
  }

  /**
   * Synchronized transparent text selection layer over the canvas
   */
  public async renderPageTextLayer(
    pageNumber: number,
    container: HTMLElement,
    scale: number
  ): Promise<void> {
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
  }

  /**
   * Fast off-screen page thumbnail generation
   */
  public async getPageThumbnail(pageNumber: number, maxWidth = 180): Promise<string> {
    if (this.thumbnailCache.has(pageNumber)) {
      return this.thumbnailCache.get(pageNumber)!;
    }

    const page = await this.pdfDoc.getPage(pageNumber);
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const scale = maxWidth / unscaledViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport }).promise;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    this.thumbnailCache.set(pageNumber, dataUrl);
    return dataUrl;
  }

  /**
   * Cleanup resources and dispose in-memory caches
   */
  public destroy(): void {
    for (const task of this.activeRenderTasks.values()) {
      try {
        task.cancel();
      } catch {
        // Ignore
      }
    }
    this.activeRenderTasks.clear();
    this.thumbnailCache.clear();
    this.pdfDoc.destroy();
  }
}

export class PdfEngine {
  public static async parsePdf(
    data: ArrayBuffer | Uint8Array,
    fileName: string
  ): Promise<{ handle: PdfDocumentHandle; document: ParsedFixedDocument }> {
    const rawBytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    // Clone bytes so PDF.js worker transfer does not detach caller's ArrayBuffer
    const clonedBytes = new Uint8Array(rawBytes.slice(0));
    const loadingTask = pdfjsLib.getDocument({
      data: clonedBytes,
      useSystemFonts: true,
      isEvalSupported: false,
    });

    const pdfDoc = await loadingTask.promise;
    const handle = new PdfDocumentHandle(pdfDoc);

    const pages: FixedPageInfo[] = [];
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const vp = page.getViewport({ scale: 1.0 });
      pages.push({
        pageNumber: i,
        width: Math.round(vp.width),
        height: Math.round(vp.height),
        aspectRatio: vp.width / vp.height,
        rotation: vp.rotation,
      });
    }

    // Extract metadata
    let title = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();
    let author: string | undefined;
    let subject: string | undefined;
    let keywords: string | undefined;
    let creator: string | undefined;
    let producer: string | undefined;
    let creationDate: string | undefined;

    try {
      const meta = await pdfDoc.getMetadata();
      const info = meta?.info as Record<string, unknown> | undefined;
      if (info) {
        if (typeof info.Title === 'string' && info.Title.trim()) title = info.Title.trim();
        if (typeof info.Author === 'string' && info.Author.trim()) author = info.Author.trim();
        if (typeof info.Subject === 'string' && info.Subject.trim()) subject = info.Subject.trim();
        if (typeof info.Keywords === 'string' && info.Keywords.trim()) keywords = info.Keywords.trim();
        if (typeof info.Creator === 'string' && info.Creator.trim()) creator = info.Creator.trim();
        if (typeof info.Producer === 'string' && info.Producer.trim()) producer = info.Producer.trim();
        if (typeof info.CreationDate === 'string') creationDate = info.CreationDate;
      }
    } catch (err) {
      console.warn('Could not extract PDF metadata:', err);
    }

    // Extract Outline / Bookmarks
    const rawOutline = await pdfDoc.getOutline();
    const outline = await this.mapOutlines(rawOutline, pdfDoc);

    // Extract Cover Thumbnail from Page 1
    let coverBlobUrl: string | undefined;
    try {
      coverBlobUrl = await handle.getPageThumbnail(1, 240);
    } catch (err) {
      console.warn('Could not generate PDF cover thumbnail:', err);
    }

    const docId = `pdf-${fileName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}`;

    const metadata: FixedDocumentMetadata = {
      title,
      author: author || 'Unknown Author',
      subject,
      keywords,
      creator,
      producer,
      creationDate,
      pageCount: pdfDoc.numPages,
      format: 'pdf',
      fileSizeBytes: rawBytes.byteLength,
      coverBlobUrl,
    };

    const document: ParsedFixedDocument = {
      id: docId,
      fileName,
      format: 'pdf',
      metadata,
      pages,
      outline,
    };

    return { handle, document };
  }

  private static async mapOutlines(
    items: unknown[] | null,
    pdfDoc: pdfjsLib.PDFDocumentProxy
  ): Promise<FixedDocumentOutline[]> {
    if (!items || !Array.isArray(items)) return [];

    const result: FixedDocumentOutline[] = [];
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      const raw = item as { title?: string; dest?: unknown; items?: unknown[] };
      let pageNumber: number | undefined;

      if (raw.dest) {
        try {
          let explicitDest: unknown[] | null = null;
          if (typeof raw.dest === 'string') {
            explicitDest = await pdfDoc.getDestination(raw.dest);
          } else if (Array.isArray(raw.dest)) {
            explicitDest = raw.dest;
          }

          if (explicitDest && explicitDest.length > 0) {
            const pageRef = explicitDest[0];
            if (typeof pageRef === 'object' && pageRef !== null) {
              const pageIdx = await pdfDoc.getPageIndex(pageRef as { num: number; gen: number });
              pageNumber = pageIdx + 1;
            } else if (typeof pageRef === 'number') {
              pageNumber = pageRef + 1;
            }
          }
        } catch {
          // Ignore destination resolution error
        }
      }

      const subitems = raw.items && Array.isArray(raw.items)
        ? await this.mapOutlines(raw.items, pdfDoc)
        : undefined;

      result.push({
        id: `toc-${Math.random().toString(36).substring(2, 9)}`,
        title: raw.title || 'Section',
        pageNumber,
        dest: typeof raw.dest === 'string' ? raw.dest : undefined,
        children: subitems && subitems.length > 0 ? subitems : undefined,
      });
    }

    return result;
  }
}
