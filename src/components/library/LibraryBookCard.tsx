/**
 * Lumina Reader - Library Book Card
 * Interactive card with cover artwork, format badge, reading progress, and quick actions
 */

import React from 'react';
import { BookMetadata, BookFormat } from '@/types/book';
import { BookOpen, Info, Trash2, BookText, Image, FileText } from 'lucide-react';

interface LibraryBookCardProps {
  book: BookMetadata;
  onOpenBook: (book: BookMetadata) => void;
  onShowInfo: (book: BookMetadata) => void;
  onDeleteBook: (book: BookMetadata) => void;
}

export const LibraryBookCard: React.FC<LibraryBookCardProps> = ({
  book,
  onOpenBook,
  onShowInfo,
  onDeleteBook,
}) => {
  const percent = book.progress?.percent || 0;

  const getFormatBadgeColor = (format: BookFormat) => {
    switch (format) {
      case 'epub':
        return { bg: 'var(--color-accent-subtle)', text: 'var(--color-accent)', border: 'var(--color-accent)' };
      case 'cbz':
      case 'cbr':
      case 'cbt':
      case 'cb7':
        return { bg: 'rgba(236, 72, 153, 0.15)', text: '#ec4899', border: '#ec4899' };
      case 'pdf':
        return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: '#38bdf8' };
      case 'djvu':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: '#10b981' };
      case 'mobi':
      case 'azw3':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: '#f59e0b' };
      case 'fb2':
        return { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7', border: '#a855f7' };
      case 'md':
        return { bg: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4', border: '#06b6d4' };
      case 'txt':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: '#3b82f6' };
      default:
        return { bg: 'var(--color-surface-hover)', text: 'var(--color-text-secondary)', border: 'var(--color-border)' };
    }
  };

  const badgeStyle = getFormatBadgeColor(book.format);

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 KB';
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div
      onClick={() => onOpenBook(book)}
      className="glass-panel"
      style={{
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = 'var(--color-accent)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.borderColor = 'var(--color-border)';
      }}
    >
      {/* 1. Cover Artwork Container (2:3 aspect ratio) */}
      <div
        style={{
          width: '100%',
          aspectRatio: '2 / 3',
          backgroundColor: 'var(--color-surface-active)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {book.coverBlobUrl ? (
          <img
            src={book.coverBlobUrl}
            alt={book.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transition: 'transform 200ms ease',
            }}
          />
        ) : (
          /* Stylized Editorial Fallback Cover */
          <div
            style={{
              width: '100%',
              height: '100%',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-active) 100%)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              {book.format === 'cbz' || book.format === 'cbr' ? (
                <Image size={24} style={{ color: 'var(--color-accent)', opacity: 0.8 }} />
              ) : book.format === 'md' || book.format === 'txt' ? (
                <FileText size={24} style={{ color: 'var(--color-accent)', opacity: 0.8 }} />
              ) : (
                <BookText size={24} style={{ color: 'var(--color-accent)', opacity: 0.8 }} />
              )}
            </div>

            <div>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  lineHeight: '1.3',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {book.title}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--color-text-secondary)',
                  marginTop: '4px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {book.creator || 'Unknown Author'}
              </div>
            </div>

            <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>
              {formatFileSize(book.fileSizeBytes)}
            </span>
          </div>
        )}

        {/* Format Badge Pill */}
        <span
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            fontSize: '9px',
            fontWeight: 700,
            textTransform: 'uppercase',
            backgroundColor: badgeStyle.bg,
            color: badgeStyle.text,
            border: `1px solid ${badgeStyle.border}`,
            padding: '2px 6px',
            borderRadius: 'var(--radius-xs)',
            backdropFilter: 'blur(6px)',
          }}
        >
          {book.format}
        </span>
      </div>

      {/* 2. Metadata & Actions */}
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, justifyContent: 'space-between' }}>
        <div>
          <h4
            style={{
              fontSize: '12px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: 'var(--color-text-primary)',
            }}
            title={book.title}
          >
            {book.title}
          </h4>

          <span
            style={{
              fontSize: '11px',
              color: 'var(--color-text-secondary)',
              display: 'block',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {book.creator || 'Unknown Author'}
          </span>
        </div>

        {/* Progress bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-muted)' }}>
            <span>Progress</span>
            <span style={{ fontWeight: 600 }}>{percent}%</span>
          </div>
          <div
            style={{
              height: '4px',
              backgroundColor: 'var(--color-surface-hover)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
              marginTop: '2px',
            }}
          >
            <div
              style={{
                width: `${percent}%`,
                height: '100%',
                backgroundColor: percent > 0 ? 'var(--color-accent)' : 'transparent',
                transition: 'width 250ms ease',
              }}
            />
          </div>
        </div>

        {/* Actions Button Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenBook(book);
            }}
            title="Read Book"
            style={{
              flex: 1,
              height: '24px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-accent-text)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            <BookOpen size={11} />
            <span>Read</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowInfo(book);
            }}
            title="View Book Details"
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
            onClick={(e) => {
              e.stopPropagation();
              onDeleteBook(book);
            }}
            title="Delete Book"
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
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-danger)';
              e.currentTarget.style.borderColor = 'var(--color-danger)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-muted)';
              e.currentTarget.style.borderColor = 'var(--color-border)';
            }}
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  );
};
