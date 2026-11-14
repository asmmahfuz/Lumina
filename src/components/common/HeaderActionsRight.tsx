/**
 * Lumina Reader - Header Right Action Controls
 * Quick actions for reading mode and consolidated application menu
 */

import React from 'react';
import { FolderOpen, Search, Bookmark, Maximize2, Minimize2 } from 'lucide-react';
import { ReadingStats } from '@/types/stats';
import { useReaderContext } from '@/app/Providers';
import { ConsolidatedHeaderMenu } from './ConsolidatedHeaderMenu';

interface HeaderActionsRightProps {
  onOpenFileClick: () => void;
  onSaveFile?: () => void;
  onSaveAsFile?: () => void;
  onOpenTypography: () => void;
  onOpenStats?: () => void;
  activeBookTitle?: string;
  isReading: boolean;
  stats?: ReadingStats;
  onOpenSearch?: () => void;
  onQuickBookmark?: () => void;
  isBookmarked?: boolean;
}

export const HeaderActionsRight: React.FC<HeaderActionsRightProps> = ({
  onOpenFileClick,
  onSaveFile,
  onSaveAsFile,
  onOpenTypography,
  onOpenStats,
  activeBookTitle,
  isReading,
  stats,
  onOpenSearch,
  onQuickBookmark,
  isBookmarked,
}) => {
  const { isFullscreen, toggleFullscreen } = useReaderContext();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <button
        onClick={onOpenFileClick}
        title="Open File (Ctrl+O)"
        aria-label="Open File"
        style={{
          height: '26px',
          width: '26px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 120ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
          e.currentTarget.style.borderColor = 'var(--color-accent)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--color-surface)';
          e.currentTarget.style.borderColor = 'var(--color-border)';
        }}
      >
        <FolderOpen size={13} style={{ color: 'var(--color-accent)' }} />
      </button>

      {isReading && onOpenSearch && (
        <button
          onClick={onOpenSearch}
          title="Search in Book (Ctrl+F)"
          aria-label="Search Book"
          style={{
            height: '26px',
            width: '26px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 120ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-surface)';
          }}
        >
          <Search size={13} />
        </button>
      )}

      {isReading && onQuickBookmark && (
        <button
          onClick={onQuickBookmark}
          title={isBookmarked ? 'Remove Bookmark (Ctrl+B)' : 'Bookmark Page (Ctrl+B)'}
          aria-label="Toggle Bookmark"
          style={{
            height: '26px',
            width: '26px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            backgroundColor: isBookmarked ? 'var(--color-accent-subtle)' : 'var(--color-surface)',
            color: isBookmarked ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 120ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isBookmarked ? 'var(--color-accent-subtle)' : 'var(--color-surface-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isBookmarked ? 'var(--color-accent-subtle)' : 'var(--color-surface)';
          }}
        >
          <Bookmark size={13} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>
      )}

      <button
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Exit Full Screen (Esc / F11)' : 'Full Screen (F11)'}
        aria-label={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
        style={{
          height: '26px',
          width: '26px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          backgroundColor: isFullscreen ? 'var(--color-accent-subtle)' : 'var(--color-surface)',
          color: isFullscreen ? 'var(--color-accent)' : 'var(--color-text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 120ms ease',
        }}
      >
        {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
      </button>

      <ConsolidatedHeaderMenu
        onOpenFileClick={onOpenFileClick}
        onSaveFile={onSaveFile}
        onSaveAsFile={onSaveAsFile}
        onOpenTypography={onOpenTypography}
        onOpenStats={onOpenStats}
        activeBookTitle={activeBookTitle}
        isReading={isReading}
        stats={stats}
      />
    </div>
  );
};
