/**
 * Lumina Reader - High-Performance DjVu Document Engine
 * Pure-Rust WebAssembly wavelet document decoder, canvas rasterization, and text layer extraction
 */

import initDjvu, { WasmDocument, WasmPage, wasmSimd128Supported } from 'djvu-rs';
import {
  FixedDocumentMetadata,
  FixedDocumentOutline,
  FixedPageInfo,
  ParsedFixedDocument,
} from '@/types/pdf';

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

  constructor(doc: WasmDocument) {
    this.doc = doc;
  }

  public get pageCount(): number {
    return this.doc.page_count();
  }

  public getPage(pageNumber: number): WasmPage {
    return this.doc.page(pageNumber - 1);
  }

  public getPageText(pageNumber: number): string | undefined {
    try {
      const page = this.getPage(pageNumber);
      return page.text();
    } catch {
      return undefined;
    }
  }

  /**
   * Renders the requested DjVu page to a canvas context at target scale
   */
  public async renderPageToCanvas(
    pageNumber: number,
    canvas: HTMLCanvasElement,
    scale: number,
    abortSignal?: AbortSignal
  ): Promise<{ width: number; height: number; cssWidth: number; cssHeight: number; cancelled?: boolean }> {
    if (abortSignal?.aborted) {
      return { width: 0, height: 0, cssWidth: 0, cssHeight: 0, cancelled: true };
    }

    const page = this.getPage(pageNumber);
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
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
    if (abortSignal?.aborted) {
      return { width: 0, height: 0, cssWidth, cssHeight, cancelled: true };
    }

    const imageData = ctx.createImageData(w, h);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);

    return {
      width: w,
      height: h,
      cssWidth,
      cssHeight,
    };
  }

  /**
   * Generates or retrieves cached page thumbnail data URL
   */
  public async getPageThumbnail(pageNumber: number, maxWidth = 180): Promise<string> {
    if (this.thumbnailCache.has(pageNumber)) {
      return this.thumbnailCache.get(pageNumber)!;
    }

    const page = this.getPage(pageNumber);
    const baseDpi = page.dpi() || 150;
    const nativeWidth = page.width_at(baseDpi);
    const scale = maxWidth / nativeWidth;
    const thumbDpi = Math.max(Math.round(baseDpi * scale), 36);

    const w = page.width_at(thumbDpi);
    const h = page.height_at(thumbDpi);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const pixels = page.render(thumbDpi);
    const imageData = ctx.createImageData(w, h);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    this.thumbnailCache.set(pageNumber, dataUrl);
    return dataUrl;
  }

  public destroy(): void {
    try {
      this.doc.free();
    } catch {
      // Ignore
    }
    this.thumbnailCache.clear();
  }
}

export class DjvuEngine {
  public static async parseDjvu(
    data: ArrayBuffer | Uint8Array,
    fileName: string
  ): Promise<{ handle: DjvuDocumentHandle; document: ParsedFixedDocument }> {
    await ensureDjvuInit();

    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const doc = WasmDocument.from_bytes(bytes);
    const handle = new DjvuDocumentHandle(doc);
    const pageCount = doc.page_count();

    const pages: FixedPageInfo[] = [];
    for (let i = 0; i < pageCount; i++) {
      const page = doc.page(i);
      const dpi = page.dpi() || 150;
      // Convert to 72 DPI typographic points for layout consistency
      const ptWidth = Math.round(page.width_at(dpi) * (72 / dpi));
      const ptHeight = Math.round(page.height_at(dpi) * (72 / dpi));

      pages.push({
        pageNumber: i + 1,
        width: ptWidth,
        height: ptHeight,
        aspectRatio: ptWidth / ptHeight,
      });
    }

    const cleanTitle = fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .trim();

    let coverBlobUrl: string | undefined;
    try {
      if (pageCount > 0) {
        coverBlobUrl = await handle.getPageThumbnail(1, 240);
      }
    } catch (err) {
      console.warn('Could not extract DjVu cover thumbnail:', err);
    }

    const docId = `djvu-${fileName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}`;

    const metadata: FixedDocumentMetadata = {
      title: cleanTitle,
      author: 'Scanned Document (DjVu)',
      pageCount,
      format: 'djvu',
      fileSizeBytes: bytes.byteLength,
      coverBlobUrl,
    };

    const outline: FixedDocumentOutline[] = pages.map((p) => ({
      id: `djvu-p-${p.pageNumber}`,
      title: `Page ${p.pageNumber}`,
      pageNumber: p.pageNumber,
    }));

    const document: ParsedFixedDocument = {
      id: docId,
      fileName,
      format: 'djvu',
      metadata,
      pages,
      outline,
    };

    return { handle, document };
  }
}
