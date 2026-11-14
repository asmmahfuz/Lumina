/**
 * Lumina Reader - Fixed-Layout Documents Sidebar Rail
 * Dual-tab left dock housing Thumbnails and Bookmarks
 */

import React, { useState } from 'react';
import {
  LayoutGrid,
  Bookmark as BookmarkIcon,
  X,
  Trash2,
  Plus,
} from 'lucide-react';
import { ParsedFixedDocument } from '@/types/pdf';
import { Bookmark } from '@/types/book';
import { PdfDocumentHandle } from '@/services/pdf/pdfEngine';
import { DjvuDocumentHandle } from '@/services/djvu/djvuEngine';
import { FixedThumbnailsList } from './FixedThumbnailsList';

export type FixedSidebarTab = 'thumbnails' | 'bookmarks';

interface FixedSidebarProps {
  document: ParsedFixedDocument;
  currentPage: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectPage: (pageNumber: number) => void;
  bookmarks: Bookmark[];
  onAddBookmark: (pageNumber: number) => void;
  onDeleteBookmark: (bookmarkId: string) => void;
  pdfHandle?: PdfDocumentHandle;
  djvuHandle?: DjvuDocumentHandle;
}

export const FixedSidebar: React.FC<FixedSidebarProps> = ({
  document,
  currentPage,
  isOpen,
  onClose,
  onSelectPage,
  bookmarks,
  onAddBookmark,
  onDeleteBookmark,
  pdfHandle,
  djvuHandle,
}) => {
  const [activeTab, setActiveTab] = useState<FixedSidebarTab>('thumbnails');

  if (!isOpen) return null;

  const currentBookmarked = bookmarks.some((b) => b.pageNumber === currentPage);

  return (
    <aside
      className="glass-panel animate-fade-in"
      style={{
        width: '300px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        zIndex: 30,
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* 1. Header with Document Title & Close */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
          <h3
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {document.metadata.title}
          </h3>
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
            {document.metadata.format.toUpperCase()} • {document.pages.length} Pages
          </span>
        </div>

        <button
          onClick={onClose}
          title="Close Sidebar"
          style={{ width: '24px', height: '24px', color: 'var(--color-text-secondary)' }}
        >
          <X size={14} />
        </button>
      </div>

      {/* 2. Tab Navigation Rail */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg)',
        }}
      >
        <button
          onClick={() => setActiveTab('thumbnails')}
          style={{
            flex: 1,
            height: '32px',
            fontSize: '11px',
            fontWeight: activeTab === 'thumbnails' ? 600 : 500,
            color: activeTab === 'thumbnails' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'thumbnails' ? '2px solid var(--color-accent)' : 'none',
            borderRadius: 0,
            gap: '4px',
          }}
        >
          <LayoutGrid size={12} />
          <span>Pages</span>
        </button>

        <button
          onClick={() => setActiveTab('bookmarks')}
          style={{
            flex: 1,
            height: '32px',
            fontSize: '11px',
            fontWeight: activeTab === 'bookmarks' ? 600 : 500,
            color: activeTab === 'bookmarks' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'bookmarks' ? '2px solid var(--color-accent)' : 'none',
            borderRadius: 0,
            gap: '4px',
          }}
        >
          <BookmarkIcon size={12} />
          <span>Marks</span>
        </button>
      </div>

      {/* 3. Tab Body Container */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'thumbnails' ? (
          <FixedThumbnailsList
            pages={document.pages}
            currentPage={currentPage}
            format={document.format}
            pdfHandle={pdfHandle}
            djvuHandle={djvuHandle}
            onSelectPage={onSelectPage}
          />
        ) : (
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Page Bookmarks ({bookmarks.length})
              </span>
              <button
                onClick={() => onAddBookmark(currentPage)}
                disabled={currentBookmarked}
                style={{
                  height: '24px',
                  padding: '0 8px',
                  fontSize: '10px',
                  fontWeight: 600,
                  backgroundColor: currentBookmarked ? 'var(--color-surface-hover)' : 'var(--color-accent)',
                  color: currentBookmarked ? 'var(--color-text-muted)' : 'var(--color-accent-text)',
                  borderRadius: 'var(--radius-xs)',
                  gap: '4px',
                }}
              >
                <Plus size={10} />
                <span>{currentBookmarked ? 'Bookmarked' : 'Add Mark'}</span>
              </button>
            </div>

            {bookmarks.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '11px' }}>
                No bookmarks added yet. Press Ctrl+B to bookmark current page.
              </div>
            ) : (
              bookmarks.map((bm) => (
                <div
                  key={bm.id}
                  onClick={() => bm.pageNumber && onSelectPage(bm.pageNumber)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookmarkIcon size={12} style={{ color: 'var(--color-accent)' }} />
                    <span style={{ fontSize: '11px', fontWeight: 500 }}>
                      {bm.title || `Page ${bm.pageNumber}`}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBookmark(bm.id);
                    }}
                    title="Delete bookmark"
                    style={{ width: '20px', height: '20px', color: 'var(--color-text-muted)' }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
