/**
 * Lumina Reader - Comic & Manga Engine
 * Normalizes CBZ, CBR, CBT, CB7 archives into a unified comic book representation
 */

import { SafeArchiveReader } from '@/services/archive/safeDecompressor';
import { ComicImageStreamer } from './comicImageStreamer';
import { ParsedComic } from '@/types/comic';

export class ComicEngine {
  /**
   * Parses an arbitrary comic archive and initializes the image streamer
   */
  public static async parseComic(
    data: ArrayBuffer | Blob,
    fileName: string
  ): Promise<{ comic: ParsedComic; streamer: ComicImageStreamer }> {
    const archive = await SafeArchiveReader.fromData(data);
    const streamer = new ComicImageStreamer(archive);
    const pages = await streamer.indexComicPages();

    if (pages.length === 0) {
      throw new Error(`Comic archive "${fileName}" contains no readable image files.`);
    }

    const cleanBaseName = fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .trim();

    const metadata = await streamer.parseComicInfo(cleanBaseName);

    // Heuristic detection if filename contains Manga or Webtoon indicators
    const lowerName = fileName.toLowerCase();
    if (!metadata.mangaHint && (lowerName.includes('manga') || lowerName.includes('[manga]'))) {
      metadata.mangaHint = 'yesAndRightToLeft';
    }
    if (!metadata.webtoonHint && (lowerName.includes('webtoon') || lowerName.includes('manhwa'))) {
      metadata.webtoonHint = true;
    }

    // Extract cover blob URL from first page
    if (pages.length > 0) {
      try {
        metadata.coverBlobUrl = await streamer.getPageObjectUrl(0);
      } catch (err) {
        console.warn('Could not extract comic cover thumbnail:', err);
      }
    }

    const comicId = `comic-${fileName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now()}`;

    const comic: ParsedComic = {
      id: comicId,
      fileName,
      metadata,
      pages,
    };

    return { comic, streamer };
  }
}
