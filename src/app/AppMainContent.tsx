/**
 * Lumina Reader - Main Viewport Switcher & Dispatcher
 * Renders the active document viewport (Fixed/PDF, Comic/CBZ, Reflowable/EPUB, or Library)
 */

import React from 'react';
import { FixedReaderViewport } from '@/components/fixed/FixedReaderViewport';
import { ComicReaderViewport } from '@/components/comic/ComicReaderViewport';
import { ReaderViewport } from '@/components/reader/ReaderViewport';
import { EpubEngineDashboard } from '@/components/epub/EpubEngineDashboard';
import { ScaffoldDashboard } from '@/components/scaffold/ScaffoldDashboard';
import { LibraryPreview } from '@/components/library/LibraryPreview';
import { SidebarTab } from '@/components/reader/ReaderSidebar';
import { Bookmark, Annotation, BookMetadata } from '@/types/book';
import { ParsedFixedDocument } from '@/types/pdf';
import { PdfDocumentHandle } from '@/services/pdf/pdfEngine';
import { DjvuDocumentHandle } from '@/services/djvu/djvuEngine';
import { ParsedComic } from '@/types/comic';
import { ComicImageStreamer } from '@/services/comic/comicImageStreamer';
import { ParsedEpubBook } from '@/types/epub';
import { SafeArchiveReader } from '@/services/archive/safeDecompressor';

interface AppMainContentProps {
  activeView: string;
  // Fixed Reader (PDF/DJVU)
  fixedDoc: ParsedFixedDocument | null;
  fixedPageNumber: number;
  readingPdfHandle: PdfDocumentHandle | null;
  readingDjvuHandle: DjvuDocumentHandle | null;
  handleFixedPageChange: (page: number, percent: number) => void;
  // Comic Reader
  readingComic: ParsedComic | null;
  readingComicStreamer: ComicImageStreamer | null;
  readingComicPageIndex: number;
  handleComicPageChange: (index: number, percent: number) => void;
  // Reflowable Reader (EPUB/MOBI/FB2/MD)
  readingBook: ParsedEpubBook | null;
  readingArchive: SafeArchiveReader | null;
  readingSpineIndex: number;
  readingCfi?: string;
  setReadingSpineIndex: (index: number) => void;
  setReadingCfi: (cfi?: string) => void;
  handleCfiChange: (cfi: string, percent: number) => void;
  handleReadBook: (book: ParsedEpubBook, archive: SafeArchiveReader) => void;
  // Common Navigation & Data
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarTab: SidebarTab;
  setSidebarTab: (tab: SidebarTab) => void;
  bookmarks: Bookmark[];
  annotations: Annotation[];
  isCurrentBookmarked: boolean;
  handleAddCurrentBookmark: (pageOrIndex?: number) => void;
  handleDeleteBookmark: (id: string) => void;
  handleSelectBookmark: (bm: Bookmark) => void;
  handleSaveAnnotation: (ann: Annotation) => void;
  handleDeleteAnnotation: (id: string) => void;
  setActiveView: (view: any) => void;
  setTypographyOpen: (open: boolean) => void;
  handleLoadSampleEpub: () => void;
  handleOpenLibraryBook: (book: BookMetadata) => void;
  handleOpenFileClick: () => void;
  searchQuery: string;
  lastOpenedBook?: string;
  showToast: (msg: string) => void;
  onOpenStats?: () => void;
}

export const AppMainContent: React.FC<AppMainContentProps> = ({
  activeView,
  fixedDoc,
  fixedPageNumber,
  readingPdfHandle,
  readingDjvuHandle,
  handleFixedPageChange,
  readingComic,
  readingComicStreamer,
  readingComicPageIndex,
  handleComicPageChange,
  readingBook,
  readingArchive,
  readingSpineIndex,
  readingCfi,
  setReadingSpineIndex,
  setReadingCfi,
  handleCfiChange,
  handleReadBook,
  sidebarOpen,
  setSidebarOpen,
  sidebarTab,
  setSidebarTab,
  bookmarks,
  annotations,
  isCurrentBookmarked,
  handleAddCurrentBookmark,
  handleDeleteBookmark,
  handleSelectBookmark,
  handleSaveAnnotation,
  handleDeleteAnnotation,
  setActiveView,
  setTypographyOpen,
  handleLoadSampleEpub,
  handleOpenLibraryBook,
  handleOpenFileClick,
  searchQuery,
  lastOpenedBook,
  showToast,
  onOpenStats,
}) => {
  return (
    <main style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
      {activeView === 'fixed' && fixedDoc ? (
        <FixedReaderViewport
          document={fixedDoc}
          initialPageNumber={fixedPageNumber}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onPageChange={handleFixedPageChange}
          bookmarks={bookmarks}
          onAddBookmark={(pageNum) => handleAddCurrentBookmark(pageNum)}
          onDeleteBookmark={handleDeleteBookmark}
          pdfHandle={readingPdfHandle || undefined}
          djvuHandle={readingDjvuHandle || undefined}
        />
      ) : activeView === 'comic' && readingComic && readingComicStreamer ? (
        <ComicReaderViewport
          comic={readingComic}
          streamer={readingComicStreamer}
          initialPageIndex={readingComicPageIndex}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onPageChange={handleComicPageChange}
          bookmarks={bookmarks}
          onAddBookmark={() => handleAddCurrentBookmark(readingComicPageIndex + 1)}
          onDeleteBookmark={handleDeleteBookmark}
          isCurrentBookmarked={isCurrentBookmarked}
        />
      ) : activeView === 'reader' ? (
        <ReaderViewport
          book={readingBook}
          archive={readingArchive}
          currentSpineIndex={readingSpineIndex}
          sidebarOpen={sidebarOpen}
          sidebarTab={sidebarTab}
          onSidebarTabChange={setSidebarTab}
          initialCfi={readingCfi}
          onSetSpineIndex={(idx) => {
            setReadingSpineIndex(idx);
            setReadingCfi(undefined);
          }}
          onCfiChange={handleCfiChange}
          onBackToLibrary={() => setActiveView('library')}
          onOpenTypography={() => setTypographyOpen(true)}
          onLoadSampleBook={handleLoadSampleEpub}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          bookmarks={bookmarks}
          onSelectBookmark={handleSelectBookmark}
          onDeleteBookmark={handleDeleteBookmark}
          onAddCurrentBookmark={handleAddCurrentBookmark}
          isCurrentPositionBookmarked={isCurrentBookmarked}
          annotations={annotations}
          onSaveAnnotation={handleSaveAnnotation}
          onDeleteAnnotation={handleDeleteAnnotation}
        />
      ) : activeView === 'epub-engine' ? (
        <EpubEngineDashboard onReadBook={handleReadBook} />
      ) : activeView === 'scaffold' ? (
        <ScaffoldDashboard />
      ) : (
        <LibraryPreview
          searchQuery={searchQuery}
          openedBookName={lastOpenedBook}
          onOpenBook={handleOpenLibraryBook}
          onOpenFile={handleOpenFileClick}
          onOpenStats={onOpenStats}
          onNotify={showToast}
        />
      )}
    </main>
  );
};
