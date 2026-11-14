/**
 * Lumina Reader - Library List View Table
 * Compact tabular list of all cataloged books with detailed metrics and inline actions
 */

import React from 'react';
import { BookMetadata } from '@/types/book';
import { BookOpen, Info, Trash2, BookText } from 'lucide-react';

interface LibraryListViewProps {
  books: BookMetadata[];
  onOpenBook: (book: BookMetadata) => void;
  onShowInfo: (book: BookMetadata) => void;
  onDeleteBook: (book: BookMetadata) => void;
}

export const LibraryListView: React.FC<LibraryListViewProps> = ({
  books,
  onOpenBook,
  onShowInfo,
  onDeleteBook,
}) => {
  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 KB';
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  };

  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div
      className="glass-panel"
      style={{
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--color-surface)',
                borderBottom: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              <th style={{ padding: '10px 16px', minWidth: '240px' }}>Book / Document</th>
              <th style={{ padding: '10px 12px', width: '90px' }}>Format</th>
              <th style={{ padding: '10px 16px', minWidth: '160px' }}>Reading Progress</th>
              <th style={{ padding: '10px 12px', width: '90px' }}>Size</th>
              <th style={{ padding: '10px 12px', width: '120px' }}>Added</th>
              <th style={{ padding: '10px 16px', width: '120px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => {
              const percent = book.progress?.percent || 0;
              return (
                <tr
                  key={book.id}
                  onClick={() => onOpenBook(book)}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    transition: 'background-color 120ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* Title & Author with Thumbnail */}
                  <td style={{ padding: '8px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '44px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: 'var(--color-surface-active)',
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        {book.coverBlobUrl ? (
                          <img
                            src={book.coverBlobUrl}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <BookText size={16} style={{ color: 'var(--color-accent)', opacity: 0.7 }} />
                        )}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: 'var(--color-text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '300px',
                          }}
                          title={book.title}
                        >
                          {book.title}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--color-text-secondary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '300px',
                          }}
                        >
                          {book.creator || 'Unknown Author'}
                        </div>
                        <div
                          style={{
                            fontSize: '10px',
                            color: 'var(--color-text-muted)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '300px',
                          }}
                          title={book.filePath || book.fileName || book.title}
                        >
                          {book.filePath ? `📁 ${book.filePath}` : (book.fileName || book.title)}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Format Pill */}
                  <td style={{ padding: '8px 12px' }}>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-accent)',
                      }}
                    >
                      {book.format}
                    </span>
                  </td>

                  {/* Progress Bar & Percentage */}
                  <td style={{ padding: '8px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          flex: 1,
                          height: '4px',
                          backgroundColor: 'var(--color-surface-active)',
                          borderRadius: 'var(--radius-full)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${percent}%`,
                            height: '100%',
                            backgroundColor: percent > 0 ? 'var(--color-accent)' : 'transparent',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 600, width: '32px', textAlign: 'right', color: 'var(--color-text-secondary)' }}>
                        {percent}%
                      </span>
                    </div>
                  </td>

                  {/* Size */}
                  <td style={{ padding: '8px 12px', color: 'var(--color-text-muted)', fontSize: '11px' }}>
                    {formatFileSize(book.fileSizeBytes)}
                  </td>

                  {/* Added Date */}
                  <td style={{ padding: '8px 12px', color: 'var(--color-text-muted)', fontSize: '11px' }}>
                    {formatDate(book.importedAt)}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '8px 16px', textAlign: 'right' }}>
                    <div
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onOpenBook(book)}
                        title="Read"
                        style={{
                          height: '24px',
                          padding: '0 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: 'var(--color-accent)',
                          color: 'var(--color-accent-text)',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          cursor: 'pointer',
                        }}
                      >
                        <BookOpen size={11} />
                        <span>Read</span>
                      </button>

                      <button
                        onClick={() => onShowInfo(book)}
                        title="Details"
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Info size={11} />
                      </button>

                      <button
                        onClick={() => onDeleteBook(book)}
                        title="Delete"
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
