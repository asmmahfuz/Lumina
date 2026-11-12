/**
 * Lumina Reader - In-Book Full-Text Search Types
 * Type definitions for book search indexing, query options, match snippets, and results
 */

export interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  isRegex: boolean;
}

export interface SearchMatch {
  id: string; // Unique match identifier, e.g. "match_spine0_12"
  spineIndex: number;
  chapterTitle: string;
  snippetBefore: string;
  matchText: string;
  snippetAfter: string;
  charOffset: number;
  matchIndexInChapter: number;
  totalMatchesInChapter: number;
  globalIndex: number; // 0-based index across all matches in the book
}

export interface ChapterSearchResult {
  spineIndex: number;
  chapterTitle: string;
  matches: SearchMatch[];
}

export interface BookSearchResult {
  query: string;
  options: SearchOptions;
  totalMatches: number;
  chapters: ChapterSearchResult[];
  durationMs: number;
  isComplete: boolean;
}

export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  caseSensitive: false,
  wholeWord: false,
  isRegex: false,
};
