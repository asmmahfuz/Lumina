/**
 * Lumina Reader - Root Application Component
 * Coordinates Single-Bar Chrome, Viewport Switching, and Document Reading Lifecycle
 * Supporting EPUB books, Comic & Manga archives (CBZ/CBR), and Fixed Documents Studio (PDF & DJVU)
 */

import React, { useState, useEffect } from 'react';
import { useReaderContext } from './Providers';
import { SingleBarHeader } from '@/components/common/SingleBarHeader';
import { TypographyModal } from '@/components/settings/TypographyModal';
import { ReadingStatsModal } from '@/components/stats/ReadingStatsModal';
import { AppMainContent } from './AppMainContent';
import { SidebarTab } from '@/components/reader/ReaderSidebar';
import { Bookmark } from '@/types/book';
import { useBookUserData } from './useBookUserData';
import { useEpubReader } from './useEpubReader';
import { useComicReader } from './useComicReader';
import { useFixedReader } from './useFixedReader';
import { useDocumentOpener } from './useDocumentOpener';
import { useReadingTracker } from '@/services/reader/useReadingTracker';
import { localDb } from '@/services/storage/indexedDb';
import { downloadArrayBuffer } from '@/services/storage/fileExport';

export const App: React.FC = () => {
  const { activeView, setActiveView } = useReaderContext();
  const [typographyOpen, setTypographyOpen] = useState(false);
  const [lastOpenedBook, setLastOpenedBook] = useState<string | undefined>();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('toc');
  const [statsModalOpen, setStatsModalOpen] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. EPUB Reading Lifecycle
  const {
    readingBook,
    readingArchive,
    readingBookId: epubBookId,
    readingSpineIndex,
    readingCfi,
    setReadingSpineIndex,
    setReadingCfi,
    handleReadBook,
    handleCfiChange,
    handleLoadSampleEpub,
  } = useEpubReader(showToast, () => {
    setSidebarTab('toc');
    setActiveView('reader');
  }, async (id) => {
    await loadUserData(id);
  });

  // 2. Comic & Manga Reading Lifecycle
  const {
    readingComic,
    readingComicStreamer,
    readingComicPageIndex,
    readingComicBookId,
    handleReadComic,
    handleComicPageChange,
  } = useComicReader(showToast, () => {
    setActiveView('comic');
  }, async (id) => {
    await loadUserData(id);
  });

  // 3. Fixed-Layout Documents Studio Lifecycle (PDF & DJVU)
  const {
    readingDoc: fixedDoc,
    readingPdfHandle,
    readingDjvuHandle,
    readingPageNumber: fixedPageNumber,
    readingBookId: fixedBookId,
    setReadingPageNumber: setFixedPageNumber,
    handleReadPdf,
    handleReadDjvu,
    handleFixedPageChange,
  } = useFixedReader(showToast, () => {
    setActiveView('fixed');
  }, async (id) => {
    await loadUserData(id);
  });

  // 4. Multi-Format Opener Dispatcher
  const { handleBookOpened, handleOpenLibraryBook, handleOpenFileClick } = useDocumentOpener({
    handleReadBook,
    handleReadComic,
    handleReadPdf,
    handleReadDjvu,
    showToast,
    setActiveView,
    setLastOpenedBook,
  });

  const activeBookId = activeView === 'comic' ? readingComicBookId : activeView === 'fixed' ? fixedBookId : epubBookId;

  const currentChapterTitle = readingBook?.spine[readingSpineIndex]?.idref || `Chapter ${readingSpineIndex + 1}`;

  // 5. Bookmarks & Annotations Management
  const {
    bookmarks,
    annotations,
    isCurrentBookmarked,
    loadUserData,
    handleAddCurrentBookmark,
    handleDeleteBookmark,
    handleToggleQuickBookmark,
    handleSaveAnnotation,
    handleDeleteAnnotation,
  } = useBookUserData(activeBookId, readingSpineIndex, readingCfi, currentChapterTitle, showToast);

  const activeTitle =
    activeView === 'reader' ? readingBook?.metadata.title :
    activeView === 'comic' ? readingComic?.metadata.title :
    activeView === 'fixed' ? fixedDoc?.metadata.title : undefined;

  const activeChapterInfo =
    activeView === 'reader' && readingBook ? { current: readingSpineIndex + 1, total: readingBook.spine.length } :
    activeView === 'comic' && readingComic ? { current: readingComicPageIndex + 1, total: readingComic.pages.length } :
    activeView === 'fixed' && fixedDoc ? { current: fixedPageNumber, total: fixedDoc.pages.length } : undefined;

  const handleSaveFile = async () => {
    if (!activeBookId) {
      showToast('No active document open to save');
      return;
    }
    try {
      const buffer = await localDb.getBookBlob(activeBookId);
      if (!buffer) {
        showToast('Document binary not found in storage');
        return;
      }
      const book = await localDb.getBook(activeBookId);
      const ext = book?.format || 'epub';
      const cleanTitle = (activeTitle || 'document').replace(/[\\/:*?"<>|]/g, '_');
      downloadArrayBuffer(buffer, `${cleanTitle}.${ext}`);
      showToast(`Exported "${cleanTitle}.${ext}"`);
    } catch (err) {
      showToast(`Save failed: ${String(err)}`);
    }
  };

  const handleSaveAsFile = async () => {
    if (!activeBookId) {
      showToast('No active document open to save as');
      return;
    }
    try {
      const buffer = await localDb.getBookBlob(activeBookId);
      if (!buffer) {
        showToast('Document binary not found in storage');
        return;
      }
      const book = await localDb.getBook(activeBookId);
      const ext = book?.format || 'epub';
      const cleanTitle = (activeTitle || 'document').replace(/[\\/:*?"<>|]/g, '_');
      const customName = window.prompt('Save document as:', `${cleanTitle}.${ext}`);
      if (customName && customName.trim()) {
        const finalName = customName.includes('.') ? customName.trim() : `${customName.trim()}.${ext}`;
        downloadArrayBuffer(buffer, finalName);
        showToast(`Saved as "${finalName}"`);
      }
    } catch (err) {
      showToast(`Save As failed: ${String(err)}`);
    }
  };

  // Global Keyboard Shortcuts (Ctrl+B Bookmark, Ctrl+S Save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        if (activeView === 'comic') {
          e.preventDefault();
          handleAddCurrentBookmark(readingComicPageIndex + 1);
        } else if (activeView === 'fixed') {
          e.preventDefault();
          handleAddCurrentBookmark(fixedPageNumber);
        } else if (activeView === 'reader') {
          e.preventDefault();
          handleToggleQuickBookmark();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveFile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView, readingComicPageIndex, fixedPageNumber, handleAddCurrentBookmark, handleToggleQuickBookmark, activeBookId, activeTitle]);

  const handleSelectBookmark = (bm: Bookmark) => {
    if (activeView === 'comic' && bm.pageNumber) {
      handleComicPageChange(bm.pageNumber - 1, 0);
    } else if (activeView === 'fixed' && bm.pageNumber) {
      setFixedPageNumber(bm.pageNumber);
    } else {
      setReadingSpineIndex(bm.spineIndex);
      setReadingCfi(bm.cfi);
    }
    showToast(`Jumped to bookmark: ${bm.title}`);
  };

  // Active reading detection & stats tracker
  const isReadingActive =
    (activeView === 'reader' || activeView === 'comic' || activeView === 'fixed') &&
    Boolean(activeTitle);

  const { stats, updateWpm } = useReadingTracker({
    bookId: activeBookId,
    isReadingActive,
    pagesInfo: activeChapterInfo,
  });

  const handlePrevChapter = () => {
    if (activeView === 'reader' && readingSpineIndex > 0) setReadingSpineIndex(readingSpineIndex - 1);
    else if (activeView === 'comic' && readingComicPageIndex > 0) handleComicPageChange(readingComicPageIndex - 1, 0);
    else if (activeView === 'fixed' && fixedPageNumber > 1) {
      handleFixedPageChange(fixedPageNumber - 1, Math.round(((fixedPageNumber - 1) / (fixedDoc?.pages.length || 1)) * 100));
    }
  };

  const handleNextChapter = () => {
    if (activeView === 'reader' && readingBook && readingSpineIndex < readingBook.spine.length - 1) setReadingSpineIndex(readingSpineIndex + 1);
    else if (activeView === 'comic' && readingComic && readingComicPageIndex < readingComic.pages.length - 1) handleComicPageChange(readingComicPageIndex + 1, 0);
    else if (activeView === 'fixed' && fixedDoc && fixedPageNumber < fixedDoc.pages.length) {
      handleFixedPageChange(fixedPageNumber + 1, Math.round(((fixedPageNumber + 1) / fixedDoc.pages.length) * 100));
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Strict Single-Bar Chrome Header (<= 32px, ZERO secondary horizontal toolbars) */}
      <SingleBarHeader
        onOpenTypography={() => setTypographyOpen(true)}
        onBookOpened={handleBookOpened}
        onSaveFile={handleSaveFile}
        onSaveAsFile={handleSaveAsFile}
        readingBookTitle={activeTitle}
        readingChapterInfo={activeChapterInfo}
        onPrevChapter={handlePrevChapter}
        onNextChapter={handleNextChapter}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onQuickBookmark={handleToggleQuickBookmark}
        isBookmarked={isCurrentBookmarked}
        onOpenSearch={() => {
          setSidebarTab('search');
          setSidebarOpen(true);
        }}
        onOpenStats={() => setStatsModalOpen(true)}
      />

      {/* 2. Main Viewport Container */}
      <AppMainContent
        activeView={activeView}
        fixedDoc={fixedDoc}
        fixedPageNumber={fixedPageNumber}
        readingPdfHandle={readingPdfHandle}
        readingDjvuHandle={readingDjvuHandle}
        handleFixedPageChange={handleFixedPageChange}
        readingComic={readingComic}
        readingComicStreamer={readingComicStreamer}
        readingComicPageIndex={readingComicPageIndex}
        handleComicPageChange={handleComicPageChange}
        readingBook={readingBook}
        readingArchive={readingArchive}
        readingSpineIndex={readingSpineIndex}
        readingCfi={readingCfi}
        setReadingSpineIndex={setReadingSpineIndex}
        setReadingCfi={setReadingCfi}
        handleCfiChange={handleCfiChange}
        handleReadBook={handleReadBook}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarTab={sidebarTab}
        setSidebarTab={setSidebarTab}
        bookmarks={bookmarks}
        annotations={annotations}
        isCurrentBookmarked={isCurrentBookmarked}
        handleAddCurrentBookmark={handleAddCurrentBookmark}
        handleDeleteBookmark={handleDeleteBookmark}
        handleSelectBookmark={handleSelectBookmark}
        handleSaveAnnotation={handleSaveAnnotation}
        handleDeleteAnnotation={handleDeleteAnnotation}
        setActiveView={setActiveView}
        setTypographyOpen={setTypographyOpen}
        handleLoadSampleEpub={handleLoadSampleEpub}
        handleOpenLibraryBook={handleOpenLibraryBook}
        handleOpenFileClick={handleOpenFileClick}
        searchQuery={searchQuery}
        lastOpenedBook={lastOpenedBook}
        showToast={showToast}
        onOpenStats={() => setStatsModalOpen(true)}
      />

      {/* 3. Typography & Themes Settings Popover */}
      <TypographyModal isOpen={typographyOpen} onClose={() => setTypographyOpen(false)} />

      {/* 4. Reading Statistics & Insights Modal */}
      <ReadingStatsModal
        isOpen={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
        stats={stats}
        onUpdateWpm={updateWpm}
      />

      {/* 5. Subtle Toast Notification */}
      {toastMessage && (
        <div
          className="animate-slide-down glass-panel"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--color-accent)',
            fontSize: '12px',
            fontWeight: 500,
            zIndex: 'var(--z-toast)',
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};
