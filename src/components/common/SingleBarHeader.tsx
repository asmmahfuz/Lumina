/**
 * Lumina Reader - Single-Bar Header Chrome
 * Enforces strict single-bar rule (<= 38px) with zero secondary toolbars
 */

import React, { useState } from 'react';
import { useReaderContext } from '@/app/Providers';
import { ReadingTheme } from '@/types/book';
import { getPlatformAdapter } from '@/services/platform';
import { ArrowLeft, PanelLeft } from 'lucide-react';
import { HeaderNavCenter } from './HeaderNavCenter';
import { HeaderActionsRight } from './HeaderActionsRight';
import { LuminaLogoDropdown } from './LuminaLogoDropdown';

interface SingleBarHeaderProps {
  onOpenTypography: () => void;
  onBookOpened?: (name: string, fileData?: ArrayBuffer) => void;
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
}) => {
  const { theme, setTheme, activeView, setActiveView } = useReaderContext();
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const handleSearchChange = externalOnSearchChange || setInternalSearchQuery;

  const themesCycle: ReadingTheme[] = ['oled', 'slate', 'sepia', 'paper', 'light'];

  const cycleTheme = () => {
    const currentIndex = themesCycle.indexOf(theme);
    const nextTheme = themesCycle[(currentIndex + 1) % themesCycle.length];
    setTheme(nextTheme);
  };

  const handleOpenFileClick = async () => {
    try {
      const adapter = getPlatformAdapter();
      const file = await adapter.openFileDialog();
      if (file && onBookOpened) {
        onBookOpened(file.name, file.data);
      }
    } catch (err) {
      console.warn('Open file canceled or failed:', err);
    }
  };

  const isReading = (activeView === 'reader' || activeView === 'comic' || activeView === 'fixed') && Boolean(readingBookTitle);

  return (
    <header className="single-bar-chrome">
      {/* Left: Brand Dropdown & Reader Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
        <LuminaLogoDropdown
          onOpenFileClick={handleOpenFileClick}
          onSaveFile={onSaveFile}
          onSaveAsFile={onSaveAsFile}
          onOpenTypography={onOpenTypography}
          onOpenStats={onOpenStats}
          activeBookTitle={readingBookTitle}
          isReading={isReading}
        />

        {isReading && (
          <>
            <button
              onClick={() => setActiveView('library')}
              title="Return to Library"
              style={{
                height: '22px',
                padding: '0 6px',
                fontSize: '11px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={11} />
              <span>Library</span>
            </button>

            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                title={sidebarOpen ? 'Hide Sidebar (Ctrl+T)' : 'Show Sidebar (Ctrl+T)'}
                aria-label="Toggle Sidebar"
                style={{
                  height: '22px',
                  width: '22px',
                  padding: 0,
                  borderRadius: 'var(--radius-xs)',
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
                <PanelLeft size={12} />
              </button>
            )}

            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '220px',
              }}
              title={readingBookTitle}
            >
              {readingBookTitle}
            </span>
          </>
        )}
      </div>

      {/* Center: Chapter Stepper in Reader, or Search in Library */}
      <HeaderNavCenter
        isReading={isReading}
        readingChapterInfo={readingChapterInfo}
        onPrevChapter={onPrevChapter}
        onNextChapter={onNextChapter}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      {/* Right: Actions & Tools */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        <HeaderActionsRight
          theme={theme}
          onCycleTheme={cycleTheme}
          onOpenFileClick={handleOpenFileClick}
          onOpenTypography={onOpenTypography}
          onOpenStats={onOpenStats}
          isReading={isReading}
          onOpenSearch={onOpenSearch}
          onQuickBookmark={onQuickBookmark}
          isBookmarked={isBookmarked}
        />
      </div>
    </header>
  );
};
