/**
 * Lumina Reader - Bookmarks Sidebar List
 * Displays saved bookmarks, timestamps, jump targets, and quick-add controls
 */

import React, { useState, useMemo } from 'react';
import { Bookmark } from '@/types/book';
import { Bookmark as BookmarkIcon, Trash2, Plus, Clock, Search } from 'lucide-react';

interface BookmarksSidebarListProps {
  bookmarks: Bookmark[];
  onSelectBookmark: (bookmark: Bookmark) => void;
  onDeleteBookmark: (bookmarkId: string) => void;
  onAddCurrentBookmark: () => void;
  isCurrentPositionBookmarked: boolean;
  currentChapterTitle?: string;
}

export const BookmarksSidebarList: React.FC<BookmarksSidebarListProps> = ({
  bookmarks,
  onSelectBookmark,
  onDeleteBookmark,
  onAddCurrentBookmark,
  isCurrentPositionBookmarked,
  currentChapterTitle,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  const filteredBookmarks = useMemo(() => {
    if (!filterQuery.trim()) return bookmarks;
    const term = filterQuery.toLowerCase();
    return bookmarks.filter(
      (b) =>
        b.title.toLowerCase().includes(term) ||
        (b.snippet && b.snippet.toLowerCase().includes(term))
    );
  }, [bookmarks, filterQuery]);

  const formatRelativeTime = (timestamp: number): string => {
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 1. Quick Add Bookmark Bar */}
      <div
        style={{
          padding: '8px 10px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <button
          onClick={onAddCurrentBookmark}
          title={isCurrentPositionBookmarked ? 'Page Already Bookmarked' : 'Bookmark Current Position (Ctrl+B)'}
          style={{
            height: '28px',
            padding: '0 10px',
            borderRadius: 'var(--radius-xs)',
            border: isCurrentPositionBookmarked ? '1px solid var(--color-accent)' : '1px dashed var(--color-border)',
            backgroundColor: isCurrentPositionBookmarked ? 'var(--color-accent-subtle)' : 'var(--color-surface)',
            color: isCurrentPositionBookmarked ? 'var(--color-accent)' : 'var(--color-text-primary)',
            fontSize: '11px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            if (!isCurrentPositionBookmarked) {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
              e.currentTarget.style.borderColor = 'var(--color-accent)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isCurrentPositionBookmarked) {
              e.currentTarget.style.backgroundColor = 'var(--color-surface)';
              e.currentTarget.style.borderColor = 'var(--color-border)';
            }
          }}
        >
          {isCurrentPositionBookmarked ? (
            <>
              <BookmarkIcon size={12} fill="currentColor" />
              <span>Bookmarked ({currentChapterTitle || 'Current Page'})</span>
            </>
          ) : (
            <>
              <Plus size={12} />
              <span>Bookmark {currentChapterTitle || 'Current Page'}</span>
            </>
          )}
        </button>

        {bookmarks.length > 2 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 8px',
              height: '24px',
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xs)',
            }}
          >
            <Search size={11} style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder={`Search ${bookmarks.length} bookmarks...`}
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                fontSize: '11px',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
        )}
      </div>

      {/* 2. Bookmarks List or Empty State */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
        {filteredBookmarks.length === 0 ? (
          <div
            style={{
              padding: '30px 16px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--color-text-muted)',
            }}
          >
            <BookmarkIcon size={28} style={{ opacity: 0.3 }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              No Bookmarks Yet
            </span>
            <p style={{ fontSize: '11px', lineHeight: 1.4, margin: 0 }}>
              Save your favorite chapters and reading locations to quickly return later.
            </p>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--color-surface-hover)',
                fontFamily: 'monospace',
              }}
            >
              Shortcut: Ctrl+B
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {filteredBookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  gap: '8px',
                  transition: 'background-color 150ms ease, border-color 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                  e.currentTarget.style.borderColor = 'var(--color-accent-subtle)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
              >
                <button
                  onClick={() => onSelectBookmark(bookmark)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookmarkIcon size={12} style={{ color: 'var(--color-accent)', flexShrink: 0 }} fill="currentColor" />
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {bookmark.title}
                    </span>
                  </div>

                  {bookmark.snippet && (
                    <span
                      style={{
                        fontSize: '10px',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      "{bookmark.snippet}"
                    </span>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '9px',
                      color: 'var(--color-text-muted)',
                      marginTop: '2px',
                    }}
                  >
                    <Clock size={9} />
                    <span>{formatRelativeTime(bookmark.createdAt)}</span>
                    {bookmark.pageNumber !== undefined && (
                      <span>• Page {bookmark.pageNumber + 1}</span>
                    )}
                  </div>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteBookmark(bookmark.id);
                  }}
                  title="Delete Bookmark"
                  aria-label="Delete Bookmark"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    borderRadius: 'var(--radius-xs)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--color-text-muted)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
