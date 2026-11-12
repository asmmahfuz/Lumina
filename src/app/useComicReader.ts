/**
 * Lumina Reader - Comic Reader Lifecycle Hook
 * Manages comic reading state, image streamer disposal, progress tracking, and sample manga generation
 */

import { useState, useCallback, useEffect } from 'react';
import { ParsedComic } from '@/types/comic';
import { ComicImageStreamer } from '@/services/comic/comicImageStreamer';
import { ComicEngine } from '@/services/comic/comicEngine';
import { generateSampleComic } from '@/services/comic/sampleComicGenerator';
import { UniversalBookImporter } from '@/services/storage/bookImporter';
import { localDb } from '@/services/storage/indexedDb';

export function useComicReader(
  onNotify: (msg: string) => void,
  onActivateComicView: () => void,
  onLoadUserData: (bookId: string) => Promise<void>
) {
  const [readingComic, setReadingComic] = useState<ParsedComic | null>(null);
  const [readingComicStreamer, setReadingComicStreamer] = useState<ComicImageStreamer | null>(null);
  const [readingComicPageIndex, setReadingComicPageIndex] = useState<number>(0);
  const [readingComicBookId, setReadingComicBookId] = useState<string | null>(null);

  const handleReadComic = useCallback(
    async (
      comic: ParsedComic,
      streamer: ComicImageStreamer,
      pageIndex = 0,
      bookId?: string
    ) => {
      // Revoke previous streamer's object URLs
      if (readingComicStreamer && readingComicStreamer !== streamer) {
        readingComicStreamer.revokeAll();
      }

      const resolvedId = bookId || comic.id;
      setReadingComic(comic);
      setReadingComicStreamer(streamer);
      setReadingComicBookId(resolvedId);
      setReadingComicPageIndex(pageIndex);
      onActivateComicView();

      await onLoadUserData(resolvedId);
      onNotify(`Reading "${comic.metadata.title}" - Page ${pageIndex + 1}`);
    },
    [readingComicStreamer, onActivateComicView, onLoadUserData, onNotify]
  );

  const handleComicPageChange = useCallback(
    (pageIndex: number, percent: number) => {
      setReadingComicPageIndex(pageIndex);
      if (!readingComic) return;
      const bookId = readingComicBookId || readingComic.id;

      localDb
        .saveReadingProgress({
          bookId,
          pageNumber: pageIndex + 1,
          totalSpineItems: readingComic.pages.length,
          percent,
          updatedAt: Date.now(),
        })
        .catch(console.warn);
    },
    [readingComic, readingComicBookId]
  );

  const handleLoadSampleComic = useCallback(async () => {
    try {
      onNotify('Generating Neon Valkyrie Sample Manga (CBZ)...');
      const buffer = await generateSampleComic();
      const sampleId = 'sample-neon-valkyrie-cbz';

      await UniversalBookImporter.importFile({
        name: 'neon-valkyrie-ch01.cbz',
        data: buffer,
      });

      const { comic, streamer } = await ComicEngine.parseComic(buffer, 'neon-valkyrie-ch01.cbz');
      const savedProgress = await localDb.getReadingProgress(sampleId);
      const resumeIndex = savedProgress?.pageNumber ? savedProgress.pageNumber - 1 : 0;

      await handleReadComic(comic, streamer, resumeIndex, sampleId);
    } catch (err) {
      onNotify(`Failed to load sample manga: ${String(err)}`);
    }
  }, [handleReadComic, onNotify]);

  // Clean up streamer object URLs on unmount
  useEffect(() => {
    return () => {
      if (readingComicStreamer) {
        readingComicStreamer.revokeAll();
      }
    };
  }, [readingComicStreamer]);

  return {
    readingComic,
    readingComicStreamer,
    readingComicPageIndex,
    readingComicBookId,
    handleReadComic,
    handleComicPageChange,
    handleLoadSampleComic,
  };
}
