/**
 * Lumina Reader - Book & Reading Domain Types
 * Strict typing across all document formats and reading progress metrics
 */

export type BookFormat =
  | 'epub'
  | 'pdf'
  | 'cbz'
  | 'cbr'
  | 'cbt'
  | 'cb7'
  | 'djvu'
  | 'mobi'
  | 'azw3'
  | 'fb2'
  | 'md'
  | 'txt';

export interface Bookmark {
  id: string;
  bookId: string;
  title: string;
  spineIndex: number;
  cfi?: string;
  snippet?: string;
  pageNumber?: number;
  createdAt: number;
}

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange';

export interface Annotation {
  id: string;
  bookId: string;
  spineIndex: number;
  cfi?: string;
  text: string;
  color: HighlightColor;
  note?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface ReadingProgress {
  bookId: string;
  cfi?: string;
  pageNumber?: number;
  totalSpineItems?: number;
  currentSpineIndex?: number;
  percent: number; // 0 to 100
  updatedAt: number;
}

export interface BookMetadata {
  id: string;
  title: string;
  creator?: string; // Author
  description?: string;
  publisher?: string;
  language?: string;
  pubdate?: string;
  format: BookFormat;
  fileSizeBytes: number;
  coverBlobUrl?: string;
  importedAt: number;
  lastReadAt?: number;
  progress?: ReadingProgress;
}

export interface TableOfContentsItem {
  id: string;
  label: string;
  href: string;
  subitems?: TableOfContentsItem[];
}

export type ReadingTheme = 'oled' | 'slate' | 'sepia' | 'paper' | 'light';

export type FontFamilyChoice = 'serif' | 'slab' | 'sans' | 'hyperlegible' | 'mono';

export interface ReaderTypography {
  fontFamily: FontFamilyChoice;
  fontSize: number; // 9 - 28 (default: 12)
  lineHeight: number; // 1.2 - 2.2 (default: 1.65)
  marginPercent: number; // 5 - 25 (default: 15)
  textAlign: 'justify' | 'left';
  twoPageSpread: boolean;
  readingMode?: 'paginated' | 'continuous';
}

export interface ReaderSettings {
  theme: ReadingTheme;
  typography: ReaderTypography;
  zenModeOnIdle: boolean;
}

export const DEFAULT_TYPOGRAPHY: ReaderTypography = {
  fontFamily: 'serif',
  fontSize: 12,
  lineHeight: 1.65,
  marginPercent: 15,
  textAlign: 'justify',
  twoPageSpread: false,
  readingMode: 'paginated',
};

export const DEFAULT_READER_SETTINGS: ReaderSettings = {
  theme: 'oled',
  typography: DEFAULT_TYPOGRAPHY,
  zenModeOnIdle: true,
};
