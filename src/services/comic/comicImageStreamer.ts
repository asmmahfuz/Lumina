/**
 * Lumina Reader - Comic Archive Image Streamer
 * High-speed image extraction, natural alphanumeric sorting,
 * ComicInfo.xml metadata parsing, and memory-safe lazy object URL streaming.
 */

import { SafeArchiveReader } from '@/services/archive/safeDecompressor';
import { ComicMetadata, ComicPage } from '@/types/comic';

const IMAGE_EXT_REGEX = /\.(jpe?g|png|webp|gif|avif|svg)$/i;
const JUNK_PATH_REGEX = /(^|[\\/])(\.|__MACOSX|Thumbs\.db|ehthumbs\.db|desktop\.ini)/i;
const MAX_FULL_PAGE_CACHE = 10;
const MAX_THUMBNAIL_CACHE = 30;

export class ComicImageStreamer {
  private archive: SafeArchiveReader;
  private pages: ComicPage[] = [];
  private objectUrlCache: Map<number, string> = new Map();
  private thumbnailUrlCache: Map<number, string> = new Map();

  constructor(archive: SafeArchiveReader) {
    this.archive = archive;
  }

  /**
   * Scans the archive, naturally sorts image entries, and indexes all pages
   */
  public async indexComicPages(): Promise<ComicPage[]> {
    const allFiles = this.archive.getSafeFileList();
    const imagePaths = allFiles.filter(
      (path) => IMAGE_EXT_REGEX.test(path) && !JUNK_PATH_REGEX.test(path)
    );

    // Natural alphanumeric sorting (e.g. page2.jpg before page10.jpg)
    imagePaths.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );

    this.pages = imagePaths.map((path, index) => {
      const name = path.split('/').pop() || path;
      return {
        index,
        name,
        path,
      };
    });

    return this.pages;
  }

  /**
   * Retrieves or lazily creates an Object URL for a given page index
   */
  public async getPageObjectUrl(index: number): Promise<string> {
    const cached = this.objectUrlCache.get(index);
    if (cached) {
      this.objectUrlCache.delete(index);
      this.objectUrlCache.set(index, cached);
      return cached;
    }

    const page = this.pages[index];
    if (!page) {
      throw new Error(`Page index ${index} out of bounds (total: ${this.pages.length})`);
    }

    const url = await this.archive.readAsObjectUrl(page.path);
    this.objectUrlCache.set(index, url);

    if (this.objectUrlCache.size > MAX_FULL_PAGE_CACHE) {
      const oldest = this.objectUrlCache.keys().next().value;
      if (oldest !== undefined) this.objectUrlCache.delete(oldest);
    }

    if (page.aspectRatio === undefined) {
      this.probeImageDimensions(page, url).catch(() => {});
    }

    return url;
  }

  public getCachedThumbnailUrl(index: number): string | undefined {
    return this.thumbnailUrlCache.get(index);
  }

  public async getPageThumbnailUrl(index: number, maxWidth = 140): Promise<string> {
    const cachedThumb = this.thumbnailUrlCache.get(index);
    if (cachedThumb) return cachedThumb;

    const fullUrl = await this.getPageObjectUrl(index);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = fullUrl;
      });
      const ratio = img.naturalHeight / Math.max(img.naturalWidth, 1);
      const w = Math.min(maxWidth, img.naturalWidth || maxWidth);
      const h = Math.max(1, Math.round(w * ratio));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return fullUrl;
      ctx.drawImage(img, 0, 0, w, h);
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.72));
      canvas.width = 0;
      canvas.height = 0;
      if (!blob) return fullUrl;

      const thumbUrl = URL.createObjectURL(blob);
      this.thumbnailUrlCache.set(index, thumbUrl);
      if (this.thumbnailUrlCache.size > MAX_THUMBNAIL_CACHE) {
        const oldestKey = this.thumbnailUrlCache.keys().next().value;
        if (oldestKey !== undefined) {
          const oldUrl = this.thumbnailUrlCache.get(oldestKey);
          this.thumbnailUrlCache.delete(oldestKey);
          if (oldUrl) { try { URL.revokeObjectURL(oldUrl); } catch { /* ignore */ } }
        }
      }
      return thumbUrl;
    } catch {
      return fullUrl;
    }
  }

  /**
   * Preloads a batch of nearby pages into memory
   */
  public async preloadPages(indices: number[]): Promise<void> {
    const promises = indices
      .filter((idx) => idx >= 0 && idx < this.pages.length && !this.objectUrlCache.has(idx))
      .map((idx) => this.getPageObjectUrl(idx).catch(() => ''));
    await Promise.all(promises);
  }

  /**
   * Parses ComicInfo.xml or metadata.xml from the archive if present
   */
  public async parseComicInfo(fallbackTitle: string): Promise<ComicMetadata> {
    let rawXml = '';
    const candidates = ['ComicInfo.xml', 'comicinfo.xml', 'metadata.xml'];

    for (const name of candidates) {
      if (this.archive.hasFile(name)) {
        try {
          rawXml = await this.archive.readAsText(name);
          break;
        } catch {
          // ignore read error, try next
        }
      }
    }

    const metadata: ComicMetadata = {
      title: fallbackTitle,
      pageCount: this.pages.length,
      coverPath: this.pages[0]?.path,
    };

    if (!rawXml) {
      return metadata;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawXml, 'application/xml');

      const getText = (tag: string) => doc.querySelector(tag)?.textContent?.trim() || undefined;

      metadata.title = getText('Title') || fallbackTitle;
      metadata.series = getText('Series');
      metadata.number = getText('Number');
      metadata.volume = getText('Volume');
      metadata.summary = getText('Summary') || getText('Notes');
      metadata.writer = getText('Writer');
      metadata.penciller = getText('Penciller');
      metadata.publisher = getText('Publisher');

      const mangaVal = getText('Manga')?.toLowerCase();
      if (mangaVal === 'yesandrighttoleft') {
        metadata.mangaHint = 'yesAndRightToLeft';
      } else if (mangaVal === 'yes') {
        metadata.mangaHint = 'yes';
      } else if (mangaVal === 'no') {
        metadata.mangaHint = 'no';
      }

      const webtoonVal = getText('Format')?.toLowerCase();
      if (webtoonVal === 'webtoon') {
        metadata.webtoonHint = true;
      }
    } catch (err) {
      console.warn('Could not parse ComicInfo.xml:', err);
    }

    return metadata;
  }

  /**
   * Probes natural dimensions of an image to detect landscape spreads
   */
  private probeImageDimensions(page: ComicPage, url: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        page.width = img.naturalWidth;
        page.height = img.naturalHeight;
        if (img.naturalHeight > 0) {
          page.aspectRatio = img.naturalWidth / img.naturalHeight;
          page.isLandscape = page.aspectRatio >= 1.25;
        }
        resolve();
      };
      img.onerror = () => resolve();
      img.src = url;
    });
  }

  /**
   * Cleans up all created Object URLs to prevent memory leaks
   */
  public revokeAll(): void {
    this.objectUrlCache.clear();
    for (const url of this.thumbnailUrlCache.values()) {
      try { URL.revokeObjectURL(url); } catch { /* ignore */ }
    }
    this.thumbnailUrlCache.clear();
    this.archive.revokeObjectUrls();
  }

  public getPages(): ComicPage[] {
    return this.pages;
  }

  public getArchive(): SafeArchiveReader {
    return this.archive;
  }
}
