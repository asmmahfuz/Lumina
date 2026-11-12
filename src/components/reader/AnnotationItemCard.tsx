/**
 * Lumina Reader - Annotation Item Card
 * Displays an individual highlight/note card in the annotations sidebar
 */

import React from 'react';
import { Annotation } from '@/types/book';
import { HIGHLIGHT_COLORS } from './TextSelectionPopup';
import { StickyNote, Trash2, Edit3, Navigation } from 'lucide-react';

interface AnnotationItemCardProps {
  annotation: Annotation;
  isCurrentChapter: boolean;
  chapterLabel: string;
  timeAgo: string;
  onSelect: (annotation: Annotation) => void;
  onEdit: (annotation: Annotation) => void;
  onDelete: (id: string) => void;
}

export const AnnotationItemCard: React.FC<AnnotationItemCardProps> = ({
  annotation,
  isCurrentChapter,
  chapterLabel,
  timeAgo,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const colorConfig = HIGHLIGHT_COLORS.find((c) => c.id === annotation.color) || HIGHLIGHT_COLORS[0];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
        padding: '8px 10px',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'var(--color-bg)',
        border: '1px solid',
        borderColor: isCurrentChapter ? 'var(--color-accent-subtle)' : 'var(--color-border)',
        borderLeft: `3px solid ${colorConfig.border}`,
        cursor: 'pointer',
        transition: 'all 120ms ease',
      }}
      onClick={() => onSelect(annotation)}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--color-bg)';
      }}
    >
      {/* Top line: Chapter & Timestamp */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: '9px',
            fontWeight: 700,
            color: 'var(--color-accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {chapterLabel}
        </span>
        <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>{timeAgo}</span>
      </div>

      {/* Quote snippet */}
      <div
        style={{
          fontSize: '11px',
          lineHeight: '1.4',
          color: 'var(--color-text-primary)',
          backgroundColor: colorConfig.bg,
          padding: '4px 6px',
          borderRadius: 'var(--radius-xs)',
          fontStyle: 'italic',
          borderLeft: `2px solid ${colorConfig.border}`,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
        }}
      >
        "{annotation.text}"
      </div>

      {/* Sticky Note Content */}
      {annotation.note && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '4px',
            padding: '4px 6px',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-xs)',
            border: '1px dashed var(--color-border)',
            fontSize: '10px',
            color: 'var(--color-text-secondary)',
          }}
        >
          <StickyNote size={11} style={{ flexShrink: 0, marginTop: '2px', color: '#f59e0b' }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {annotation.note}
          </span>
        </div>
      )}

      {/* Action Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(annotation);
          }}
          title="Jump to highlight in viewport"
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '9px',
            color: 'var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            cursor: 'pointer',
            padding: '2px 4px',
          }}
        >
          <Navigation size={9} />
          <span>Jump</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(annotation);
            }}
            title="Edit note or change color"
            style={{
              background: 'transparent',
              border: 'none',
              padding: '2px 4px',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              display: 'flex',
            }}
          >
            <Edit3 size={11} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(annotation.id);
            }}
            title="Delete highlight"
            style={{
              background: 'transparent',
              border: 'none',
              padding: '2px 4px',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              display: 'flex',
            }}
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  );
};
