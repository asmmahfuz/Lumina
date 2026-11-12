/**
 * Lumina Reader - Reading Spine Resolver
 * Resolves sequential reading order, linear flow flags, and TOC references from <spine>
 */

import { EpubManifestItem, EpubSpineItem } from '@/types/epub';

export interface SpineParseResult {
  spineItems: EpubSpineItem[];
  tocId?: string;
  pageProgressionDirection?: 'ltr' | 'rtl';
}

/**
 * Parses <spine> element in the OPF document
 */
export function parseSpine(
  opfDoc: Document,
  manifest: Map<string, EpubManifestItem>
): SpineParseResult {
  const spineNode = opfDoc.querySelector('spine') || opfDoc.getElementsByTagName('spine')[0];

  if (!spineNode) {
    throw new Error('Invalid OPF: Missing <spine> element');
  }

  const tocId = spineNode.getAttribute('toc') || undefined;
  const directionAttr = spineNode.getAttribute('page-progression-direction');
  const pageProgressionDirection = directionAttr === 'rtl' ? 'rtl' : 'ltr';

  const itemrefs = spineNode.querySelectorAll('itemref');
  const spineItems: EpubSpineItem[] = [];

  Array.from(itemrefs).forEach((itemref, index) => {
    const idref = itemref.getAttribute('idref');
    if (!idref) return;

    const linearAttr = itemref.getAttribute('linear');
    const linear = linearAttr !== 'no'; // Default to true unless explicitly 'no'

    const manifestItem = manifest.get(idref);
    const fullPath = manifestItem?.fullPath || '';

    spineItems.push({
      idref,
      index,
      linear,
      fullPath,
      manifestItem,
    });
  });

  return {
    spineItems,
    tocId,
    pageProgressionDirection,
  };
}
