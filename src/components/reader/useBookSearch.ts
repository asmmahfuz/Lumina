/**
 * Lumina Reader - Book Search Controller Hook
 * Handles debounced query execution, regex options, progress events, and stepper navigation
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  SearchOptions,
  SearchMatch,
  BookSearchResult,
  DEFAULT_SEARCH_OPTIONS,
} from '@/types/search';
import { ParsedEpubBook } from '@/types/epub';
import { SafeArchiveReader } from '@/services/archive/safeDecompressor';
import { bookSearchEngine } from '@/services/reader/bookSearchEngine';

interface UseBookSearchProps {
  book: ParsedEpubBook;
  archive: SafeArchiveReader;
  activeMatchId?: string;
  initialQuery?: string;
  onSelectMatch: (match: SearchMatch) => void;
  onClearSearch?: () => void;
  onSearchResultsChange?: (results: BookSearchResult | null) => void;
}

export function useBookSearch({
  book,
  archive,
  activeMatchId,
  initialQuery = '',
  onSelectMatch,
  onClearSearch,
  onSearchResultsChange,
}: UseBookSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [options, setOptions] = useState<SearchOptions>(DEFAULT_SEARCH_OPTIONS);
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [searchResult, setSearchResult] = useState<BookSearchResult | null>(null);
  const [collapsedChapters, setCollapsedChapters] = useState<Record<number, boolean>>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  const allMatches = useMemo(() => {
    if (!searchResult) return [];
    return searchResult.chapters.flatMap((c) => c.matches);
  }, [searchResult]);

  const activeMatchGlobalIndex = useMemo(() => {
    if (!activeMatchId || allMatches.length === 0) return -1;
    return allMatches.findIndex((m) => m.id === activeMatchId);
  }, [activeMatchId, allMatches]);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResult(null);
      setIsSearching(false);
      setProgress(null);
      onSearchResultsChange?.(null);
      onClearSearch?.();
      return;
    }

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const result = await bookSearchEngine.searchBook({
          book,
          archive,
          query,
          options,
          signal: abortController.signal,
          onProgress: (current, total) => setProgress({ current, total }),
        });

        if (!abortController.signal.aborted) {
          setSearchResult(result);
          onSearchResultsChange?.(result);
          setIsSearching(false);
          setProgress(null);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          console.warn('Search failed:', err);
          setIsSearching(false);
          setProgress(null);
        }
      }
    }, 220);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [query, options, book, archive, onSearchResultsChange, onClearSearch]);

  const toggleChapterCollapse = useCallback((spineIndex: number) => {
    setCollapsedChapters((prev) => ({ ...prev, [spineIndex]: !prev[spineIndex] }));
  }, []);

  const handleStepNext = useCallback(() => {
    if (allMatches.length === 0) return;
    const nextIdx = activeMatchGlobalIndex < allMatches.length - 1 ? activeMatchGlobalIndex + 1 : 0;
    const target = allMatches[nextIdx];
    if (target) onSelectMatch(target);
  }, [allMatches, activeMatchGlobalIndex, onSelectMatch]);

  const handleStepPrev = useCallback(() => {
    if (allMatches.length === 0) return;
    const prevIdx = activeMatchGlobalIndex > 0 ? activeMatchGlobalIndex - 1 : allMatches.length - 1;
    const target = allMatches[prevIdx];
    if (target) onSelectMatch(target);
  }, [allMatches, activeMatchGlobalIndex, onSelectMatch]);

  const clearQuery = useCallback(() => {
    setQuery('');
  }, []);

  return {
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
  };
}
