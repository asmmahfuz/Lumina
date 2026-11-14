/**
 * Lumina Reader - Comic Sidebar Drawer
 * Dual-tab navigation rail: Page Thumbnails Grid and Page Bookmarks
 */

import React, { useState } from 'react';
import { ParsedComic } from '@/types/comic';
import { Bookmark } from '@/types/book';
import { ComicImageStreamer } from '@/services/comic/comicImageStreamer';
import { ComicThumbnailsList } from './ComicThumbnailsList';
import { Layers, Bookmark as BookmarkIcon, X, Plus, Trash2 } from 'lucide-react';

export type ComicSidebarTab = 'pages' | 'bookmarks';

interface ComicSidebarProps {
  comic: ParsedComic;
  streamer: ComicImageStreamer;
  currentPageIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectPage: (index: number) => void;
  bookmarks: Bookmark[];
  onAddBookmark: () => void;
  onSelectBookmark: (bm: Bookmark) => void;
  onDeleteBookmark: (id: string) => void;
  isCurrentBookmarked: boolean;
}

export const ComicSidebar: React.FC<ComicSidebarProps> = ({
  comic,
  streamer,
  currentPageIndex,
  isOpen,
  onClose,
  onSelectPage,
  bookmarks,
  onAddBookmark,
  onSelectBookmark,
  onDeleteBookmark,
  isCurrentBookmarked,
}) => {
  const [activeTab, setActiveTab] = useState<ComicSidebarTab>('pages');

  if (!isOpen) return null;

  return (
    <aside
      className="glass-panel"
      style={{
        width: '280px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--color-border)',
        zIndex: 'var(--z-drawer)',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      {/* Sidebar Header & Tab Switches */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => setActiveTab('pages')}
            title="Page Thumbnails Grid"
            style={{
              height: '26px',
              padding: '0 8px',
              fontSize: '11px',
              fontWeight: activeTab === 'pages' ? 600 : 400,
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              backgroundColor: activeTab === 'pages' ? 'var(--color-accent-subtle)' : 'transparent',
              color: activeTab === 'pages' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Layers size={13} />
            <span>Pages ({comic.pages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('bookmarks')}
            title="Page Bookmarks"
            style={{
              height: '26px',
              padding: '0 8px',
              fontSize: '11px',
              fontWeight: activeTab === 'bookmarks' ? 600 : 400,
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              backgroundColor: activeTab === 'bookmarks' ? 'var(--color-accent-subtle)' : 'transparent',
              color: activeTab === 'bookmarks' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <BookmarkIcon size={13} />
            <span>Marks ({bookmarks.length})</span>
          </button>
        </div>

        <button
          onClick={onClose}
          title="Close Sidebar"
          style={{
            height: '24px',
            width: '24px',
            padding: 0,
            borderRadius: 'var(--radius-xs)',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Tab 1: Page Thumbnails Grid */}
      {activeTab === 'pages' && (
        <ComicThumbnailsList
          pages={comic.pages}
          streamer={streamer}
          currentPageIndex={currentPageIndex}
          onSelectPage={onSelectPage}
        />
      )}

      {/* Tab 2: Bookmarks */}
      {activeTab === 'bookmarks' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)' }}>
            <button
              onClick={onAddBookmark}
              disabled={isCurrentBookmarked}
              style={{
                width: '100%',
                height: '28px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isCurrentBookmarked ? 'var(--color-surface)' : 'var(--color-accent)',
                color: isCurrentBookmarked ? 'var(--color-text-muted)' : 'var(--color-accent-text)',
                border: '1px solid var(--color-border)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: isCurrentBookmarked ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Plus size={13} />
              <span>{isCurrentBookmarked ? 'Current Page Bookmarked' : `Bookmark Page ${currentPageIndex + 1}`}</span>
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {bookmarks.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '11px' }}>
                No bookmarks saved yet. Press Ctrl+B to bookmark this page.
              </div>
            ) : (
              bookmarks.map((bm) => (
                <div
                  key={bm.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--color-bg)',
                    marginBottom: '6px',
                    cursor: 'pointer',
                  }}
                  onClick={() => onSelectBookmark(bm)}
                >
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {bm.title}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBookmark(bm.id);
                    }}
                    title="Delete Bookmark"
                    style={{
                      height: '20px',
                      width: '20px',
                      padding: 0,
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
