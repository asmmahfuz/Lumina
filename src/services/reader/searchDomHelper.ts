/**
 * Lumina Reader - Search DOM Highlight & Jump Helper
 * Highlights search matches in iframe DOM, navigates paginated/continuous reading modes,
 * and manages active match pulse states.
 */

import { SearchMatch, SearchOptions } from '@/types/search';

/**
 * Unwraps all search match <mark> elements and merges text nodes cleanly
 */
export function clearSearchHighlights(doc: Document): void {
  const marks = Array.from(doc.querySelectorAll('mark.lumina-search-match'));
  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark);
    }
    mark.remove();
    parent.normalize();
  });
}

/**
 * Builds a search regex for in-DOM text node matching
 */
function buildDomSearchRegex(query: string, options: SearchOptions): RegExp | null {
  if (!query.trim()) return null;
  let pattern = options.isRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (options.wholeWord) pattern = `\\b${pattern}\\b`;
  const flags = options.caseSensitive ? 'g' : 'gi';
  try {
    return new RegExp(pattern, flags);
  } catch {
    const fallback = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(fallback, flags);
  }
}

/**
 * Highlights matching search occurrences in the document body
 */
export function applySearchHighlights(
  doc: Document,
  matchesInChapter: SearchMatch[],
  query: string,
  options: SearchOptions,
  activeMatchId?: string
): void {
  clearSearchHighlights(doc);
  if (!query.trim() || matchesInChapter.length === 0) return;

  const regex = buildDomSearchRegex(query, options);
  if (!regex) return;

  const body = doc.body;
  if (!body) return;

  // Collect all text nodes, skipping scripts, styles, annotations, and existing marks
  const textNodes: Text[] = [];
  const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName.toLowerCase();
      if (['script', 'style', 'svg', 'noscript', 'mark'].includes(tag)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let currentNode: Node | null;
  while ((currentNode = walker.nextNode())) {
    textNodes.push(currentNode as Text);
  }

  let matchIndex = 0;
  for (const textNode of textNodes) {
    const parent = textNode.parentNode;
    if (!parent) continue;

    const content = textNode.nodeValue || '';
    regex.lastIndex = 0;

    let match: RegExpExecArray | null;
    let lastIndex = 0;
    const fragments: (Node | string)[] = [];
    let hasMatches = false;

    while ((match = regex.exec(content)) !== null) {
      if (match[0].length === 0) {
        regex.lastIndex++;
        continue;
      }

      hasMatches = true;
      const matchStart = match.index;
      const matchEnd = match.index + match[0].length;

      // Text before match
      if (matchStart > lastIndex) {
        fragments.push(content.substring(lastIndex, matchStart));
      }

      // Corresponding match object from search engine
      const searchMatch = matchesInChapter[matchIndex];
      const matchId = searchMatch ? searchMatch.id : `match_dom_${matchIndex}`;

      const mark = doc.createElement('mark');
      mark.className = 'lumina-search-match';
      if (activeMatchId && activeMatchId === matchId) {
        mark.classList.add('lumina-search-match-active');
      }
      mark.setAttribute('data-match-id', matchId);
      mark.setAttribute('data-match-index', String(matchIndex));
      mark.textContent = match[0];
      fragments.push(mark);

      matchIndex++;
      lastIndex = matchEnd;
    }

    if (hasMatches) {
      if (lastIndex < content.length) {
        fragments.push(content.substring(lastIndex));
      }

      // Replace textNode with fragments
      fragments.forEach((frag) => {
        if (typeof frag === 'string') {
          parent.insertBefore(doc.createTextNode(frag), textNode);
        } else {
          parent.insertBefore(frag, textNode);
        }
      });
      parent.removeChild(textNode);
    }
  }
}

/**
 * Updates the active highlight in the document
 */
export function setActiveSearchMatch(doc: Document, activeMatchId: string): void {
  const previous = doc.querySelectorAll('mark.lumina-search-match-active');
  previous.forEach((el) => el.classList.remove('lumina-search-match-active'));

  if (!activeMatchId) return;
  const target = doc.querySelector(`mark.lumina-search-match[data-match-id="${activeMatchId}"]`);
  if (target) {
    target.classList.add('lumina-search-match-active');
  }
}

/**
 * Smoothly scrolls or paginates to the active match
 */
export function scrollToSearchMatch(
  doc: Document,
  win: Window,
  activeMatchId: string,
  isPaginated: boolean,
  isTwoPage: boolean,
  goToPage: (page: number) => void
): boolean {
  if (!activeMatchId) return false;
  const target = doc.querySelector(`mark.lumina-search-match[data-match-id="${activeMatchId}"]`) as HTMLElement;
  if (!target) return false;

  setActiveSearchMatch(doc, activeMatchId);

  if (isPaginated) {
    const rect = target.getBoundingClientRect();
    const elementLeft = rect.left + win.scrollX;
    const clientWidth = doc.documentElement.clientWidth || win.innerWidth || 1;
    const spreadIndex = Math.max(0, Math.floor(elementLeft / clientWidth));
    const targetPage = spreadIndex * (isTwoPage ? 2 : 1);
    goToPage(targetPage);
  } else {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return true;
}
