/**
 * Lumina Reader - In-Book Full-Text Search Engine
 * High-speed chapter text indexing, regex/string matching, and context snippet extraction
 */

import { ParsedEpubBook } from '@/types/epub';
import { SafeArchiveReader } from '@/services/archive/safeDecompressor';
import {
  SearchOptions,
  SearchMatch,
  ChapterSearchResult,
  BookSearchResult,
  DEFAULT_SEARCH_OPTIONS,
} from '@/types/search';

interface CachedChapter {
  fullPath: string;
  title: string;
  plainText: string;
}

export class BookSearchEngine {
  private chapterCache = new Map<string, CachedChapter>();
  private currentBookId: string | null = null;

  public clearCache(): void {
    this.chapterCache.clear();
    this.currentBookId = null;
  }

  /**
   * Resolves a human-readable title for a chapter from TOC or DOM
   */
  private resolveChapterTitle(book: ParsedEpubBook, fullPath: string, doc: Document, index: number): string {
    // 1. Try TOC item matching this fullPath
    const findInToc = (items: typeof book.toc): string | null => {
      for (const item of items) {
        const cleanHref = item.href.split('#')[0];
        if (fullPath.endsWith(cleanHref) || cleanHref.endsWith(fullPath)) {
          return item.label.trim();
        }
        if (item.subitems && item.subitems.length > 0) {
          const sub = findInToc(item.subitems);
          if (sub) return sub;
        }
      }
      return null;
    };

    const tocTitle = findInToc(book.toc);
    if (tocTitle) return tocTitle;

    // 2. Try <h1>, <h2> or <title> in document
    const h1 = doc.querySelector('h1, h2, h3');
    if (h1 && h1.textContent?.trim()) {
      const text = h1.textContent.trim().replace(/\s+/g, ' ');
      if (text.length <= 60) return text;
    }

    const titleEl = doc.querySelector('title');
    if (titleEl && titleEl.textContent?.trim()) {
      const text = titleEl.textContent.trim().replace(/\s+/g, ' ');
      if (text.length <= 60) return text;
    }

    return `Chapter ${index + 1}`;
  }

