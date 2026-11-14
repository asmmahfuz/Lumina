/**
 * Lumina Reader - Low-RAM DjVu Document Engine
 * Pure-Rust WebAssembly wavelet document decoder with lazy page metadata,
 * bounded thumbnail ObjectURL cache, and DPR-capped rendering.
 */

import initDjvu, { WasmDocument, WasmPage, wasmSimd128Supported } from 'djvu-rs';
import { FixedDocumentMetadata, FixedPageInfo, ParsedFixedDocument } from '@/types/pdf';

const MAX_THUMBNAIL_CACHE = 32;
const MAX_DPR = 1.5;

let djvuInitialized = false;
let djvuInitPromise: Promise<unknown> | null = null;

async function ensureDjvuInit(): Promise<void> {
  if (djvuInitialized) return;
  if (!djvuInitPromise) {
    const isSimd = typeof wasmSimd128Supported === 'function' && wasmSimd128Supported();
    const wasmPath = isSimd ? '/wasm/djvu_rs_simd128.wasm' : '/wasm/djvu_rs_scalar.wasm';
    djvuInitPromise = initDjvu(wasmPath).then(() => {
      djvuInitialized = true;
    });
  }
  await djvuInitPromise;
}

export class DjvuDocumentHandle {
  private doc: WasmDocument;
  private thumbnailCache = new Map<number, string>();
  private disposed = false;

  constructor(doc: WasmDocument) {
    this.doc = doc;
  }

  public get pageCount(): number {
    return this.doc.page_count();
  }

  public getPage(pageNumber: number): WasmPage {
    return this.doc.page(pageNumber - 1);
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
        if (oldUrl) { try { URL.revokeObjectURL(oldUrl); } catch { /* ignore */ } }
      }
    }
  }

  public async renderPageToCanvas(
    pageNumber: number,
    canvas: HTMLCanvasElement,
    scale: number,
    abortSignal?: AbortSignal
  ): Promise<{ width: number; height: number; cssWidth: number; cssHeight: number; cancelled?: boolean }> {
    if (abortSignal?.aborted || this.disposed) {
      return { width: 0, height: 0, cssWidth: 0, cssHeight: 0, cancelled: true };
    }

    const page = this.getPage(pageNumber);
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), MAX_DPR);
    const baseDpi = page.dpi() || 150;
    const targetDpi = Math.max(Math.round(baseDpi * scale * dpr), 72);

    const w = page.width_at(targetDpi);
    const h = page.height_at(targetDpi);

    canvas.width = w;
    canvas.height = h;

    const cssWidth = Math.floor(w / dpr);
    const cssHeight = Math.floor(h / dpr);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not obtain canvas 2D context for DjVu');

    const pixels = page.render(targetDpi);
    if (abortSignal?.aborted || this.disposed) {
      return { width: 0, height: 0, cssWidth, cssHeight, cancelled: true };
    }

    const imageData = ctx.createImageData(w, h);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
    return { width: w, height: h, cssWidth, cssHeight };
  }

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

    const page = this.getPage(pageNumber);
    const baseDpi = page.dpi() || 150;
    const nativeWidth = page.width_at(baseDpi);
    const scale = maxWidth / Math.max(nativeWidth, 1);
    const thumbDpi = Math.max(Math.round(baseDpi * scale), 36);

    const w = page.width_at(thumbDpi);
    const h = page.height_at(thumbDpi);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    try {
      const pixels = page.render(thumbDpi);
      const imageData = ctx.createImageData(w, h);
      imageData.data.set(pixels);
      ctx.putImageData(imageData, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.72));
      if (!blob || this.disposed) return '';
      const url = URL.createObjectURL(blob);
      this.putThumbnail(pageNumber, url);
      return url;
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
  }

  public destroy(): void {
    this.disposed = true;
    try { this.doc.free(); } catch { /* ignore */ }
    for (const url of this.thumbnailCache.values()) {
      try { URL.revokeObjectURL(url); } catch { /* ignore */ }
    }
    this.thumbnailCache.clear();
  }
}

export class DjvuEngine {
  public static async parseDjvu(
    data: ArrayBuffer | Uint8Array,
    fileName: string,
    initialPage = 1,
    cachedPageSizes?: Array<{ w: number; h: number }>
  ): Promise<{ handle: DjvuDocumentHandle; document: ParsedFixedDocument }> {
    await ensureDjvuInit();

    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const doc = WasmDocument.from_bytes(bytes);
    const handle = new DjvuDocumentHandle(doc);
    const pageCount = doc.page_count();

    let seedWidth = 612;
    let seedHeight = 792;
    if (pageCount > 0) {
      const probeIdx = Math.max(0, Math.min(pageCount - 1, initialPage - 1));
      const p = doc.page(probeIdx);
      const dpi = p.dpi() || 150;
      seedWidth = Math.round(p.width_at(dpi) * (72 / dpi));
      seedHeight = Math.round(p.height_at(dpi) * (72 / dpi));
    }

    const hasValidCache = cachedPageSizes && cachedPageSizes.length === pageCount;
    const pages: FixedPageInfo[] = new Array(pageCount);
    for (let i = 0; i < pageCount; i++) {
      const w = hasValidCache ? cachedPageSizes[i].w : seedWidth;
      const h = hasValidCache ? cachedPageSizes[i].h : seedHeight;
      pages[i] = { pageNumber: i + 1, width: w, height: h, aspectRatio: h > 0 ? w / h : 0.77 };
    }

    const cleanTitle = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();
    const docId = `djvu-${fileName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}`;

    const metadata: FixedDocumentMetadata = {
      title: cleanTitle,
      author: 'Scanned Document (DjVu)',
      pageCount,
      format: 'djvu',
      fileSizeBytes: bytes.byteLength,
    };

    return {
      handle,
      document: { id: docId, fileName, format: 'djvu', metadata, pages, outline: [] },
    };
  }
}
