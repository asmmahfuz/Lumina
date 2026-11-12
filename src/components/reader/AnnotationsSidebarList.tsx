/**
 * Lumina Reader - Annotations Sidebar List (Task 7.3)
 * Provides a browsable dock for highlights and sticky notes with live search,
 * color filtering, chapter jumping, and quick note editing.
 */

import React, { useState, useMemo } from 'react';
import { Annotation, HighlightColor } from '@/types/book';
import { HIGHLIGHT_COLORS } from './TextSelectionPopup';
import { Search, StickyNote, Highlighter } from 'lucide-react';
import { AnnotationItemCard } from './AnnotationItemCard';

interface AnnotationsSidebarListProps {
  annotations: Annotation[];
  currentSpineIndex: number;
  onSelectAnnotation: (annotation: Annotation) => void;
  onEditAnnotation: (annotation: Annotation) => void;
  onDeleteAnnotation: (annotationId: string) => void;
  getChapterTitle?: (spineIndex: number) => string;
}

export const AnnotationsSidebarList: React.FC<AnnotationsSidebarListProps> = ({
  annotations,
  currentSpineIndex,
  onSelectAnnotation,
  onEditAnnotation,
  onDeleteAnnotation,
  getChapterTitle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<HighlightColor | 'all'>('all');
  const [notesOnly, setNotesOnly] = useState(false);

  const filteredAnnotations = useMemo(() => {
    return annotations.filter((ann) => {
      if (selectedColor !== 'all' && ann.color !== selectedColor) return false;
      if (notesOnly && (!ann.note || !ann.note.trim())) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const textMatch = ann.text.toLowerCase().includes(query);
        const noteMatch = ann.note?.toLowerCase().includes(query) ?? false;
        return textMatch || noteMatch;
      }
      return true;
    });
  }, [annotations, selectedColor, notesOnly, searchQuery]);

  const formatTime = (ts: number): string => {
    const diffSec = Math.floor((Date.now() - ts) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Search & Filter Bar */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0 8px',
            height: '26px',
            backgroundColor: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xs)',
          }}
        >
          <Search size={11} style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder={`Search ${annotations.length} highlights & notes...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              fontSize: '11px',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        {/* Color & Note Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <button
              onClick={() => setSelectedColor('all')}
              style={{
                fontSize: '9px',
                fontWeight: selectedColor === 'all' ? 700 : 500,
                padding: '2px 5px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid',
                borderColor: selectedColor === 'all' ? 'var(--color-accent)' : 'var(--color-border)',
                backgroundColor: selectedColor === 'all' ? 'var(--color-accent-subtle)' : 'transparent',
                color: selectedColor === 'all' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                cursor: 'pointer',
              }}
            >
              All
            </button>
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedColor(selectedColor === c.id ? 'all' : c.id)}
                title={`Filter ${c.label}`}
                style={{
                  width: '13px',
                  height: '13px',
                  borderRadius: '50%',
                  backgroundColor: c.bg,
                  border: selectedColor === c.id ? '2px solid var(--color-text-primary)' : `1px solid ${c.border}`,
                  cursor: 'pointer',
                  padding: 0,
                  transform: selectedColor === c.id ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            ))}
          </div>

          {/* Notes Only Toggle */}
          <button
            onClick={() => setNotesOnly((prev) => !prev)}
            title="Show only highlights with sticky notes"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '9px',
              padding: '2px 5px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid',
              borderColor: notesOnly ? 'var(--color-accent)' : 'var(--color-border)',
              backgroundColor: notesOnly ? 'var(--color-accent-subtle)' : 'transparent',
              color: notesOnly ? 'var(--color-accent)' : 'var(--color-text-muted)',
              cursor: 'pointer',
              fontWeight: notesOnly ? 600 : 400,
            }}
          >
            <StickyNote size={9} />
            <span>Notes</span>
          </button>
        </div>
      </div>

      {/* Highlights & Notes List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
        {filteredAnnotations.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 16px',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              gap: '8px',
            }}
          >
            <Highlighter size={24} style={{ opacity: 0.5 }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              No Highlights Found
            </span>
            <span style={{ fontSize: '10px', lineHeight: 1.4 }}>
              Select any text in the book to highlight or attach personal notes.
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredAnnotations.map((ann) => (
              <AnnotationItemCard
                key={ann.id}
                annotation={ann}
                isCurrentChapter={ann.spineIndex === currentSpineIndex}
                chapterLabel={getChapterTitle ? getChapterTitle(ann.spineIndex) : `Chapter ${ann.spineIndex + 1}`}
                timeAgo={formatTime(ann.createdAt)}
                onSelect={onSelectAnnotation}
                onEdit={onEditAnnotation}
                onDelete={onDeleteAnnotation}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
