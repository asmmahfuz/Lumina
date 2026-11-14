/**
 * Lumina Reader - Clear History Confirmation Modal
 * Confirms complete deletion of reading history, offline books, and progress
 */

import React, { useEffect } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

export interface ClearHistoryModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  bookCount: number;
}

export const ClearHistoryModal: React.FC<ClearHistoryModalProps> = ({
  isOpen,
  onCancel,
  onConfirm,
  bookCount,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 'var(--z-modal)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onCancel}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '420px',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--color-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: 'var(--color-danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
              Clear Entire Reading History?
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'block', marginTop: '2px' }}>
              This will remove all {bookCount} book{bookCount === 1 ? '' : 's'} and reading records.
            </span>
          </div>
        </div>

        <div
          style={{
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            fontSize: '12px',
            lineHeight: 1.5,
            color: 'var(--color-text-secondary)',
          }}
        >
          All offline files, reading progress, bookmarks, and annotations will be permanently deleted from local storage. Your reader display preferences and settings will remain preserved.
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
          <button
            onClick={onCancel}
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
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              height: '30px',
              padding: '0 14px',
              fontSize: '11px',
              fontWeight: 600,
              backgroundColor: 'var(--color-danger)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Trash2 size={12} />
            <span>Clear History</span>
          </button>
        </div>
      </div>
    </div>
  );
};
