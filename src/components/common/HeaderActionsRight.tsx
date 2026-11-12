/**
 * Lumina Reader - Header Right Action Controls
 * Quick actions for file open, theme cycling, typography, reading insights, and bookmarks
 */

import React from 'react';
import {
  FolderOpen,
  Sliders,
  Search,
  Bookmark,
  Moon,
  Sparkles,
  Coffee,
  FileText,
  Sun,
  Flame,
} from 'lucide-react';
import { ReadingTheme } from '@/types/book';

interface HeaderActionsRightProps {
  theme: ReadingTheme;
  onCycleTheme: () => void;
  onOpenFileClick: () => void;
  onOpenTypography: () => void;
  onOpenStats?: () => void;
  isReading: boolean;
  onOpenSearch?: () => void;
  onQuickBookmark?: () => void;
  isBookmarked?: boolean;
}

export const HeaderActionsRight: React.FC<HeaderActionsRightProps> = ({
  theme,
  onCycleTheme,
  onOpenFileClick,
  onOpenTypography,
  onOpenStats,
  isReading,
  onOpenSearch,
  onQuickBookmark,
  isBookmarked,
}) => {
  const getThemeIcon = () => {
    switch (theme) {
      case 'oled':
        return <Moon size={13} className="text-accent" />;
      case 'slate':
        return <Sparkles size={13} className="text-accent" />;
      case 'sepia':
        return <Coffee size={13} className="text-accent" />;
      case 'paper':
        return <FileText size={13} className="text-accent" />;
      case 'light':
        return <Sun size={13} className="text-accent" />;
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
      <button
        onClick={onOpenFileClick}
        title="Open File (EPUB, PDF, CBZ, MD, TXT...)"
        aria-label="Open File"
        style={{
          height: '22px',
          width: '22px',
          borderRadius: 'var(--radius-xs)',
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
        <FolderOpen size={12} style={{ color: 'var(--color-accent)' }} />
      </button>

      <button
        onClick={onCycleTheme}
        title={`Cycle Theme (Current: ${theme.toUpperCase()})`}
        aria-label="Cycle Theme"
        style={{
          height: '22px',
          width: '22px',
          borderRadius: 'var(--radius-xs)',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface-hover)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 120ms ease',
        }}
      >
        {getThemeIcon()}
      </button>

      <button
        onClick={onOpenTypography}
        title="Typography & Theme Settings"
        aria-label="Typography Settings"
        style={{
          height: '22px',
          width: '22px',
          borderRadius: 'var(--radius-xs)',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface-hover)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 120ms ease',
        }}
      >
        <Sliders size={12} style={{ color: 'var(--color-text-primary)' }} />
      </button>

      {onOpenStats && (
        <button
          onClick={onOpenStats}
          title="Reading Insights & Pace Stats"
          aria-label="Reading Insights"
          style={{
            height: '22px',
            width: '22px',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface-hover)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 120ms ease',
          }}
        >
          <Flame size={12} style={{ color: '#f97316' }} />
        </button>
      )}

      {isReading && onOpenSearch && (
        <button
          onClick={onOpenSearch}
          title="Search in Book (Ctrl+F)"
          aria-label="Search Book"
          style={{
            height: '22px',
            width: '22px',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface-hover)',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 120ms ease',
          }}
        >
          <Search size={12} />
        </button>
      )}

      {isReading && onQuickBookmark && (
        <button
          onClick={onQuickBookmark}
          title={isBookmarked ? 'Remove Bookmark (Ctrl+B)' : 'Bookmark Page (Ctrl+B)'}
          aria-label="Toggle Bookmark"
          style={{
            height: '22px',
            width: '22px',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--color-border)',
            backgroundColor: isBookmarked ? 'var(--color-accent-subtle)' : 'var(--color-surface-hover)',
            color: isBookmarked ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 120ms ease',
          }}
        >
          <Bookmark size={12} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>
      )}
    </div>
  );
};
