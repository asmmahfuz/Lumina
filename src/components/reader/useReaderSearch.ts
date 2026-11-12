/**
 * Lumina Reader - Reader In-Viewport Search Controller Hook
 * Coordinates search match highlights in iframe DOM, smooth page jumps, and active match state
 */

import { useState, useCallback, useRef } from 'react';
import { SearchMatch, BookSearchResult } from '@/types/search';
import {
  applySearchHighlights,
  scrollToSearchMatch,
  clearSearchHighlights,
} from '@/services/reader/searchDomHelper';

interface UseReaderSearchProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  currentSpineIndex: number;
  isPaginated: boolean;
  isTwoPage: boolean;
  onSetSpineIndex: (index: number) => void;
  goToPage: (page: number) => void;
}

export function useReaderSearch({
  iframeRef,
  currentSpineIndex,
  isPaginated,
  isTwoPage,
  onSetSpineIndex,
  goToPage,
}: UseReaderSearchProps) {
  const [activeMatchId, setActiveMatchId] = useState<string | undefined>();
  const [searchResult, setSearchResult] = useState<BookSearchResult | null>(null);
  const pendingScrollMatchIdRef = useRef<string | null>(null);

  /**
   * Applies highlights for the current chapter in the iframe DOM
   */
  const applyHighlightsToIframe = useCallback(
    (doc: Document) => {
      if (!searchResult || !searchResult.query) {
        clearSearchHighlights(doc);
        return;
      }

      const chapterResult = searchResult.chapters.find((c) => c.spineIndex === currentSpineIndex);
      const matchesInChapter = chapterResult ? chapterResult.matches : [];

      applySearchHighlights(
        doc,
        matchesInChapter,
        searchResult.query,
        searchResult.options,
        activeMatchId
      );

      // If there's a pending match to scroll to after chapter load
      const targetMatchId = pendingScrollMatchIdRef.current || activeMatchId;
      if (targetMatchId && iframeRef.current?.contentWindow) {
        pendingScrollMatchIdRef.current = null;
        setTimeout(() => {
          scrollToSearchMatch(
            doc,
            iframeRef.current!.contentWindow!,
            targetMatchId,
            isPaginated,
            isTwoPage,
            goToPage
          );
        }, 80);
      }
    },
    [searchResult, currentSpineIndex, activeMatchId, iframeRef, isPaginated, isTwoPage, goToPage]
  );

  /**
   * Jumps to a specific search match
   */
  const handleSelectSearchMatch = useCallback(
    (match: SearchMatch) => {
      setActiveMatchId(match.id);

      if (match.spineIndex !== currentSpineIndex) {
        pendingScrollMatchIdRef.current = match.id;
        onSetSpineIndex(match.spineIndex);
        return;
      }

      const iframe = iframeRef.current;
      if (!iframe) return;
      const doc = iframe.contentDocument;
      const win = iframe.contentWindow;
      if (!doc || !win) return;

      scrollToSearchMatch(doc, win, match.id, isPaginated, isTwoPage, goToPage);
    },
    [currentSpineIndex, iframeRef, isPaginated, isTwoPage, goToPage, onSetSpineIndex]
  );

  /**
   * Clears active search highlights
   */
  const handleClearSearch = useCallback(() => {
    setActiveMatchId(undefined);
    setSearchResult(null);
    pendingScrollMatchIdRef.current = null;
    const doc = iframeRef.current?.contentDocument;
    if (doc) clearSearchHighlights(doc);
  }, [iframeRef]);

  /**
   * Updates current search results
   */
  const handleSearchResultsChange = useCallback((results: BookSearchResult | null) => {
    setSearchResult(results);
    if (!results) {
      setActiveMatchId(undefined);
    }
  }, []);

  return {
    activeMatchId,
    searchResult,
    handleSelectSearchMatch,
    handleClearSearch,
    handleSearchResultsChange,
    applyHighlightsToIframe,
  };
}
