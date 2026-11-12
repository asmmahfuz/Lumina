/**
 * Lumina Reader - Annotation DOM Helper
 * Safely applies, highlights, updates, and scrolls to text annotations inside the sandboxed iframe.
 */

import { Annotation } from '@/types/book';
import { resolveCfi } from './cfiTracker';

export function createHighlightMark(doc: Document, annotation: Annotation): HTMLElement {
  const mark = doc.createElement('mark');
  mark.className = `lumina-highlight lumina-highlight-${annotation.color}${annotation.note ? ' lumina-highlight-has-note' : ''}`;
  mark.setAttribute('data-annotation-id', annotation.id);
  if (annotation.note) {
    mark.title = annotation.note;
  }
  return mark;
}

/**
 * Wraps a DOM Range in a styled <mark> element
 */
export function wrapSelectionRange(
  doc: Document,
  range: Range,
  annotation: Annotation,
  onClick?: (annotation: Annotation) => void
): HTMLElement | null {
  try {
    const mark = createHighlightMark(doc, annotation);
    if (onClick) {
      mark.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick(annotation);
      });
    }

    try {
      range.surroundContents(mark);
    } catch {
      const fragment = range.extractContents();
      mark.appendChild(fragment);
      range.insertNode(mark);
    }
    return mark;
  } catch (err) {
    console.warn('Could not wrap selection range in highlight:', err);
    return null;
  }
}

/**
 * Applies saved annotations for the current chapter into the iframe DOM
 */
export function applyAnnotationsToDocument(
  doc: Document,
  annotations: Annotation[],
  onHighlightClick?: (annotation: Annotation) => void
): void {
  if (!doc.body || annotations.length === 0) return;

  for (const annotation of annotations) {
    // Avoid double-wrapping
    if (doc.querySelector(`[data-annotation-id="${annotation.id}"]`)) continue;

    let targetParent: Node = doc.body;
    if (annotation.cfi) {
      const resolved = resolveCfi(doc, annotation.cfi);
      if (resolved) targetParent = resolved;
    }

    const snippet = annotation.text.trim();
    if (!snippet) continue;

    // Search for text match within targetParent, fallback to doc.body
    let found = highlightTextInNode(doc, targetParent, annotation, onHighlightClick);
    if (!found && targetParent !== doc.body) {
      highlightTextInNode(doc, doc.body, annotation, onHighlightClick);
    }
  }
}

function highlightTextInNode(
  doc: Document,
  root: Node,
  annotation: Annotation,
  onHighlightClick?: (annotation: Annotation) => void
): boolean {
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Node) {
      if (node.parentElement?.closest('.lumina-highlight')) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const query = annotation.text.trim();
  let current: Node | null = walker.nextNode();

  while (current) {
    const text = current.textContent || '';
    const index = text.indexOf(query);

    if (index !== -1) {
      try {
        const range = doc.createRange();
        range.setStart(current, index);
        range.setEnd(current, index + query.length);
        wrapSelectionRange(doc, range, annotation, onHighlightClick);
        return true;
      } catch (err) {
        console.warn('Failed to wrap restored text highlight:', err);
      }
    }
    current = walker.nextNode();
  }
  return false;
}

/**
 * Updates color or note indicator on an existing highlight in the DOM
 */
export function updateHighlightInDocument(doc: Document, annotation: Annotation): void {
  const mark = doc.querySelector(`[data-annotation-id="${annotation.id}"]`) as HTMLElement | null;
  if (!mark) return;

  mark.className = `lumina-highlight lumina-highlight-${annotation.color}${annotation.note ? ' lumina-highlight-has-note' : ''}`;
  mark.title = annotation.note || '';
}

/**
 * Removes a highlight from the DOM, unwrapping its text content
 */
export function removeHighlightFromDocument(doc: Document, annotationId: string): void {
  const mark = doc.querySelector(`[data-annotation-id="${annotationId}"]`);
  if (!mark || !mark.parentNode) return;

  while (mark.firstChild) {
    mark.parentNode.insertBefore(mark.firstChild, mark);
  }
  mark.remove();
}

/**
 * Scrolls smoothly to a highlight and flashes it
 */
export function scrollToHighlightInDocument(
  doc: Document,
  annotationId: string,
  onScrollToX?: (x: number) => void
): boolean {
  const mark = doc.querySelector(`[data-annotation-id="${annotationId}"]`) as HTMLElement | null;
  if (!mark) return false;

  mark.classList.remove('lumina-highlight-active');
  void mark.offsetWidth; // Trigger reflow for animation restart
  mark.classList.add('lumina-highlight-active');

  const rect = mark.getBoundingClientRect();
  const win = doc.defaultView || window;

  if (onScrollToX) {
    const absoluteX = rect.left + win.scrollX;
    onScrollToX(absoluteX);
  } else {
    mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  setTimeout(() => {
    mark.classList.remove('lumina-highlight-active');
  }, 2500);

  return true;
}
