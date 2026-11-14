/**
 * Lumina Reader - Single-Bar Header Chrome
 * Modern minimalist desktop header chrome with clean brand navigation and consolidated right menu
 */

import React, { useState } from 'react';
import { useReaderContext } from '@/app/Providers';
import { getPlatformAdapter, isDesktopEnvironment } from '@/services/platform';
import { ReadingStats } from '@/types/stats';
import { BookOpen, PanelLeft } from 'lucide-react';
import { HeaderNavCenter } from './HeaderNavCenter';
import { HeaderActionsRight } from './HeaderActionsRight';
import { WindowControls } from './WindowControls';

interface SingleBarHeaderProps {
  onOpenTypography: () => void;
  onBookOpened?: (name: string, fileData?: ArrayBuffer, filePath?: string, fileHandle?: FileSystemFileHandle) => void;
  onSaveFile?: () => void;
  onSaveAsFile?: () => void;
  readingBookTitle?: string;
  readingChapterInfo?: { current: number; total: number };
  onPrevChapter?: () => void;
  onNextChapter?: () => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onQuickBookmark?: () => void;
  isBookmarked?: boolean;
  onOpenSearch?: () => void;
  onOpenStats?: () => void;
  stats?: ReadingStats;
}

export const SingleBarHeader: React.FC<SingleBarHeaderProps> = ({
  onOpenTypography,
  onBookOpened,
  onSaveFile,
  onSaveAsFile,
  readingBookTitle,
  readingChapterInfo,
  onPrevChapter,
  onNextChapter,
  onToggleSidebar,
  sidebarOpen,
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange,
  onQuickBookmark,
  isBookmarked,
  onOpenSearch,
  onOpenStats,
  stats,
}) => {
  const { activeView, setActiveView } = useReaderContext();
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const handleSearchChange = externalOnSearchChange || setInternalSearchQuery;

  const handleOpenFileClick = async () => {
    try {
      const adapter = getPlatformAdapter();
      const file = await adapter.openFileDialog();
      if (file && onBookOpened) {
        onBookOpened(file.name, file.data, file.filePath, file.fileHandle);
      }
    } catch (err) {
      console.warn('Open file canceled or failed:', err);
    }
  };

  const isReading = (activeView === 'reader' || activeView === 'comic' || activeView === 'fixed') && Boolean(readingBookTitle);

  const handleHeaderDoubleClick = async (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, a, select')) return;
    if (isDesktopEnvironment()) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().toggleMaximize();
      } catch (err) {
        console.warn('Failed to toggle maximize on header double-click:', err);
      }
    }
  };

  return (
    <header className="single-bar-chrome" data-tauri-drag-region onDoubleClick={handleHeaderDoubleClick}>
      {/* Left: Clean Brand Navigation Button (R2: Direct Homepage/History Navigation, No Dropdown) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
        <button
          onClick={() => setActiveView('library')}
          title="Return to Home / Library Catalog"
          aria-label="Return to Home"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            height: '26px',
            padding: '0 8px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            backgroundColor: 'transparent',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.02em',
            transition: 'background-color 120ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <BookOpen size={15} style={{ color: 'var(--color-accent)' }} />
          <span>Lumina</span>
        </button>

        {isReading && (
          <>
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                title={sidebarOpen ? 'Hide Sidebar (Ctrl+T)' : 'Show Sidebar (Ctrl+T)'}
                aria-label="Toggle Sidebar"
                style={{
                  height: '26px',
                  width: '26px',
                  padding: 0,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: sidebarOpen ? 'var(--color-accent-subtle)' : 'var(--color-surface)',
                  color: sidebarOpen ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontWeight: sidebarOpen ? 600 : 400,
                  transition: 'background-color 150ms ease, color 150ms ease',
                }}
              >
                <PanelLeft size={13} />
              </button>
            )}

            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '240px',
              }}
              title={readingBookTitle}
            >
              {readingBookTitle}
            </span>
          </>
        )}
      </div>

      {/* Center: Reader Tools in Reader, or Search in Library */}
      <HeaderNavCenter
        isReading={isReading}
        readingChapterInfo={readingChapterInfo}
        onPrevChapter={onPrevChapter}
        onNextChapter={onNextChapter}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onOpenTypography={onOpenTypography}
      />

      {/* Right: Actions & Tools and Window Management Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <HeaderActionsRight
          onOpenFileClick={handleOpenFileClick}
          onSaveFile={onSaveFile}
          onSaveAsFile={onSaveAsFile}
          onOpenTypography={onOpenTypography}
          onOpenStats={onOpenStats}
          activeBookTitle={readingBookTitle}
          isReading={isReading}
          stats={stats}
          onOpenSearch={onOpenSearch}
          onQuickBookmark={onQuickBookmark}
          isBookmarked={isBookmarked}
        />
        <WindowControls />
      </div>
    </header>
  );
};
