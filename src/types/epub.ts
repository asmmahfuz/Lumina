/**
 * Lumina Reader - EPUB Engine Domain Types
 * Strict type definitions for EPUB archives, Dublin Core metadata, spine & navigation
 */

import { TableOfContentsItem } from './book';

export type { TableOfContentsItem };

export interface SafeArchiveFileEntry {
  path: string;
  size: number;
  isDir: boolean;
  isSafe: boolean;
}

export interface ZipSlipCheckResult {
  isSafe: boolean;
  rejectedPath?: string;
  reason?: string;
}

export interface DublinCoreMetadata {
  title: string;
  creator?: string; // Author
  description?: string;
  publisher?: string;
  language?: string;
  pubdate?: string;
  identifier?: string;
  rights?: string;
  coverHref?: string;
  coverBlobUrl?: string;
  coverData?: ArrayBuffer;
  coverMediaType?: string;
}

export interface EpubManifestItem {
  id: string;
  href: string;
  fullPath: string; // Resolved archive-root path
  mediaType: string;
  properties?: string;
  fallback?: string;
}

export interface EpubSpineItem {
  idref: string;
  index: number;
  linear: boolean;
  fullPath: string;
  manifestItem?: EpubManifestItem;
}

export interface ParsedEpubBook {
  metadata: DublinCoreMetadata;
  opfPath: string;
  opfDir: string;
  version: string;
  manifest: Map<string, EpubManifestItem>;
  spine: EpubSpineItem[];
  toc: TableOfContentsItem[];
  zipSlipAlerts: string[];
}
