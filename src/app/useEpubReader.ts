/**
 * Lumina Reader - EPUB Reader Lifecycle Hook
 * Manages EPUB reading state, spine navigation, CFI position persistence, and sample book loading
 */

import { useState, useCallback, useEffect } from 'react';
import { ParsedEpubBook } from '@/types/epub';
import { SafeArchiveReader } from '@/services/archive/safeDecompressor';
import { EpubEngine } from '@/services/epub/epubEngine';
import { generateSampleEpub } from '@/services/epub/sampleEpubGenerator';
import { MobiEngine } from '@/services/kindle/mobiEngine';
import { generateSampleMobi } from '@/services/kindle/sampleMobiGenerator';
import { Fb2Engine } from '@/services/fb2/fb2Engine';
import { generateSampleFb2 } from '@/services/fb2/sampleFb2Generator';
import { TextEngine } from '@/services/text/textEngine';
import { generateSampleMarkdown } from '@/services/text/sampleTextGenerator';
import { UniversalBookImporter } from '@/services/storage/bookImporter';
import { localDb } from '@/services/storage/indexedDb';

export function useEpubReader(
  onNotify: (msg: string) => void,
  onActivateReaderView: () => void,
  onLoadUserData: (bookId: string) => Promise<void>
) {
  const [readingBook, setReadingBook] = useState<ParsedEpubBook | null>(null);
  const [readingArchive, setReadingArchive] = useState<SafeArchiveReader | null>(null);
  const [readingBookId, setReadingBookId] = useState<string | null>(null);
  const [readingSpineIndex, setReadingSpineIndex] = useState<number>(0);
  const [readingCfi, setReadingCfi] = useState<string | undefined>();

  const handleReadBook = useCallback(
    async (
      book: ParsedEpubBook,
      archive: SafeArchiveReader,
      spineIndex = 0,
      cfi?: string,
      bookId?: string
    ) => {
      const resolvedId = bookId || book.metadata.identifier || book.metadata.title;
      setReadingBook(book);
      setReadingArchive(archive);
      setReadingBookId(resolvedId);
      setReadingSpineIndex(spineIndex);
      setReadingCfi(cfi);
      onActivateReaderView();

      await onLoadUserData(resolvedId);
      onNotify(`Reading "${book.metadata.title}" - Chapter ${spineIndex + 1}`);
    },
    [onActivateReaderView, onLoadUserData, onNotify]
  );

  const handleCfiChange = useCallback(
    (cfi: string, percent: number) => {
      setReadingCfi(cfi);
      if (!readingBook) return;
      const bookId = readingBookId || readingBook.metadata.identifier || readingBook.metadata.title;
      localDb
        .saveReadingProgress({
          bookId,
          currentSpineIndex: readingSpineIndex,
          totalSpineItems: readingBook.spine.length,
          cfi,
          percent,
          updatedAt: Date.now(),
        })
        .catch(console.warn);
    },
    [readingBook, readingBookId, readingSpineIndex]
  );

  // Auto-save on spine index or CFI change
  useEffect(() => {
    if (!readingBook || readingSpineIndex === undefined) return;
    const bookId = readingBookId || readingBook.metadata.identifier || readingBook.metadata.title;
    const total = readingBook.spine.length;
    const percent = total > 0 ? Math.round(((readingSpineIndex + 1) / total) * 100) : 0;

    localDb
      .saveReadingProgress({
        bookId,
        currentSpineIndex: readingSpineIndex,
        totalSpineItems: total,
        cfi: readingCfi,
        percent,
        updatedAt: Date.now(),
      })
      .catch(console.warn);
  }, [readingBook, readingBookId, readingSpineIndex, readingCfi]);

  const handleLoadSampleEpub = useCallback(async () => {
    try {
      onNotify('Loading Alice in Wonderland...');
      const buffer = await generateSampleEpub();
      const { book, archive } = await EpubEngine.parseEpub(buffer);
      const sampleId = 'sample-alice-in-wonderland';

      await UniversalBookImporter.importFile({
        name: 'alice-in-wonderland.epub',
        data: buffer,
      });

      const savedProgress = await localDb.getReadingProgress(sampleId);
      const resumeIndex = savedProgress?.currentSpineIndex ?? 0;
      const resumeCfi = savedProgress?.cfi;

      await handleReadBook(book, archive, resumeIndex, resumeCfi, sampleId);
    } catch (err) {
      onNotify(`Failed to load sample: ${String(err)}`);
    }
  }, [handleReadBook, onNotify]);

  const handleLoadSampleMobi = useCallback(async () => {
    try {
      onNotify('Loading The Quantum Garden (MOBI)...');
      const buffer = await generateSampleMobi();
      const { book, archive } = await MobiEngine.parseMobi(buffer, 'quantum-garden.mobi');
      const sampleId = 'sample-quantum-garden-mobi';

      await UniversalBookImporter.importFile({
        name: 'quantum-garden.mobi',
        data: buffer,
      });

      const savedProgress = await localDb.getReadingProgress(sampleId);
      const resumeIndex = savedProgress?.currentSpineIndex ?? 0;
      const resumeCfi = savedProgress?.cfi;

      await handleReadBook(book, archive, resumeIndex, resumeCfi, sampleId);
    } catch (err) {
      onNotify(`Failed to load sample MOBI: ${String(err)}`);
    }
  }, [handleReadBook, onNotify]);

  const handleLoadSampleFb2 = useCallback(async () => {
    try {
      onNotify("Loading The Starfarer's Soliloquy (FB2)...");
      const buffer = await generateSampleFb2();
      const { book, archive } = await Fb2Engine.parseFb2(buffer, 'starfarers-soliloquy.fb2');
      const sampleId = 'sample-starfarers-soliloquy-fb2';

      await UniversalBookImporter.importFile({
        name: 'starfarers-soliloquy.fb2',
        data: buffer,
      });

      const savedProgress = await localDb.getReadingProgress(sampleId);
      const resumeIndex = savedProgress?.currentSpineIndex ?? 0;
      const resumeCfi = savedProgress?.cfi;

      await handleReadBook(book, archive, resumeIndex, resumeCfi, sampleId);
    } catch (err) {
      onNotify(`Failed to load sample FB2: ${String(err)}`);
    }
  }, [handleReadBook, onNotify]);

  const handleLoadSampleMarkdown = useCallback(async () => {
    try {
      onNotify('Loading The Art of Zen Reading (Markdown)...');
      const buffer = generateSampleMarkdown();
      const { book, archive } = await TextEngine.parseTextDocument(buffer, 'zen-reading.md', 'md');
      const sampleId = 'sample-zen-reading-md';

      await UniversalBookImporter.importFile({
        name: 'zen-reading.md',
        data: buffer,
      });

      const savedProgress = await localDb.getReadingProgress(sampleId);
      const resumeIndex = savedProgress?.currentSpineIndex ?? 0;
      const resumeCfi = savedProgress?.cfi;

      await handleReadBook(book, archive, resumeIndex, resumeCfi, sampleId);
    } catch (err) {
      onNotify(`Failed to load sample Markdown: ${String(err)}`);
    }
  }, [handleReadBook, onNotify]);

  return {
    readingBook,
    readingArchive,
    readingBookId,
    readingSpineIndex,
    readingCfi,
    setReadingSpineIndex,
    setReadingCfi,
    handleReadBook,
    handleCfiChange,
    handleLoadSampleEpub,
    handleLoadSampleMobi,
    handleLoadSampleFb2,
    handleLoadSampleMarkdown,
  };
}
