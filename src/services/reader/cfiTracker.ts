/**
 * Lumina Reader - Canonical Fragment Identifier (CFI) Tracker
 * Generates, parses, and resolves EPUB CFI 1.1 compliant locations.
 * Ensures resilient reading progress that survives font scaling and window resizing.
 */

export interface ParsedCfi {
  spineIndex: number;
  spineId?: string;
  domSteps: number[];
  targetElementId?: string;
  charOffset: number;
}

/**
 * Generates an EPUB CFI string for a specific DOM element inside a chapter
 */
export function generateCfi(
  targetEl: Element,
  spineIndex: number,
  spineId?: string,
  charOffset = 0
): string {
  const steps: string[] = [];
  let curr: Node | null = targetEl;
  const doc = targetEl.ownerDocument;

  while (curr && curr.nodeType === Node.ELEMENT_NODE && curr !== doc.body && curr !== doc.documentElement) {
    const parentNode: ParentNode | null = curr.parentNode;
    if (!parentNode) break;

    const elementSiblings = Array.from(parentNode.childNodes).filter(
      (n: ChildNode): boolean => n.nodeType === Node.ELEMENT_NODE
    );
    const idx = elementSiblings.indexOf(curr as ChildNode);
    const stepNum = (idx + 1) * 2;
    const idAttr = (curr as Element).id ? `[${(curr as Element).id}]` : '';
    steps.unshift(`${stepNum}${idAttr}`);

    curr = parentNode as Node;
  }

  const spineStep = (spineIndex + 1) * 2;
  const spinePart = spineId ? `/6/${spineStep}[${spineId}]` : `/6/${spineStep}`;
  const elementPart = steps.length > 0 ? steps.join('/') : '2';

  return `epubcfi(${spinePart}!/4/${elementPart}:${charOffset})`;
}

/**
 * Parses an EPUB CFI string into structured steps and identifiers
 */
export function parseCfi(cfiString: string): ParsedCfi | null {
  if (!cfiString || !cfiString.startsWith('epubcfi(') || !cfiString.endsWith(')')) {
    return null;
  }

  try {
    const content = cfiString.slice(8, -1);
    const [spinePart, docPart] = content.split('!');
    if (!spinePart || !docPart) return null;

    // Parse spine index
    const spineMatch = spinePart.match(/\/6\/(\d+)(?:\[(.*?)\])?/);
    if (!spineMatch) return null;

    const spineStep = parseInt(spineMatch[1], 10);
    const spineIndex = Math.max(0, Math.floor(spineStep / 2) - 1);
    const spineId = spineMatch[2];

    // Parse document steps and character offset
    const [pathPart, offsetPart] = docPart.split(':');
    const charOffset = offsetPart ? parseInt(offsetPart, 10) : 0;

    let targetElementId: string | undefined;
    const domSteps: number[] = [];

    const segments = pathPart.split('/').filter(Boolean);
    // Ignore leading '4' representing <body>
    const subSegments = segments[0] === '4' ? segments.slice(1) : segments;

    for (const segment of subSegments) {
      const match = segment.match(/^(\d+)(?:\[(.*?)\])?$/);
      if (match) {
        domSteps.push(parseInt(match[1], 10));
        if (match[2]) {
          targetElementId = match[2];
        }
      }
    }

    return {
      spineIndex,
      spineId,
      domSteps,
      targetElementId,
      charOffset,
    };
  } catch (err) {
    console.warn('Failed to parse CFI:', cfiString, err);
    return null;
  }
}

/**
 * Resolves a CFI string back to a concrete DOM element inside a chapter document
 */
export function resolveCfi(doc: Document, cfiString: string): Element | null {
  const parsed = parseCfi(cfiString);
  if (!parsed) return null;

  // 1. Fast lookup if an element ID was captured in the CFI
  if (parsed.targetElementId) {
    const el = doc.getElementById(parsed.targetElementId);
    if (el) return el;
  }

  // 2. Walk down DOM tree following step indices
  let current: Element | null = doc.body;
  if (!current) return null;

  for (const step of parsed.domSteps) {
    if (!current) break;
    const elementIndex = Math.floor(step / 2) - 1;
    const children: Element[] = Array.from(current.children);
    if (elementIndex >= 0 && elementIndex < children.length) {
      current = children[elementIndex];
    } else {
      // Step missing (e.g. dynamic DOM change), return closest ancestor
      return current;
    }
  }

  return current;
}

/**
 * Finds the topmost visible content element in the current viewport/column
 */
export function findFirstVisibleElement(
  doc: Document,
  win: Window,
  isPaginated: boolean,
  currentScrollLeft: number,
  pageWidth: number
): Element | null {
  if (!doc.body) return null;

  if (isPaginated) {
    // Check candidate elements (paragraphs, headings, blockquotes, divs)
    const candidates = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, blockquote, li, img, div');
    const columnStart = currentScrollLeft;
    const columnEnd = currentScrollLeft + pageWidth;

    for (const el of Array.from(candidates)) {
      const rect = el.getBoundingClientRect();
      const elAbsoluteLeft = rect.left + win.scrollX;
      // Element begins within or slightly overlaps the visible column
      if (elAbsoluteLeft >= columnStart - 20 && elAbsoluteLeft < columnEnd - 40) {
        return el;
      }
    }

    // Fallback: element at column center
    const sampleX = Math.min(win.innerWidth - 60, Math.max(60, Math.round(pageWidth * 0.3)));
    const sampleY = Math.min(win.innerHeight - 80, 100);
    const hit = doc.elementFromPoint(sampleX, sampleY);
    if (hit && hit !== doc.body && hit !== doc.documentElement) {
      return hit;
    }
  } else {
    // Continuous scroll mode
    const sampleY = 80;
    const sampleX = Math.round(win.innerWidth / 2);
    const hit = doc.elementFromPoint(sampleX, sampleY);
    if (hit && hit !== doc.body && hit !== doc.documentElement) {
      return hit;
    }
  }

  return doc.body.firstElementChild || doc.body;
}