  /**
   * Pre-extracts and caches plain text from a chapter XHTML
   */
  private async getOrIndexChapter(
    archive: SafeArchiveReader,
    book: ParsedEpubBook,
    fullPath: string,
    index: number
  ): Promise<CachedChapter | null> {
    if (this.chapterCache.has(fullPath)) {
      return this.chapterCache.get(fullPath)!;
    }

    if (!archive.hasFile(fullPath)) return null;

    try {
      const rawHtml = await archive.readAsText(fullPath);
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtml, 'application/xhtml+xml');

      // Strip non-content nodes
      const elementsToRemove = doc.querySelectorAll('script, style, head, svg, noscript');
      elementsToRemove.forEach((el) => el.remove());

      const title = this.resolveChapterTitle(book, fullPath, doc, index);
      const body = doc.body || doc.documentElement;
      const plainText = (body.textContent || '').replace(/\s+/g, ' ').trim();

      const cached: CachedChapter = { fullPath, title, plainText };
      this.chapterCache.set(fullPath, cached);
      return cached;
    } catch {
      return null;
    }
  }

  /**
   * Builds the search regular expression based on options
   */
  private buildSearchRegex(query: string, options: SearchOptions): RegExp | null {
    if (!query.trim()) return null;

    let pattern: string;
    if (options.isRegex) {
      pattern = query;
    } else {
      // Escape regex special characters for literal search
      pattern = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    if (options.wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }

    const flags = options.caseSensitive ? 'g' : 'gi';
    try {
      return new RegExp(pattern, flags);
    } catch {
      // If regex is invalid, fall back to literal escaped search
      const fallback = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(fallback, flags);
    }
  }

  /**
   * Extracts context snippet surrounding a match
   */
  private extractSnippet(
    text: string,
    matchStart: number,
    matchEnd: number,
    radius = 45
  ): { before: string; matchText: string; after: string } {
    const rawBeforeStart = Math.max(0, matchStart - radius);
    const rawAfterEnd = Math.min(text.length, matchEnd + radius);

    let snippetBefore = text.slice(rawBeforeStart, matchStart);
    let snippetAfter = text.slice(matchEnd, rawAfterEnd);

    if (rawBeforeStart > 0) snippetBefore = '...' + snippetBefore.trimStart();
    if (rawAfterEnd < text.length) snippetAfter = snippetAfter.trimEnd() + '...';

    return {
      before: snippetBefore,
      matchText: text.slice(matchStart, matchEnd),
      after: snippetAfter,
    };
  }

  /**
   * Performs full-text search across all chapters of an EPUB book
   */
  public async searchBook(params: {
    book: ParsedEpubBook;
    archive: SafeArchiveReader;
    query: string;
    options?: Partial<SearchOptions>;
    onProgress?: (current: number, total: number) => void;
    signal?: AbortSignal;
    maxMatches?: number;
  }): Promise<BookSearchResult> {
    const startTime = performance.now();
    const { book, archive, query, onProgress, signal, maxMatches = 500 } = params;
    const options: SearchOptions = { ...DEFAULT_SEARCH_OPTIONS, ...params.options };

    const bookId = book.metadata.identifier || book.metadata.title;
    if (this.currentBookId !== bookId) {
      this.clearCache();
      this.currentBookId = bookId;
    }

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return {
        query: '',
        options,
        totalMatches: 0,
        chapters: [],
        durationMs: 0,
        isComplete: true,
      };
    }

    const regex = this.buildSearchRegex(trimmedQuery, options);
    if (!regex) {
      return {
        query: trimmedQuery,
        options,
        totalMatches: 0,
        chapters: [],
        durationMs: 0,
        isComplete: true,
      };
    }

    const totalSpine = book.spine.length;
    const chaptersResults: ChapterSearchResult[] = [];
    let globalMatchCount = 0;
    let isComplete = true;

    for (let i = 0; i < totalSpine; i++) {
      if (signal?.aborted) {
        return {
          query: trimmedQuery,
          options,
          totalMatches: globalMatchCount,
          chapters: chaptersResults,
          durationMs: Math.round(performance.now() - startTime),
          isComplete: false,
        };
      }

      const item = book.spine[i];
      onProgress?.(i + 1, totalSpine);

      const cached = await this.getOrIndexChapter(archive, book, item.fullPath, i);
      if (!cached || !cached.plainText) continue;

      const matchesInChapter: SearchMatch[] = [];
      const text = cached.plainText;
      regex.lastIndex = 0;

      let match: RegExpExecArray | null;
      let chapterMatchIndex = 0;

      while ((match = regex.exec(text)) !== null) {
        if (match[0].length === 0) {
          regex.lastIndex++;
          continue;
        }

        const matchStart = match.index;
        const matchEnd = match.index + match[0].length;
        const snippet = this.extractSnippet(text, matchStart, matchEnd);

        matchesInChapter.push({
          id: `match_spine${i}_${chapterMatchIndex}`,
          spineIndex: i,
          chapterTitle: cached.title,
          snippetBefore: snippet.before,
          matchText: snippet.matchText,
          snippetAfter: snippet.after,
          charOffset: matchStart,
          matchIndexInChapter: chapterMatchIndex,
          totalMatchesInChapter: 0, // Assigned after loop
          globalIndex: globalMatchCount,
        });

        chapterMatchIndex++;
        globalMatchCount++;

        if (globalMatchCount >= maxMatches) {
          isComplete = false;
          break;
        }
      }

      if (matchesInChapter.length > 0) {
        matchesInChapter.forEach((m) => {
          m.totalMatchesInChapter = matchesInChapter.length;
        });

        chaptersResults.push({
          spineIndex: i,
          chapterTitle: cached.title,
          matches: matchesInChapter,
        });
      }

      if (globalMatchCount >= maxMatches) break;
    }

    const durationMs = Math.round(performance.now() - startTime);

    return {
      query: trimmedQuery,
      options,
      totalMatches: globalMatchCount,
      chapters: chaptersResults,
      durationMs,
      isComplete,
    };
  }
}

export const bookSearchEngine = new BookSearchEngine();
