/**
 * Lumina Reader - Sticky Note & Annotation Editor Modal
 * Allows adding and editing personal notes attached to text highlights,
 * changing highlight colors, and deleting annotations.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Annotation, HighlightColor } from '@/types/book';
import { HIGHLIGHT_COLORS } from './TextSelectionPopup';
import { StickyNote, Trash2, Check, X } from 'lucide-react';

interface AnnotationEditorModalProps {
  annotation: Annotation | null;
  isOpen: boolean;
  onSave: (updated: Annotation) => void;
  onDelete: (annotationId: string) => void;
  onClose: () => void;
}

export const AnnotationEditorModal: React.FC<AnnotationEditorModalProps> = ({
  annotation,
  isOpen,
  onSave,
  onDelete,
  onClose,
}) => {
  const [noteText, setNoteText] = useState('');
  const [color, setColor] = useState<HighlightColor>('yellow');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (annotation) {
      setNoteText(annotation.note || '');
      setColor(annotation.color || 'yellow');
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [annotation]);

  if (!isOpen || !annotation) return null;

  const currentColorConfig = HIGHLIGHT_COLORS.find((c) => c.id === color) || HIGHLIGHT_COLORS[0];

  const handleSave = () => {
    onSave({
      ...annotation,
      color,
      note: noteText.trim() || undefined,
      updatedAt: Date.now(),
    });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 'var(--z-modal)',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel animate-scale-up"
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StickyNote size={15} style={{ color: currentColorConfig.border }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {annotation.note ? 'Edit Sticky Note' : 'Add Sticky Note'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* 5 Color Swatches */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '6px' }}>
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setColor(c.id)}
                  title={`Switch to ${c.label}`}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: c.bg,
                    border: color === c.id ? '2px solid var(--color-text-primary)' : `1px solid ${c.border}`,
                    cursor: 'pointer',
                    padding: 0,
                    transform: color === c.id ? 'scale(1.2)' : 'scale(1)',
                    transition: 'all 120ms ease',
                  }}
                />
              ))}
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Highlighted Quote Snippet */}
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-bg)',
              borderLeft: `3px solid ${currentColorConfig.border}`,
              fontSize: '12px',
              fontStyle: 'italic',
              color: 'var(--color-text-secondary)',
              maxHeight: '90px',
              overflowY: 'auto',
              lineHeight: 1.45,
            }}
          >
            "{annotation.text}"
          </div>

          {/* Sticky Note Textarea */}
          <textarea
            ref={textareaRef}
            placeholder="Write your note or thoughts here... (Ctrl+Enter to save)"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg)',
              color: 'var(--color-text-primary)',
              fontSize: '12px',
              lineHeight: 1.5,
              resize: 'vertical',
              fontFamily: 'inherit',
              outline: 'none',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--color-accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg)',
          }}
        >
          <button
            onClick={() => {
              onDelete(annotation.id);
              onClose();
            }}
            title="Delete highlight & note"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              background: 'none',
              color: 'var(--color-error)',
              fontSize: '11px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Trash2 size={12} />
            <span>Delete</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Ctrl+Enter</span>
            <button
              onClick={handleSave}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-accent-text)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Check size={12} />
              <span>Save Note</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
