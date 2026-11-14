/**
 * Lumina Reader - Library Book Card
 * Compact card with full-bleed cover artwork and blurred translucent overlay for metadata & actions
 */

import React from 'react';
import { BookMetadata } from '@/types/book';
import { BookOpen, Info, Trash2, BookText, Image, FileText } from 'lucide-react';
import { getFormatBadgeColor } from './bookCardFormatBadge';

interface LibraryBookCardProps {
  book: BookMetadata;
  onOpenBook: (book: BookMetadata) => void;
  onShowInfo: (book: BookMetadata) => void;
  onDeleteBook: (book: BookMetadata) => void;
}

const actionBtnStyle: React.CSSProperties = {
  width: '20px',
  height: '20px',
  borderRadius: 'var(--radius-xs)',
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-secondary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

export const LibraryBookCard: React.FC<LibraryBookCardProps> = ({
  book,
  onOpenBook,
  onShowInfo,
  onDeleteBook,
}) => {
  const percent = book.progress?.percent || 0;
  const badge = getFormatBadgeColor(book.format);

  return (
    <div
      onClick={() => onOpenBook(book)}
      className="glass-panel"
      style={{
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        aspectRatio: '2 / 3',
        width: '100%',
        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = 'var(--color-accent)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* 1. Full-Bleed Cover Artwork */}
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'var(--color-surface-active)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {book.coverBlobUrl ? (
          <img
            src={book.coverBlobUrl}
            alt={book.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 200ms ease' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-active) 100%)',
              textAlign: 'center',
            }}
          >
            {book.format === 'cbz' || book.format === 'cbr' ? (
              <Image size={28} style={{ color: 'var(--color-accent)', opacity: 0.8 }} />
            ) : book.format === 'md' || book.format === 'txt' ? (
              <FileText size={28} style={{ color: 'var(--color-accent)', opacity: 0.8 }} />
            ) : (
              <BookText size={28} style={{ color: 'var(--color-accent)', opacity: 0.8 }} />
            )}
            <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {book.format} document
            </span>
          </div>
        )}

        {/* Ambient Dark Gradient Scrim across bottom section for legibility */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '65%',
            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.35) 60%, rgba(0, 0, 0, 0) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Format Badge Pill */}
        <span
          style={{
            position: 'absolute',
            top: '6px',
            right: '6px',
            fontSize: '8.5px',
            fontWeight: 700,
            textTransform: 'uppercase',
            backgroundColor: badge.bg,
            color: badge.text,
            border: `1px solid ${badge.border}`,
            padding: '2px 5px',
            borderRadius: 'var(--radius-xs)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 2,
          }}
        >
          {book.format}
        </span>
      </div>

      {/* 2. Overlaid Metadata & Actions across bottom section with blurred translucent background */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'var(--color-surface-glass)',
          backdropFilter: 'blur(12px) saturate(140%)',
          WebkitBackdropFilter: 'blur(12px) saturate(140%)',
          borderTop: '1px solid var(--color-border)',
          padding: '6px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          zIndex: 3,
        }}
      >
        <h4
          style={{
            fontSize: '11px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: 'var(--color-text-primary)',
            margin: 0,
            lineHeight: 1.25,
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
          }}
          title={book.title}
        >
          {book.title}
        </h4>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
          <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
            {book.creator || 'Unknown Author'}
          </span>
          {percent > 0 && (
            <span style={{ fontSize: '9.5px', fontWeight: 600, color: 'var(--color-accent)', flexShrink: 0 }}>
              {percent}%
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ height: '3px', backgroundColor: 'var(--color-surface-hover)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginTop: '1px' }}>
          <div
            style={{
              width: `${percent}%`,
              height: '100%',
              backgroundColor: percent > 0 ? 'var(--color-accent)' : 'transparent',
              transition: 'width 250ms ease',
            }}
          />
        </div>

        {/* Actions Button Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onOpenBook(book); }}
            title="Read Book"
            style={{
              flex: 1,
              height: '20px',
              fontSize: '10.5px',
              fontWeight: 600,
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-accent-text)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              cursor: 'pointer',
            }}
          >
            <BookOpen size={10} />
            <span>Read</span>
          </button>

          <button onClick={(e) => { e.stopPropagation(); onShowInfo(book); }} title="View Book Details" style={actionBtnStyle}>
            <Info size={10} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onDeleteBook(book); }}
            title="Delete Book"
            style={{ ...actionBtnStyle, color: 'var(--color-text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-danger)'; e.currentTarget.style.borderColor = 'var(--color-danger)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>
    </div>
  );
};
