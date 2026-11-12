/**
 * Lumina Reader - Table of Contents (NCX / NAV) Parser
 * Recursive hierarchy parser for EPUB2 NCX (<navMap>) and EPUB3 NAV (<nav epub:type="toc">)
 */

import { EpubManifestItem, TableOfContentsItem } from '@/types/epub';
import { SafeArchiveReader } from '@/services/archive/safeDecompressor';
import { resolveRelativePath } from './manifestResolver';

/**
 * Parses either EPUB 3 NAV document or EPUB 2 NCX file to produce recursive TOC
 */
export async function parseTableOfContents(
  archive: SafeArchiveReader,
  manifest: Map<string, EpubManifestItem>,
  tocId?: string,
  opfDir = ''
): Promise<TableOfContentsItem[]> {
  // 1. Try EPUB 3 Navigation Document (item with properties="nav")
  const navItem = findEpub3NavItem(manifest);
  if (navItem && archive.hasFile(navItem.fullPath)) {
    try {
      const navXml = await archive.readAsText(navItem.fullPath);
      const navBaseDir = getFileDirectory(navItem.fullPath);
      const toc = parseEpub3Nav(navXml, navBaseDir);
      if (toc.length > 0) {
        return toc;
      }
    } catch (err) {
      console.warn('Failed to parse EPUB3 NAV, attempting NCX fallback:', err);
    }
  }

  // 2. Try EPUB 2 NCX Document (tocId from spine, or media-type application/x-dtbncx+xml, or toc.ncx)
  const ncxItem = findEpub2NcxItem(manifest, tocId, opfDir);
  if (ncxItem && archive.hasFile(ncxItem.fullPath)) {
    try {
      const ncxXml = await archive.readAsText(ncxItem.fullPath);
      const ncxBaseDir = getFileDirectory(ncxItem.fullPath);
      return parseEpub2Ncx(ncxXml, ncxBaseDir);
    } catch (err) {
      console.warn('Failed to parse EPUB2 NCX:', err);
    }
  }

  return [];
}

/**
 * Finds EPUB 3 navigation item in manifest
 */
function findEpub3NavItem(manifest: Map<string, EpubManifestItem>): EpubManifestItem | undefined {
  for (const item of manifest.values()) {
    if (item.properties?.includes('nav')) {
      return item;
    }
  }
  // Fallback by filename
  for (const item of manifest.values()) {
    if (item.href.toLowerCase().endsWith('nav.xhtml') || item.id.toLowerCase() === 'nav') {
      return item;
    }
  }
  return undefined;
}

/**
 * Finds EPUB 2 NCX item in manifest
 */
function findEpub2NcxItem(
  manifest: Map<string, EpubManifestItem>,
  tocId?: string,
  opfDir = ''
): EpubManifestItem | undefined {
  if (tocId && manifest.has(tocId)) {
    return manifest.get(tocId);
  }

  for (const item of manifest.values()) {
    if (item.mediaType === 'application/x-dtbncx+xml' || item.href.toLowerCase().endsWith('.ncx')) {
      return item;
    }
  }

  // Fallback check standard path
  const standardNcxPath = opfDir ? `${opfDir}toc.ncx` : 'toc.ncx';
  return {
    id: 'ncx-fallback',
    href: 'toc.ncx',
    fullPath: standardNcxPath,
    mediaType: 'application/x-dtbncx+xml',
  };
}

/**
 * Parses EPUB 3 <nav epub:type="toc"> or <nav> elements into recursive TableOfContentsItem[]
 */
export function parseEpub3Nav(navHtml: string, navBaseDir: string): TableOfContentsItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(navHtml, 'application/xhtml+xml');

  // Find <nav epub:type="toc"> or <nav id="toc"> or first <nav>
  let navEl = doc.querySelector('nav[*|type="toc"]') || doc.querySelector('nav[id="toc"]');
  if (!navEl) {
    const navs = doc.querySelectorAll('nav');
    for (const nav of Array.from(navs)) {
      const type = nav.getAttribute('epub:type') || nav.getAttribute('type');
      if (type === 'toc' || !navEl) {
        navEl = nav;
        if (type === 'toc') break;
      }
    }
  }

  if (!navEl) return [];

  const topOl = navEl.querySelector('ol');
  if (!topOl) return [];

  return parseOlElement(topOl, navBaseDir);
}

function parseOlElement(olEl: Element, baseDir: string): TableOfContentsItem[] {
  const items: TableOfContentsItem[] = [];
  const liElements = Array.from(olEl.children).filter((el) => el.tagName.toLowerCase() === 'li');

  for (let i = 0; i < liElements.length; i++) {
    const li = liElements[i];
    const link = li.querySelector(':scope > a') || li.querySelector('a');
    if (!link) continue;

    const label = link.textContent?.trim() || `Section ${i + 1}`;
    const rawHref = link.getAttribute('href') || '';
    const resolvedHref = resolveNavHref(baseDir, rawHref);
    const id = link.getAttribute('id') || `nav-item-${i}-${label.replace(/\s+/g, '-').toLowerCase()}`;

    // Check nested <ol>
    const subOl = li.querySelector(':scope > ol') || li.querySelector('ol');
    const subitems = subOl ? parseOlElement(subOl, baseDir) : undefined;

    items.push({
      id,
      label,
      href: resolvedHref,
      subitems: subitems && subitems.length > 0 ? subitems : undefined,
    });
  }

  return items;
}

/**
 * Parses EPUB 2 <navMap> and recursive <navPoint> elements into TableOfContentsItem[]
 */
export function parseEpub2Ncx(ncxXml: string, ncxBaseDir: string): TableOfContentsItem[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(ncxXml, 'application/xml');

  const navMap = doc.querySelector('navMap');
  if (!navMap) return [];

  const topNavPoints = Array.from(navMap.children).filter(
    (el) => el.localName?.toLowerCase() === 'navpoint'
  );

  return topNavPoints.map((np, idx) => parseNavPoint(np, ncxBaseDir, idx));
}

function parseNavPoint(navPoint: Element, baseDir: string, index: number): TableOfContentsItem {
  const id = navPoint.getAttribute('id') || `ncx-${index}`;

  // Extract label
  const labelText =
    navPoint.querySelector('navLabel > text')?.textContent?.trim() ||
    navPoint.getElementsByTagName('text')[0]?.textContent?.trim() ||
    `Chapter ${index + 1}`;

  // Extract content src
  const contentEl = navPoint.querySelector('content') || navPoint.getElementsByTagName('content')[0];
  const rawSrc = contentEl?.getAttribute('src') || '';
  const resolvedHref = resolveNavHref(baseDir, rawSrc);

  // Recursively extract subitems
  const childNavPoints = Array.from(navPoint.children).filter(
    (el) => el.localName?.toLowerCase() === 'navpoint'
  );

  const subitems = childNavPoints.map((child, subIdx) =>
    parseNavPoint(child, baseDir, subIdx)
  );

  return {
    id,
    label: labelText,
    href: resolvedHref,
    subitems: subitems.length > 0 ? subitems : undefined,
  };
}

function getFileDirectory(filePath: string): string {
  const lastSlash = filePath.lastIndexOf('/');
  return lastSlash !== -1 ? filePath.substring(0, lastSlash + 1) : '';
}

function resolveNavHref(baseDir: string, rawHref: string): string {
  const [pathPart, hashPart] = rawHref.split('#');
  const resolvedPath = resolveRelativePath(baseDir, pathPart);
  return hashPart ? `${resolvedPath}#${hashPart}` : resolvedPath;
}
