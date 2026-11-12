/**
 * Lumina Reader - Comic & Manga Domain Types
 * Supporting CBZ, CBR, CBT, CB7 archives, RTL Manga spreads, and Webtoon vertical scroll
 */

export type ComicReadingMode =
  | 'single'      // Single page fit
  | 'dual-ltr'    // Dual page spread, Left-to-Right (Western comics / graphic novels)
  | 'dual-rtl'    // Dual page spread, Right-to-Left (Japanese Manga)
  | 'webtoon';    // Continuous vertical gapless scroll (Korean Webtoons / Manhwa)

export type ComicFitMode =
  | 'fit-height'  // Fits page height into viewport (default for comics)
  | 'fit-width'   // Fits page width into viewport
  | 'fit-screen'  // Fits both dimensions without scrolling
  | 'original';   // 1:1 original pixel scale

export interface ComicPage {
  index: number;
  name: string;
  path: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  isLandscape?: boolean;
}

export interface ComicMetadata {
  title: string;
  series?: string;
  number?: string;
  volume?: string;
  summary?: string;
  writer?: string;
  penciller?: string;
  publisher?: string;
  pageCount: number;
  mangaHint?: 'yes' | 'no' | 'yesAndRightToLeft';
  webtoonHint?: boolean;
  coverPath?: string;
  coverBlobUrl?: string;
}

export interface ComicSettings {
  readingMode: ComicReadingMode;
  fitMode: ComicFitMode;
  firstPageCover: boolean;    // Cover page is displayed alone in dual spreads
  gapless: boolean;           // Zero gap between images in Webtoon mode
  webtoonMaxWidth: number;    // Max width in px for webtoon column (e.g. 850)
  backgroundColor: 'dark' | 'black' | 'theme';
}

export interface ParsedComic {
  id: string;
  fileName: string;
  metadata: ComicMetadata;
  pages: ComicPage[];
}

export const DEFAULT_COMIC_SETTINGS: ComicSettings = {
  readingMode: 'dual-rtl',
  fitMode: 'fit-height',
  firstPageCover: true,
  gapless: true,
  webtoonMaxWidth: 860,
  backgroundColor: 'theme',
};
