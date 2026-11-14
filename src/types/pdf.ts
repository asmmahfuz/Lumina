/**
 * Lumina Reader - Fixed-Layout Documents Domain Types
 * Supporting PDF and DjVu virtualized canvas rendering, text selection layer, zoom & thumbnail rail
 */

export type FixedDocumentType = 'pdf' | 'djvu';

export type FixedReadingMode = 'continuous' | 'single' | 'spread';

export type FixedFitMode = 'fit-width' | 'fit-page' | 'original' | 'custom';

export interface FixedPageInfo {
  pageNumber: number; // 1-based index
  width: number;      // Natural width in pt/px
  height: number;     // Natural height in pt/px
  aspectRatio: number;
  rotation?: number;
}

export interface FixedDocumentOutline {
  id: string;
  title: string;
  pageNumber?: number;
  dest?: string | unknown[];
  children?: FixedDocumentOutline[];
}

export interface FixedDocumentMetadata {
  title: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  pageCount: number;
  format: FixedDocumentType;
  fileSizeBytes?: number;
  coverBlobUrl?: string;
}

export interface FixedSettings {
  readingMode: FixedReadingMode;
  fitMode: FixedFitMode;
  scale: number;             // 0.25 to 4.0 (1.0 = 100%)
  showTextLayer: boolean;    // Enables text selection layer over canvas
  continuousGap: number;     // Vertical gap in px between pages (default: 16)
  twoPageSpreadCoverAlone: boolean;
}

export interface ParsedFixedDocument {
  id: string;
  fileName: string;
  format: FixedDocumentType;
  metadata: FixedDocumentMetadata;
  pages: FixedPageInfo[];
  outline: FixedDocumentOutline[];
  hasTextLayer?: boolean;
}

export const DEFAULT_FIXED_SETTINGS: FixedSettings = {
  readingMode: 'continuous',
  fitMode: 'original',
  scale: 1.0,
  showTextLayer: true,
  continuousGap: 16,
  twoPageSpreadCoverAlone: true,
};
