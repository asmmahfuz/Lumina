/**
 * Lumina Reader - Book Information & Metadata Modal
 * Displays full Dublin Core metadata, file attributes, and reading statistics
 */

import React from 'react';
import { BookMetadata } from '@/types/book';
import { X, BookOpen, Trash2, User, HardDrive, FileText } from 'lucide-react';

interface BookInfoModalProps {
  book: BookMetadata | null;
  onClose: () => void;
  onOpenBook: (book: BookMetadata) => void;
  onDeleteBook: (book: BookMetadata) => void;
}

export const BookInfoModal: React.FC<BookInfoModalProps> = ({
  book,
  onClose,
  onOpenBook,
  onDeleteBook,
}) => {
  if (!book) return null;

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 KB';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 'var(--z-modal)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 120ms ease-out',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '85vh',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--color-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} style={{ color: 'var(--color-accent)' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Document Metadata
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top Info Banner */}
          <div style={{ display: 'flex', gap: '16px' }}>
            {book.coverBlobUrl ? (
              <div
                style={{
                  width: '90px',
                  height: '130px',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: '1px solid var(--color-border)',
                }}
              >
                <img src={book.coverBlobUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : null}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
                {book.title}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                <User size={13} style={{ color: 'var(--color-accent)' }} />
                <span>{book.creator || 'Unknown Author'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                <HardDrive size={13} />
                <span>{formatFileSize(book.fileSizeBytes)} ({book.format.toUpperCase()})</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Last read: {formatDate(book.lastReadAt)}
              </div>
            </div>
          </div>

          {/* Description */}
          {book.description && (
            <div style={{ backgroundColor: 'var(--color-surface)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
                Description / Synopsis
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.6, maxHeight: '120px', overflowY: 'auto' }}>
                {book.description}
              </p>
            </div>
          )}

          {/* Detailed Attributes Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              fontSize: '11px',
              backgroundColor: 'var(--color-surface)',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div>
              <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>File Name</span>
              <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', wordBreak: 'break-all' }}>{book.fileName || book.title}</span>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>File Path</span>
              <span style={{ fontWeight: 500, color: 'var(--color-text-secondary)', wordBreak: 'break-all' }}>{book.filePath || 'Stored in local database'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Publisher</span>
              <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{book.publisher || 'Not Specified'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Language</span>
              <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{book.language || 'English (en)'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Publication Date</span>
              <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{book.pubdate || 'Unknown'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Reading Progress</span>
              <span style={{ fontWeight: 500, color: 'var(--color-accent)' }}>
                {book.progress?.percent || 0}% ({book.progress?.currentSpineIndex !== undefined ? `Chapter ${book.progress.currentSpineIndex + 1}` : 'Not Started'})
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            onClick={() => {
              onClose();
              onDeleteBook(book);
            }}
            style={{
              height: '30px',
              padding: '0 10px',
              fontSize: '11px',
              color: 'var(--color-danger)',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            <Trash2 size={12} />
            <span>Delete Book</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                height: '30px',
                padding: '0 12px',
                fontSize: '11px',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenBook(book);
              }}
              style={{
                height: '30px',
                padding: '0 14px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-accent-text)',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <BookOpen size={12} />
              <span>Read Document</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
