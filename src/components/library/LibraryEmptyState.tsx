/**
 * Lumina Reader - Library Empty State
 * Completely blank, minimalist zen canvas.
 * Full viewport accepts drag-and-drop ingestion.
 */

import React from 'react';
import { SearchX } from 'lucide-react';

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

  return (
    <div
      onClick={onOpenFile}
      style={{
        flex: 1,
        width: '100%',
        minHeight: '80vh',
        cursor: 'default',
        userSelect: 'none',
      }}
    />
  );
};
