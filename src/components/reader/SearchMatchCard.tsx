/**
 * Lumina Reader - Search Match Card Component
 * Renders chapter section headers and match cards with highlighted snippets
 */

import React from 'react';
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { ChapterSearchResult, SearchMatch } from '@/types/search';

interface SearchMatchCardProps {
  chapter: ChapterSearchResult;
  isCollapsed: boolean;
  isCurrentChapter: boolean;
  activeMatchId?: string;
  onToggleCollapse: () => void;
  onSelectMatch: (match: SearchMatch) => void;
}

export const SearchMatchCard: React.FC<SearchMatchCardProps> = ({
  chapter,
  isCollapsed,
  isCurrentChapter,
  activeMatchId,
  onToggleCollapse,
  onSelectMatch,
}) => {
  return (
    <div
      style={{
        borderRadius: 'var(--radius-xs)',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        overflow: 'hidden',
      }}
    >
      {/* Chapter Section Header */}
      <button
        onClick={onToggleCollapse}
        style={{
          width: '100%',
          padding: '6px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: isCurrentChapter ? 'var(--color-accent-subtle)' : 'var(--color-surface-hover)',
          border: 'none',
          borderBottom: isCollapsed ? 'none' : '1px solid var(--color-border)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {isCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
        <BookOpen
          size={11}
          style={{ color: isCurrentChapter ? 'var(--color-accent)' : 'var(--color-text-muted)', flexShrink: 0 }}
        />
        <span
          style={{
            flex: 1,
            fontSize: '11px',
            fontWeight: 600,
            color: isCurrentChapter ? 'var(--color-accent)' : 'var(--color-text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {chapter.chapterTitle}
        </span>
        <span
          style={{
            fontSize: '9px',
            fontWeight: 700,
            padding: '1px 5px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-bg)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {chapter.matches.length}
        </span>
      </button>

      {/* Chapter Matches Cards */}
      {!isCollapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '4px', gap: '4px' }}>
          {chapter.matches.map((match) => {
            const isActive = match.id === activeMatchId;

            return (
              <div
                key={match.id}
                onClick={() => onSelectMatch(match)}
                style={{
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--color-accent)' : 'transparent',
                  backgroundColor: isActive ? 'var(--color-accent-subtle)' : 'var(--color-bg)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  lineHeight: 1.4,
                  position: 'relative',
                  transition: 'all 120ms ease',
                }}
              >
                <span style={{ color: 'var(--color-text-muted)' }}>{match.snippetBefore}</span>
                <mark
                  style={{
                    backgroundColor: isActive ? 'var(--color-accent)' : 'rgba(250, 204, 21, 0.40)',
                    color: isActive ? 'var(--color-accent-text)' : 'inherit',
                    borderRadius: '2px',
                    padding: '0 2px',
                    fontWeight: 600,
                  }}
                >
                  {match.matchText}
                </mark>
                <span style={{ color: 'var(--color-text-muted)' }}>{match.snippetAfter}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
