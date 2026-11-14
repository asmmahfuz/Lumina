/**
 * Lumina Reader - Library Controls Toolbar
 * Handles format category filters, sorting criteria, and Grid/List view mode toggle
 */

import React from 'react';
import { LayoutGrid, List, FolderOpen, ArrowUpDown, Flame, Trash2 } from 'lucide-react';

export type LibraryCategoryFilter = 'all' | 'epub' | 'comic' | 'pdf' | 'text';
export type LibrarySortOption = 'recent' | 'title-asc' | 'title-desc' | 'progress' | 'size';

interface LibraryToolbarProps {
  activeFilter: LibraryCategoryFilter;
  onFilterChange: (filter: LibraryCategoryFilter) => void;
  sortBy: LibrarySortOption;
  onSortChange: (sort: LibrarySortOption) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  totalCount: number;
  filteredCount: number;
  onOpenFile: () => void;
  onOpenStats?: () => void;
  onClearHistory?: () => void;
}

export const LibraryToolbar: React.FC<LibraryToolbarProps> = ({
  activeFilter,
  onFilterChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  totalCount,
  filteredCount,
  onOpenFile,
  onOpenStats,
  onClearHistory,
}) => {
  const filterTabs: { id: LibraryCategoryFilter; label: string }[] = [
    { id: 'all', label: 'All Formats' },
    { id: 'epub', label: 'EPUB' },
    { id: 'comic', label: 'Comics' },
    { id: 'pdf', label: 'PDF' },
    { id: 'text', label: 'Notes & Text' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* 1. Category Filter Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              style={{
                height: '26px',
                padding: '0 10px',
                fontSize: '11px',
                fontWeight: isActive ? 600 : 500,
                borderRadius: 'var(--radius-full)',
                border: '1px solid',
                borderColor: isActive ? 'var(--color-accent)' : 'var(--color-border)',
                backgroundColor: isActive ? 'var(--color-accent-subtle)' : 'var(--color-surface)',
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 2. Right Controls: Sort, View Switcher, Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Sort selector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0 6px',
            height: '26px',
          }}
        >
          <ArrowUpDown size={11} style={{ color: 'var(--color-text-muted)' }} />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as LibrarySortOption)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '11px',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="recent">Recently Added</option>
            <option value="title-asc">Title (A to Z)</option>
            <option value="title-desc">Title (Z to A)</option>
            <option value="progress">Reading Progress</option>
            <option value="size">File Size</option>
          </select>
        </div>

        {/* View mode toggle (Grid vs List) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px',
          }}
        >
          <button
            onClick={() => onViewModeChange('grid')}
            title="Grid View"
            style={{
              height: '22px',
              width: '24px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              backgroundColor: viewMode === 'grid' ? 'var(--color-accent-subtle)' : 'transparent',
              color: viewMode === 'grid' ? 'var(--color-accent)' : 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <LayoutGrid size={13} />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            title="List View"
            style={{
              height: '22px',
              width: '24px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              backgroundColor: viewMode === 'list' ? 'var(--color-accent-subtle)' : 'transparent',
              color: viewMode === 'list' ? 'var(--color-accent)' : 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <List size={13} />
          </button>
        </div>

        {/* Open Book button */}
        <button
          onClick={onOpenFile}
          title="Open Any Document (EPUB, PDF, CBZ, MD...)"
          style={{
            height: '26px',
            padding: '0 8px',
            fontSize: '11px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
          }}
        >
          <FolderOpen size={11} style={{ color: 'var(--color-accent)' }} />
          <span>Open</span>
        </button>

        {/* Insights & Reading Stats button */}
        {onOpenStats && (
          <button
            onClick={onOpenStats}
            title="Reading Insights & Pace Stats"
            style={{
              height: '26px',
              padding: '0 8px',
              fontSize: '11px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            <Flame size={12} style={{ color: '#f97316' }} />
            <span>Insights</span>
          </button>
        )}

        {/* Clear History button */}
        {onClearHistory && totalCount > 0 && (
          <button
            onClick={onClearHistory}
            title="Clear all reading history"
            style={{
              height: '26px',
              padding: '0 8px',
              fontSize: '11px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-danger)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            <Trash2 size={11} style={{ color: 'var(--color-danger)' }} />
            <span>Clear History</span>
          </button>
        )}

        {/* Total count badge */}
        <span
          style={{
            fontSize: '11px',
            color: 'var(--color-text-muted)',
            marginLeft: '4px',
          }}
        >
          {filteredCount === totalCount ? `${totalCount} books` : `${filteredCount} of ${totalCount}`}
        </span>
      </div>
    </div>
  );
};
