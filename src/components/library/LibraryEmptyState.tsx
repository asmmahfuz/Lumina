/**
 * Lumina Reader - Library Landing & Empty State
 * Modern minimalist landing dropzone with format support cues and direct file ingestion
 */

import React from 'react';
import { SearchX, BookOpen, FolderOpen } from 'lucide-react';

interface LibraryEmptyStateProps {
  isSearchEmpty?: boolean;
  searchQuery?: string;
  onOpenFile?: () => void;
  isDragOver?: boolean;
}

export const LibraryEmptyState: React.FC<LibraryEmptyStateProps> = ({
  isSearchEmpty,
  searchQuery,
  onOpenFile,
  isDragOver,
}) => {
  if (isSearchEmpty) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          margin: '48px auto',
          maxWidth: '420px',
        }}
      >
        <SearchX size={28} style={{ color: 'var(--color-text-muted)' }} />
        <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          No books found
        </h4>
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          No documents match &ldquo;<strong>{searchQuery}</strong>&rdquo;.
        </p>
      </div>
    );
  }

  const formats = ['EPUB', 'PDF', 'DJVU', 'CBZ', 'CBR', 'MOBI', 'AZW3', 'FB2', 'MD', 'TXT'];

  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
      }}
    >
      <div
        className="glass-panel"
        onClick={onOpenFile}
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '40px 32px',
          borderRadius: 'var(--radius-lg)',
          border: isDragOver ? '2px dashed var(--color-accent)' : '1px dashed var(--color-border)',
          backgroundColor: isDragOver ? 'var(--color-accent-subtle)' : 'var(--color-surface)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 180ms ease',
          boxShadow: 'var(--shadow-md)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-accent)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = isDragOver ? 'var(--color-accent)' : 'var(--color-border)';
          e.currentTarget.style.transform = 'none';
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-surface-hover)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            color: 'var(--color-accent)',
          }}
        >
          <BookOpen size={28} />
        </div>

        <h3
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginBottom: '8px',
            letterSpacing: '-0.01em',
          }}
        >
          Welcome to Lumina Reader
        </h3>

        <p
          style={{
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.5,
            maxWidth: '380px',
            marginBottom: '20px',
          }}
        >
          Drag and drop any document here to begin reading, or click to browse files from your device.
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenFile?.();
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            height: '32px',
            padding: '0 16px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-accent-text)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 120ms ease',
            marginBottom: '24px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-accent)';
          }}
        >
          <FolderOpen size={14} />
          <span>Open Document</span>
        </button>

        {/* Supported Format Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
          {formats.map((fmt) => (
            <span
              key={fmt}
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: 'var(--radius-xs)',
                backgroundColor: 'var(--color-surface-hover)',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
                letterSpacing: '0.03em',
              }}
            >
              {fmt}
            </span>
          ))}
        </div>

        <span
          style={{
            marginTop: '16px',
            fontSize: '11px',
            color: 'var(--color-text-muted)',
          }}
        >
          100% Offline & Local-First • Fast & Lightweight
        </span>
      </div>
    </div>
  );
};
