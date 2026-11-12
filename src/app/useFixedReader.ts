/**
 * Lumina Reader - Fixed-Layout Documents Lifecycle Hook
 * Manages PDF & DjVu active document state, WASM/canvas handles, and progress auto-resume
 */

import { useState, useCallback, useEffect } from 'react';
import { ParsedFixedDocument } from '@/types/pdf';
import { PdfDocumentHandle, PdfEngine } from '@/services/pdf/pdfEngine';
import { DjvuDocumentHandle, DjvuEngine } from '@/services/djvu/djvuEngine';
import { generateSamplePdf } from '@/services/pdf/samplePdfGenerator';
import { generateSampleDjvu } from '@/services/djvu/sampleDjvuGenerator';
import { localDb } from '@/services/storage/indexedDb';
import { UniversalBookImporter } from '@/services/storage/bookImporter';

export function useFixedReader(
  showToast: (msg: string) => void,
  onOpenFixedView: () => void,
  onLoadUserData: (bookId: string) => Promise<void>
) {
  const [readingDoc, setReadingDoc] = useState<ParsedFixedDocument | null>(null);
  const [readingPdfHandle, setReadingPdfHandle] = useState<PdfDocumentHandle | null>(null);
  const [readingDjvuHandle, setReadingDjvuHandle] = useState<DjvuDocumentHandle | null>(null);
  const [readingPageNumber, setReadingPageNumber] = useState<number>(1);
  const [readingBookId, setReadingBookId] = useState<string | null>(null);

  // Cleanup active document handles on unmount
  useEffect(() => {
    return () => {
      readingPdfHandle?.destroy();
      readingDjvuHandle?.destroy();
    };
  }, [readingPdfHandle, readingDjvuHandle]);

  const handleReadPdf = useCallback(
    async (
      doc: ParsedFixedDocument,
      handle: PdfDocumentHandle,
      initialPage = 1,
      bookId?: string
    ) => {
      readingPdfHandle?.destroy();
      readingDjvuHandle?.destroy();

      setReadingPdfHandle(handle);
      setReadingDjvuHandle(null);
      setReadingDoc(doc);
      setReadingPageNumber(initialPage);
      const activeId = bookId || doc.id;
      setReadingBookId(activeId);

      onOpenFixedView();
      await onLoadUserData(activeId);
      showToast(`Opened "${doc.metadata.title}" (Page ${initialPage})`);
    },
    [readingPdfHandle, readingDjvuHandle, onOpenFixedView, onLoadUserData, showToast]
  );

  const handleReadDjvu = useCallback(
    async (
      doc: ParsedFixedDocument,
      handle: DjvuDocumentHandle,
      initialPage = 1,
      bookId?: string
    ) => {
      readingPdfHandle?.destroy();
      readingDjvuHandle?.destroy();

      setReadingPdfHandle(null);
      setReadingDjvuHandle(handle);
      setReadingDoc(doc);
      setReadingPageNumber(initialPage);
      const activeId = bookId || doc.id;
      setReadingBookId(activeId);

      onOpenFixedView();
      await onLoadUserData(activeId);
      showToast(`Opened "${doc.metadata.title}" (Page ${initialPage})`);
    },
    [readingPdfHandle, readingDjvuHandle, onOpenFixedView, onLoadUserData, showToast]
  );

  const handleFixedPageChange = useCallback(
    async (newPage: number, percent: number) => {
      setReadingPageNumber(newPage);
      if (readingBookId) {
        try {
          await localDb.saveReadingProgress({
            bookId: readingBookId,
            pageNumber: newPage,
            percent,
            updatedAt: Date.now(),
          });
        } catch (err) {
          console.warn('Failed to auto-save fixed document progress:', err);
        }
      }
    },
    [readingBookId]
  );

  const handleLoadSamplePdf = useCallback(async () => {
    try {
      showToast('Generating Quantum Horizons Sample PDF...');
      const buffer = generateSamplePdf();
      const fileName = 'Quantum-Horizons-Fixed-Layout.pdf';

      await UniversalBookImporter.importFile({
        name: fileName,
        data: buffer.slice(0),
      });

      const { handle, document } = await PdfEngine.parsePdf(buffer.slice(0), fileName);
      await handleReadPdf(document, handle, 1, document.id);
    } catch (err) {
      showToast(`Error loading sample PDF: ${String(err)}`);
      console.error(err);
    }
  }, [handleReadPdf, showToast]);

  const handleLoadSampleDjvu = useCallback(async () => {
    try {
      showToast('Generating Historical Monograph Sample DjVu...');
      const buffer = generateSampleDjvu();
      const fileName = 'Wavelet-Historical-Scan.djvu';

      await UniversalBookImporter.importFile({
        name: fileName,
        data: buffer.slice(0),
      });

      const { handle, document } = await DjvuEngine.parseDjvu(buffer.slice(0), fileName);
      await handleReadDjvu(document, handle, 1, document.id);
    } catch (err) {
      showToast(`Error loading sample DjVu: ${String(err)}`);
      console.error(err);
    }
  }, [handleReadDjvu, showToast]);

  return {
    readingDoc,
    readingPdfHandle,
    readingDjvuHandle,
    readingPageNumber,
    readingBookId,
    setReadingPageNumber,
    handleReadPdf,
    handleReadDjvu,
    handleFixedPageChange,
    handleLoadSamplePdf,
    handleLoadSampleDjvu,
  };
}
