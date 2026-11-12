/**
 * Lumina Reader - Reader Left Sidebar Dock
 * Hosts Series Card (metadata & progress) and quad-tab navigation:
 * Contents (TOC), Bookmarks, Notes (Annotations), and In-Book Search.
 */

import React, { useState } from 'react';
import { ParsedEpubBook } from '@/types/epub';
import { Bookmark, Annotation } from '@/types/book';
import { SearchMatch, BookSearchResult } from '@/types/search';
import { SafeArchiveReader } from '@/services/archive/safeDecompressor';
import { BookOpen, Bookmark as BookmarkIcon, Highlighter, Search } from 'lucide-react';
import { SeriesCard } from './SeriesCard';
import { TocSidebarList } from './TocSidebarList';
import { BookmarksSidebarList } from './BookmarksSidebarList';
import { AnnotationsSidebarList } from './AnnotationsSidebarList';
import { SearchSidebarList } from './SearchSidebarList';

export type SidebarTab = 'toc' | 'bookmarks' | 'annotations' | 'search';

interface ReaderSidebarProps {
  book: ParsedEpubBook;
  archive: SafeArchiveReader;
  currentSpineIndex: number;
  isOpen: boolean;
  activeTab?: SidebarTab;
  onTabChange?: (tab: SidebarTab) => void;
  onSelectSpineIndex: (index: number) => void;
  onSelectTocHref: (href: string) => void;
  onToggleSidebar?: () => void;
  bookmarks?: Bookmark[];
  onSelectBookmark?: (bookmark: Bookmark) => void;
  onDeleteBookmark?: (bookmarkId: string) => void;
  onAddCurrentBookmark?: () => void;
  isCurrentPositionBookmarked?: boolean;
  annotations?: Annotation[];
  onSelectAnnotation?: (annotation: Annotation) => void;
  onEditAnnotation?: (annotation: Annotation) => void;
  onDeleteAnnotation?: (annotationId: string) => void;
  activeMatchId?: string;
  onSelectSearchMatch?: (match: SearchMatch) => void;
  onClearSearch?: () => void;
  searchResultCount?: number;
  onSearchResultsChange?: (results: BookSearchResult | null) => void;
}

export const ReaderSidebar: React.FC<ReaderSidebarProps> = ({
  book,
  archive,
  currentSpineIndex,
  isOpen,
  activeTab: externalTab,
  onTabChange,
  onSelectSpineIndex,
  onSelectTocHref,
  onToggleSidebar,
  bookmarks = [],
  onSelectBookmark,
  onDeleteBookmark,
  onAddCurrentBookmark,
  isCurrentPositionBookmarked = false,
  annotations = [],
  onSelectAnnotation,
  onEditAnnotation,
  onDeleteAnnotation,
  activeMatchId,
  onSelectSearchMatch,
  onClearSearch,
  searchResultCount = 0,
  onSearchResultsChange,
}) => {
  const [internalTab, setInternalTab] = useState<SidebarTab>('toc');
  const activeTab = externalTab !== undefined ? externalTab : internalTab;

  const handleTabClick = (tab: SidebarTab) => {
    if (onTabChange) onTabChange(tab);
    else setInternalTab(tab);
  };

  const { metadata, spine, toc } = book;
  const totalChapters = toc && toc.length > 0 ? toc.length : spine.length;
  const progressPercent = Math.round(((currentSpineIndex + 1) / spine.length) * 100);

  const renderTab = (id: SidebarTab, label: string, icon: React.ReactNode, count?: number) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => handleTabClick(id)}
        style={{
          flex: 1,
          height: '28px',
          background: 'none',
          border: 'none',
          borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
          color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
          fontSize: '11px',
          fontWeight: isActive ? 600 : 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          padding: '0 2px',
          transition: 'color 150ms ease, border-color 150ms ease',
        }}
      >
        {icon}
        <span>{label}</span>
        {count !== undefined && count > 0 && (
          <span
            style={{
              fontSize: '9px',
              fontWeight: 700,
              padding: '1px 4px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: isActive ? 'var(--color-accent)' : 'var(--color-surface-hover)',
              color: isActive ? 'var(--color-accent-text)' : 'var(--color-text-muted)',
            }}
          >
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside
      className="glass-panel"
      style={{
        width: isOpen ? '280px' : '0px',
        opacity: isOpen ? 1 : 0,
        visibility: isOpen ? 'visible' : 'hidden',
        height: '100%',
        backgroundColor: 'var(--color-surface)',
        borderRight: isOpen ? '1px solid var(--color-border)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        zIndex: 'var(--z-base)',
        overflow: 'hidden',
        transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1), opacity 150ms ease',
      }}
    >
      {/* 1. Series Card (Contains cover, series details, and reading percentage) */}
      <SeriesCard
        metadata={metadata}
        currentSpineIndex={currentSpineIndex}
        totalChapters={totalChapters}
        progressPercent={progressPercent}
        onCollapse={onToggleSidebar}
      />

      {/* 2. Quad Navigation Tabs (Contents, Bookmarks, Notes, Search) */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg)',
          padding: '2px 4px 0 4px',
          gap: '2px',
        }}
      >
        {renderTab('toc', 'Contents', <BookOpen size={11} />)}
        {renderTab(
          'bookmarks',
          'Marks',
          <BookmarkIcon size={11} fill={activeTab === 'bookmarks' ? 'currentColor' : 'none'} />,
          bookmarks.length
        )}
        {renderTab('annotations', 'Notes', <Highlighter size={11} />, annotations.length)}
        {renderTab('search', 'Search', <Search size={11} />, searchResultCount)}
      </div>

      {/* 3. Tab Contents */}
      {activeTab === 'bookmarks' ? (
        <div style={{ flex: 1, minHeight: 0 }}>
          <BookmarksSidebarList
            bookmarks={bookmarks}
            onSelectBookmark={(bm) => onSelectBookmark?.(bm)}
            onDeleteBookmark={(id) => onDeleteBookmark?.(id)}
            onAddCurrentBookmark={() => onAddCurrentBookmark?.()}
            isCurrentPositionBookmarked={isCurrentPositionBookmarked}
            currentChapterTitle={`Chapter ${currentSpineIndex + 1}`}
          />
        </div>
      ) : activeTab === 'annotations' ? (
        <div style={{ flex: 1, minHeight: 0 }}>
          <AnnotationsSidebarList
            annotations={annotations}
            currentSpineIndex={currentSpineIndex}
            onSelectAnnotation={(ann) => onSelectAnnotation?.(ann)}
            onEditAnnotation={(ann) => onEditAnnotation?.(ann)}
            onDeleteAnnotation={(id) => onDeleteAnnotation?.(id)}
            getChapterTitle={(idx) => `Chapter ${idx + 1}`}
          />
        </div>
      ) : activeTab === 'search' ? (
        <div style={{ flex: 1, minHeight: 0 }}>
          <SearchSidebarList
            book={book}
            archive={archive}
            currentSpineIndex={currentSpineIndex}
            activeMatchId={activeMatchId}
            onSelectMatch={(match) => onSelectSearchMatch?.(match)}
            onClearSearch={onClearSearch}
            onSearchResultsChange={onSearchResultsChange}
          />
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0 }}>
          <TocSidebarList
            toc={toc}
            spine={spine}
            currentSpineIndex={currentSpineIndex}
            onSelectSpineIndex={onSelectSpineIndex}
            onSelectTocHref={onSelectTocHref}
          />
        </div>
      )}
    </aside>
  );
};
