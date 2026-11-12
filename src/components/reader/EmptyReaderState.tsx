/**
 * Lumina Reader - Empty Reader State View
 * Shown when reader is accessed without an active book loaded
 */

import React from 'react';
import { BookOpen, FolderOpen, ArrowLeft } from 'lucide-react';
import { getPlatformAdapter } from '@/services/platform';

interface EmptyReaderStateProps {
  onBackToLibrary: () => void;
  onOpenFile?: () => void;
  onLoadSampleBook?: () => void;
}

export const EmptyReaderState: React.FC<EmptyReaderStateProps> = ({
  onBackToLibrary,
  onOpenFile,
}) => {
  const handleOpen = async () => {
    if (onOpenFile) {
      onOpenFile();
    } else {
      try {
        const adapter = getPlatformAdapter();
        await adapter.openFileDialog();
      } catch (err) {
        console.warn('Open file error:', err);
      }
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '24px',
        textAlign: 'center',
      }}
    >
      <BookOpen size={48} style={{ color: 'var(--color-accent)', opacity: 0.6 }} />
      <h2 style={{ fontSize: '18px', fontWeight: 700 }}>No Document Currently Open</h2>
      <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', maxWidth: '400px' }}>
        Select a document from your library or open any supported file (EPUB, PDF, CBZ, MOBI, FB2, MD) from your computer.
      </p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={onBackToLibrary}
          style={{
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-accent-text)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={14} />
          <span>Return to Library</span>
        </button>
        <button
          onClick={handleOpen}
          style={{
            padding: '8px 16px',
            fontSize: '12px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
        >
          <FolderOpen size={14} />
          <span>Open File</span>
        </button>
      </div>
    </div>
  );
};
