/**
 * Lumina Reader - Text Selection Floating Popup
 * Provides quick 5-color highlighting, note attachment, and copy actions above text selections.
 */

import React, { useState } from 'react';
import { HighlightColor } from '@/types/book';
import { StickyNote, Copy, Check, X } from 'lucide-react';

export const HIGHLIGHT_COLORS: { id: HighlightColor; label: string; bg: string; border: string }[] = [
  { id: 'yellow', label: 'Yellow', bg: '#FACC15', border: '#EAB308' },
  { id: 'green', label: 'Green', bg: '#4ADE80', border: '#22C55E' },
  { id: 'blue', label: 'Blue', bg: '#60A5FA', border: '#3B82F6' },
  { id: 'pink', label: 'Pink', bg: '#F472B6', border: '#EC4899' },
  { id: 'orange', label: 'Orange', bg: '#FB923C', border: '#F97316' },
];

interface TextSelectionPopupProps {
  position: { top: number; left: number };
  selectedText: string;
  onHighlight: (color: HighlightColor) => void;
  onAddNote: (color: HighlightColor) => void;
  onClose: () => void;
}

export const TextSelectionPopup: React.FC<TextSelectionPopupProps> = ({
  position,
  selectedText,
  onHighlight,
  onAddNote,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.warn('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div
      className="glass-panel animate-fade-in"
      style={{
        position: 'absolute',
        top: `${Math.max(12, position.top)}px`,
        left: `${Math.max(12, position.left)}px`,
        transform: 'translate(-50%, -100%) translateY(-10px)',
        zIndex: 'var(--z-popover)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 8px',
        borderRadius: 'var(--radius-full)',
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-lg)',
        backdropFilter: 'blur(12px)',
        userSelect: 'none',
      }}
    >
      {/* 5 Circadian Highlight Color Dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        {HIGHLIGHT_COLORS.map((c) => (
          <button
            key={c.id}
            onClick={() => onHighlight(c.id)}
            title={`Highlight ${c.label}`}
            aria-label={`Highlight ${c.label}`}
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: c.bg,
              border: `1.5px solid ${c.border}`,
              cursor: 'pointer',
              padding: 0,
              transition: 'transform 120ms ease, box-shadow 120ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.25)';
              e.currentTarget.style.boxShadow = `0 0 6px ${c.bg}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        ))}
      </div>

      <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--color-border)', margin: '0 2px' }} />

      {/* Note Action Button */}
      <button
        onClick={() => onAddNote('yellow')}
        title="Add sticky note"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          height: '22px',
          padding: '0 6px',
          borderRadius: 'var(--radius-xs)',
          border: 'none',
          background: 'none',
          color: 'var(--color-text-secondary)',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 500,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
          e.currentTarget.style.color = 'var(--color-accent)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--color-text-secondary)';
        }}
      >
        <StickyNote size={12} />
        <span>Note</span>
      </button>

      {/* Copy Action Button */}
      <button
        onClick={handleCopy}
        title="Copy text"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          height: '22px',
          padding: '0 6px',
          borderRadius: 'var(--radius-xs)',
          border: 'none',
          background: 'none',
          color: copied ? 'var(--color-success)' : 'var(--color-text-secondary)',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 500,
        }}
        onMouseEnter={(e) => {
          if (!copied) {
            e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
            e.currentTarget.style.color = 'var(--color-text-primary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!copied) {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }
        }}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        <span>{copied ? 'Copied' : 'Copy'}</span>
      </button>

      {/* Dismiss Button */}
      <button
        onClick={onClose}
        title="Dismiss"
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          background: 'none',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          padding: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
      >
        <X size={12} />
      </button>
    </div>
  );
};
