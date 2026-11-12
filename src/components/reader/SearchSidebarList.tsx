/**
 * Lumina Reader - Search Sidebar List Component
 * Provides live in-book search input, options toggles, match navigation stepper,
 * chapter-grouped context snippets, and direct jump navigation.
 */

import React, { useEffect, useRef } from 'react';
import { Search, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { SearchMatch, BookSearchResult } from '@/types/search';
import { ParsedEpubBook } from '@/types/epub';
import { SafeArchiveReader } from '@/services/archive/safeDecompressor';
import { useBookSearch } from './useBookSearch';
import { SearchMatchCard } from './SearchMatchCard';

interface SearchSidebarListProps {
  book: ParsedEpubBook;
  archive: SafeArchiveReader;
  currentSpineIndex: number;
  activeMatchId?: string;
  onSelectMatch: (match: SearchMatch) => void;
  onClearSearch?: () => void;
  initialQuery?: string;
  onSearchResultsChange?: (results: BookSearchResult | null) => void;
}

export const SearchSidebarList: React.FC<SearchSidebarListProps> = ({
  book,
  archive,
  currentSpineIndex,
  activeMatchId,
  onSelectMatch,
  onClearSearch,
  initialQuery = '',
  onSearchResultsChange,
}) => {
  const {
    query,
    setQuery,
    clearQuery,
    options,
    setOptions,
    isSearching,
    progress,
    searchResult,
    collapsedChapters,
    toggleChapterCollapse,
    allMatches,
    activeMatchGlobalIndex,
    handleStepNext,
    handleStepPrev,
  } = useBookSearch({
    book,
    archive,
    activeMatchId,
    initialQuery,
    onSelectMatch,
    onClearSearch,
    onSearchResultsChange,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) handleStepPrev();
      else handleStepNext();
    } else if (e.key === 'Escape') {
      clearQuery();
      inputRef.current?.blur();
    }
  };

  const renderOption = (label: string, active: boolean, title: string, onClick: () => void) => (
    <button
      onClick={onClick}
      title={title}
      style={{
        height: '20px',
        padding: '0 6px',
        fontSize: '10px',
        fontWeight: 600,
        borderRadius: 'var(--radius-xs)',
        border: '1px solid var(--color-border)',
        backgroundColor: active ? 'var(--color-accent-subtle)' : 'transparent',
        color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* 1. Search Input Bar */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 8px', height: '28px', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xs)' }}>
          <Search size={12} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search full book text..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ width: '100%', background: 'transparent', border: 'none', fontSize: '11px', color: 'var(--color-text-primary)', outline: 'none' }}
          />
          {query && (
            <button onClick={() => { clearQuery(); inputRef.current?.focus(); }} title="Clear search (Esc)" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '2px', display: 'flex', alignItems: 'center' }}>
              <X size={11} />
            </button>
          )}
        </div>

        {/* 2. Search Options Row: Match Case, Whole Word, Regex */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
          {renderOption('Aa', options.caseSensitive, 'Match Case (Aa)', () => setOptions((p) => ({ ...p, caseSensitive: !p.caseSensitive })))}
          {renderOption('\\bW\\b', options.wholeWord, 'Match Whole Word', () => setOptions((p) => ({ ...p, wholeWord: !p.wholeWord })))}
          {renderOption('.*', options.isRegex, 'Regular Expression (.*)', () => setOptions((p) => ({ ...p, isRegex: !p.isRegex })))}

          {allMatches.length > 0 && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginRight: '4px' }}>
                {activeMatchGlobalIndex >= 0 ? `${activeMatchGlobalIndex + 1} of ${allMatches.length}` : `${allMatches.length}`}
              </span>
              <button onClick={handleStepPrev} title="Previous match (Shift+Enter)" style={{ height: '20px', width: '20px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-hover)', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ChevronUp size={12} />
              </button>
              <button onClick={handleStepNext} title="Next match (Enter)" style={{ height: '20px', width: '20px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-hover)', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ChevronDown size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Status Bar */}
      {isSearching && (
        <div style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface-hover)' }}>
          <Loader2 size={12} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
          <span>{progress ? `Searching chapter ${progress.current} of ${progress.total}...` : 'Searching...'}</span>
        </div>
      )}

      {/* 4. Results List Container */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
        {!query.trim() ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '0 16px' }}>
            <Search size={24} style={{ opacity: 0.35, marginBottom: '8px' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Search in Book</span>
            <p style={{ fontSize: '11px', lineHeight: 1.4, margin: 0 }}>
              Search full-text occurrences across all chapters. Press <kbd style={{ padding: '1px 4px', fontSize: '10px', borderRadius: '3px', border: '1px solid var(--color-border)' }}>Ctrl+F</kbd> or <kbd style={{ padding: '1px 4px', fontSize: '10px', borderRadius: '3px', border: '1px solid var(--color-border)' }}>/</kbd> anytime.
            </p>
          </div>
        ) : searchResult && searchResult.totalMatches === 0 && !isSearching ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '160px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>No occurrences found</span>
            <span style={{ fontSize: '11px', marginTop: '4px' }}>Checked {book.spine.length} chapters ({searchResult.durationMs}ms)</span>
          </div>
        ) : searchResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', padding: '2px 4px' }}>
              {searchResult.totalMatches} {searchResult.totalMatches === 1 ? 'match' : 'matches'} in {searchResult.chapters.length} {searchResult.chapters.length === 1 ? 'chapter' : 'chapters'} ({searchResult.durationMs}ms)
            </div>

            {searchResult.chapters.map((chapter) => (
              <SearchMatchCard
                key={chapter.spineIndex}
                chapter={chapter}
                isCollapsed={Boolean(collapsedChapters[chapter.spineIndex])}
                isCurrentChapter={chapter.spineIndex === currentSpineIndex}
                activeMatchId={activeMatchId}
                onToggleCollapse={() => toggleChapterCollapse(chapter.spineIndex)}
                onSelectMatch={onSelectMatch}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
};
