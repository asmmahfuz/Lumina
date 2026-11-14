/**
 * Lumina Reader - PDF Metadata & Page Probe Initializer
 * Probes only the initial page on open for instant first paint and text-layer auto-detection.
 */

import * as pdfjsLib from 'pdfjs-dist';
import { FixedDocumentMetadata, FixedPageInfo, ParsedFixedDocument } from '@/types/pdf';

export async function initializeFixedPdfDocument(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  fileName: string,
  fileSizeBytes: number,
  initialPage: number,
  cachedPageSizes?: Array<{ w: number; h: number }>
): Promise<ParsedFixedDocument> {
  const numPages = pdfDoc.numPages;
  const probePageNum = Math.max(1, Math.min(numPages, initialPage));

  const probePage = await pdfDoc.getPage(probePageNum);
  const probeVp = probePage.getViewport({ scale: 1.0 });
  const seedWidth = Math.round(probeVp.width);
  const seedHeight = Math.round(probeVp.height);

  let hasTextLayer = false;
  try {
    const textContent = await probePage.getTextContent();
    hasTextLayer =
      Array.isArray(textContent.items) &&
      textContent.items.some((it) => 'str' in it && typeof it.str === 'string' && it.str.trim().length > 0);
  } catch {
    hasTextLayer = false;
  }
  try {
    probePage.cleanup();
  } catch {
    /* ignore */
  }

  const pages: FixedPageInfo[] = new Array(numPages);
  const hasValidCache = cachedPageSizes && cachedPageSizes.length === numPages;
  for (let i = 0; i < numPages; i++) {
    const w = hasValidCache ? cachedPageSizes[i].w : seedWidth;
    const h = hasValidCache ? cachedPageSizes[i].h : seedHeight;
    pages[i] = {
      pageNumber: i + 1,
      width: w,
      height: h,
      aspectRatio: h > 0 ? w / h : 0.77,
      rotation: probeVp.rotation,
    };
  }

  let title = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();
  let author: string | undefined;
  let subject: string | undefined;
  try {
    const meta = await pdfDoc.getMetadata();
    const info = meta?.info as Record<string, unknown> | undefined;
    if (info) {
      if (typeof info.Title === 'string' && info.Title.trim()) title = info.Title.trim();
      if (typeof info.Author === 'string' && info.Author.trim()) author = info.Author.trim();
      if (typeof info.Subject === 'string' && info.Subject.trim()) subject = info.Subject.trim();
    }
  } catch {
    /* ignore */
  }

  const docId = `pdf-${fileName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}`;
  const metadata: FixedDocumentMetadata = {
    title,
    author: author || 'Unknown Author',
    subject,
    pageCount: numPages,
    format: 'pdf',
    fileSizeBytes,
  };

  return {
    id: docId,
    fileName,
    format: 'pdf',
    metadata,
    pages,
    outline: [],
    hasTextLayer,
  };
}
