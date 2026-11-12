/**
 * Lumina Reader - Drag & Drop Importer Overlay
 * Full-surface dropzone for importing multi-format book files into local storage
 */

import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud } from 'lucide-react';
import { SUPPORTED_BOOK_EXTENSIONS } from '@/types/platform';

interface LibraryDropzoneProps {
  onFilesDropped: (files: File[]) => void;
  children: React.ReactNode;
}

export const LibraryDropzone: React.FC<LibraryDropzoneProps> = ({ onFilesDropped, children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current += 1;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current -= 1;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounterRef.current = 0;

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const droppedFiles = Array.from(e.dataTransfer.files);
        onFilesDropped(droppedFiles);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [onFilesDropped]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {children}

      {isDragging && (
        <div
          style={{
            position: 'absolute',
            inset: '12px',
            backgroundColor: 'var(--color-bg)',
            border: '2px dashed var(--color-accent)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            zIndex: 100,
            backdropFilter: 'blur(8px)',
            boxShadow: '0 0 32px var(--color-accent-subtle)',
            animation: 'fadeIn 150ms ease-out',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-accent-subtle)',
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UploadCloud size={32} />
          </div>

          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Drop Books to Add to Library
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Files are processed 100% locally and stored in your offline library
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxWidth: '420px', justifyContent: 'center' }}>
            {SUPPORTED_BOOK_EXTENSIONS.map((ext) => (
              <span
                key={ext}
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--color-surface-hover)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-accent)',
                }}
              >
                .{ext}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
