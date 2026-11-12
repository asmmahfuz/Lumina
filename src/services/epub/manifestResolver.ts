/**
 * Lumina Reader - Manifest Resolver
 * Resolves all EPUB manifest items and maps relative hrefs to normalized archive paths
 */

import { EpubManifestItem } from '@/types/epub';
import { sanitizeArchivePath } from '@/services/archive/safeDecompressor';

/**
 * Resolves relative href against a base directory (e.g. opfDir)
 */
export function resolveRelativePath(baseDir: string, relativeHref: string): string {
  // Strip URI fragment / hash (#anchor) and query (?param)
  const cleanHref = relativeHref.split('#')[0].split('?')[0];
  const decodedHref = decodeURIComponent(cleanHref);

  const combined = baseDir ? `${baseDir}${decodedHref}` : decodedHref;
  return sanitizeArchivePath(combined);
}

/**
 * Parses <manifest> element in the OPF document
 */
export function parseManifest(opfDoc: Document, opfDir: string): Map<string, EpubManifestItem> {
  const manifestMap = new Map<string, EpubManifestItem>();
  const manifestNode = opfDoc.querySelector('manifest') || opfDoc.getElementsByTagName('manifest')[0];

  if (!manifestNode) {
    throw new Error('Invalid OPF: Missing <manifest> element');
  }

  const items = manifestNode.querySelectorAll('item');

  for (const item of Array.from(items)) {
    const id = item.getAttribute('id');
    const href = item.getAttribute('href');
    const mediaType = item.getAttribute('media-type');
    const properties = item.getAttribute('properties') || undefined;
    const fallback = item.getAttribute('fallback') || undefined;

    if (!id || !href || !mediaType) {
      continue;
    }

    const fullPath = resolveRelativePath(opfDir, href);

    manifestMap.set(id, {
      id,
      href,
      fullPath,
      mediaType,
      properties,
      fallback,
    });
  }

  return manifestMap;
}
