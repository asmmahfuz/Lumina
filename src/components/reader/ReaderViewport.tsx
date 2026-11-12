/**
 * Lumina Reader - Sandboxed Document Viewport
 * Isolated reading canvas with multi-column pagination, CFI position tracking,
 * touch swipe & keyboard navigation, text highlighting, and in-book full-text search.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useReaderContext } from '@/app/Providers';
import { ParsedEpubBook } from '@/types/epub';
import { Bookmark, Annotation } from '@/types/book';
import { SafeArchiveReader } from '@/services/archive/safeDecompressor';
import { rewriteChapterResources } from '@/services/reader/resourceRewriter';
import { generateReaderStyles, prepareReaderSrcDoc } from '@/services/reader/readerStyleGenerator';
import { useReaderPagination } from '@/services/reader/useReaderPagination';
import { useReaderAnnotations } from './useReaderAnnotations';
import { useReaderSearch } from './useReaderSearch';
import { ReaderSidebar, SidebarTab } from './ReaderSidebar';
import { FloatingChapterNav } from './FloatingChapterNav';
import { EmptyReaderState } from './EmptyReaderState';
import { TextSelectionPopup } from './TextSelectionPopup';
import { AnnotationEditorModal } from './AnnotationEditorModal';
import { useIframeEvents } from './useIframeEvents';
import { PanelLeftOpen } from 'lucide-react';

interface ReaderViewportProps {
  book: ParsedEpubBook | null;
  archive: SafeArchiveReader | null;
  currentSpineIndex: number;
  sidebarOpen: boolean;
  initialCfi?: string;
  sidebarTab?: SidebarTab;
  onSidebarTabChange?: (tab: SidebarTab) => void;
  onSetSpineIndex: (index: number) => void;
  onCfiChange?: (cfi: string, percent: number) => void;
  onBackToLibrary: () => void;
  onOpenTypography: () => void;
  onLoadSampleBook: () => void;
  onToggleSidebar?: () => void;
  bookmarks?: Bookmark[];
  onSelectBookmark?: (bookmark: Bookmark) => void;
  onDeleteBookmark?: (bookmarkId: string) => void;
  onAddCurrentBookmark?: () => void;
  isCurrentPositionBookmarked?: boolean;
  annotations?: Annotation[];
  onSaveAnnotation?: (annotation: Annotation) => void;
  onDeleteAnnotation?: (annotationId: string) => void;
}

export const ReaderViewport: React.FC<ReaderViewportProps> = ({
  book,
  archive,
  currentSpineIndex,
  sidebarOpen,
  initialCfi,
  sidebarTab: externalSidebarTab,
  onSidebarTabChange,
  onSetSpineIndex,
  onCfiChange,
  onBackToLibrary,
  onLoadSampleBook,
  onToggleSidebar,
  bookmarks = [],
  onSelectBookmark,
  onDeleteBookmark,
  onAddCurrentBookmark,
  isCurrentPositionBookmarked = false,
  annotations = [],
  onSaveAnnotation,
  onDeleteAnnotation,
}) => {
  const { theme, typography } = useReaderContext();
  const [srcDoc, setSrcDoc] = useState<string>('');
  const [loadingChapter, setLoadingChapter] = useState<boolean>(false);
  const [internalSidebarTab, setInternalSidebarTab] = useState<SidebarTab>('toc');
  const activeSidebarTab = externalSidebarTab !== undefined ? externalSidebarTab : internalSidebarTab;
  const setSidebarTab = onSidebarTabChange || setInternalSidebarTab;

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentSpineItem = book?.spine[currentSpineIndex];
  const totalSpineItems = book?.spine.length || 1;
  const resolvedBookId = book?.metadata.identifier || book?.metadata.title || 'book';

  const {
    selectionPopup,
    activeEditorAnnotation,
    handleHighlight,
    handleAddNote,
    handleClosePopup,
    handleSaveEditedAnnotation,
    handleDeleteAnnotation,
    handleCloseEditor,
    handleSelectAnnotationFromSidebar,
    handleEditAnnotationFromSidebar,
    attachIframeAnnotationListeners,
    applyCurrentChapterAnnotations,
  } = useReaderAnnotations({
    iframeRef,
    bookId: resolvedBookId,
    currentSpineIndex,
    currentSpineId: currentSpineItem?.idref,
    annotations,
    onSaveAnnotation,
    onDeleteAnnotation,
    onSetSpineIndex,
  });

  const {
    currentPage,
    totalPages,
    isPaginated,
    isTwoPage,
    canGoPrev,
    canGoNext,
    isChapterBoundaryPrev,
    isChapterBoundaryNext,
    goToPage,
    handleNext,
    handlePrev,
    handleKeyDown,
    attachTouchListeners,
    recalculatePagination,
  } = useReaderPagination({
    iframeRef,
    currentSpineIndex,
    totalSpineItems,
    spineId: currentSpineItem?.idref,
    typography,
    initialCfi,
    onSetSpineIndex,
    onCfiChange,
  });

  const {
    activeMatchId,
    searchResult,
    handleSelectSearchMatch,
    handleClearSearch,
    handleSearchResultsChange,
    applyHighlightsToIframe,
  } = useReaderSearch({
    iframeRef,
    currentSpineIndex,
    isPaginated,
    isTwoPage,
    onSetSpineIndex,
    goToPage,
  });

  const openSearchTab = useCallback(() => {
    setSidebarTab('search');
    if (!sidebarOpen && onToggleSidebar) onToggleSidebar();
  }, [setSidebarTab, sidebarOpen, onToggleSidebar]);

  useEffect(() => {
    if (!book || !archive || book.spine.length === 0) return;
    let isMounted = true;

    const loadChapter = async () => {
      setLoadingChapter(true);
      try {
        const item = book.spine[currentSpineIndex];
        if (!item || !archive.hasFile(item.fullPath)) {
          throw new Error(`Chapter not found: ${item?.fullPath}`);
        }
        const raw = await archive.readAsText(item.fullPath);
        const rewritten = await rewriteChapterResources(raw, item.fullPath, archive);
        const styles = generateReaderStyles({ theme, typography });
        if (isMounted) setSrcDoc(prepareReaderSrcDoc(rewritten, styles));
      } catch (err) {
        console.error('Failed to load chapter in viewport:', err);
      } finally {
        if (isMounted) setLoadingChapter(false);
      }
    };

    loadChapter();
    return () => { isMounted = false; };
  }, [book, archive, currentSpineIndex, theme, typography]);

  useEffect(() => {
    const onWindowKey = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement)?.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        openSearchTab();
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        openSearchTab();
      } else {
        handleKeyDown(e);
      }
    };

    window.addEventListener('keydown', onWindowKey);
    return () => window.removeEventListener('keydown', onWindowKey);
  }, [handleKeyDown, openSearchTab]);

  useEffect(() => {
    if (!containerRef.current) return;
    return attachTouchListeners(containerRef.current);
  }, [attachTouchListeners]);

  const handleSelectTocHref = useCallback(
    (targetHref: string) => {
      if (!book) return;
      const [cleanTarget, targetHash] = targetHref.split('#');
      if (cleanTarget) {
        const idx = book.spine.findIndex((s) => s.fullPath === cleanTarget || s.fullPath.endsWith(cleanTarget));
        if (idx !== -1) onSetSpineIndex(idx);
      }
      if (targetHash) {
        setTimeout(() => {
          const doc = iframeRef.current?.contentDocument;
          const el = doc?.getElementById(targetHash) || doc?.querySelector(`[name="${targetHash}"]`);
          el?.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      }
    },
    [book, onSetSpineIndex]
  );

  const { attachIframeEvents } = useIframeEvents({
    iframeRef,
    onAddCurrentBookmark,
    openSearchTab,
    handleKeyDown,
    attachTouchListeners,
    handleSelectTocHref,
    handlePrev,
    handleNext,
  });

  const handleIframeLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;

    setTimeout(() => recalculatePagination(initialCfi), 30);
    applyCurrentChapterAnnotations(doc);
    attachIframeAnnotationListeners(doc);
    applyHighlightsToIframe(doc);
    attachIframeEvents(doc);
  };

  if (!book || !archive) {
    return <EmptyReaderState onLoadSampleBook={onLoadSampleBook} onBackToLibrary={onBackToLibrary} />;
  }

  const chapterFraction = totalPages > 1 ? currentPage / (totalPages - 1) : 0;
  const overallProgressPercent = Math.min(100, Math.round(((currentSpineIndex + chapterFraction) / totalSpineItems) * 100));

  return (
    <div ref={containerRef} style={{ flex: 1, display: 'flex', flexDirection: 'row', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <ReaderSidebar
        book={book} archive={archive} currentSpineIndex={currentSpineIndex}
        isOpen={sidebarOpen} activeTab={activeSidebarTab} onTabChange={setSidebarTab}
        onSelectSpineIndex={onSetSpineIndex} onSelectTocHref={handleSelectTocHref} onToggleSidebar={onToggleSidebar}
        bookmarks={bookmarks} onSelectBookmark={onSelectBookmark} onDeleteBookmark={onDeleteBookmark}
        onAddCurrentBookmark={onAddCurrentBookmark} isCurrentPositionBookmarked={isCurrentPositionBookmarked}
        annotations={annotations} onSelectAnnotation={handleSelectAnnotationFromSidebar}
        onEditAnnotation={handleEditAnnotationFromSidebar} onDeleteAnnotation={handleDeleteAnnotation}
        activeMatchId={activeMatchId} onSelectSearchMatch={handleSelectSearchMatch}
        onClearSearch={handleClearSearch} searchResultCount={searchResult?.totalMatches || 0}
        onSearchResultsChange={handleSearchResultsChange}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {loadingChapter && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg)', zIndex: 2, fontSize: '12px', color: 'var(--color-text-muted)' }}>
              Rendering chapter content...
            </div>
          )}

          {!sidebarOpen && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              title="Open Sidebar (Ctrl+T)"
              style={{ position: 'absolute', top: '16px', left: '16px', height: '28px', width: '28px', padding: 0, borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', cursor: 'pointer', zIndex: 10, opacity: 0.85 }}
            >
              <PanelLeftOpen size={14} />
            </button>
          )}

          <iframe
            ref={iframeRef}
            title={book.metadata.title}
            sandbox="allow-same-origin"
            srcDoc={srcDoc}
            onLoad={handleIframeLoad}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          />

          {selectionPopup && (
            <TextSelectionPopup
              position={selectionPopup.position}
              selectedText={selectionPopup.text}
              onHighlight={(c) => handleHighlight(c, false)}
              onAddNote={handleAddNote}
              onClose={handleClosePopup}
            />
          )}

          <AnnotationEditorModal
            annotation={activeEditorAnnotation}
            isOpen={Boolean(activeEditorAnnotation)}
            onSave={handleSaveEditedAnnotation}
            onDelete={handleDeleteAnnotation}
            onClose={handleCloseEditor}
          />

          <FloatingChapterNav
            canGoPrev={canGoPrev} canGoNext={canGoNext} onPrev={handlePrev} onNext={handleNext}
            currentPage={currentPage + 1} totalPages={totalPages} isTwoPage={isTwoPage} isPaginated={isPaginated}
            isChapterBoundaryPrev={isChapterBoundaryPrev} isChapterBoundaryNext={isChapterBoundaryNext}
            progressPercent={overallProgressPercent} chapterTitle={currentSpineItem?.idref}
          />
        </div>
      </div>
    </div>
  );
};
