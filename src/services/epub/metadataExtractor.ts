/**
 * Lumina Reader - OPF & Dublin Core Metadata Extractor
 * Safely extracts book title, author, description, publisher, date, language, and cover artwork
 */

import { DublinCoreMetadata, EpubManifestItem } from '@/types/epub';
import { SafeArchiveReader } from '@/services/archive/safeDecompressor';

/**
 * Extracts Dublin Core metadata from the parsed OPF XML document
 */
export async function extractDublinCoreMetadata(
  opfDoc: Document,
  manifest: Map<string, EpubManifestItem>,
  archive: SafeArchiveReader,
  _opfDir?: string
): Promise<DublinCoreMetadata> {
  const metadataNode = opfDoc.querySelector('metadata') || opfDoc.getElementsByTagName('metadata')[0];

  const getDcValue = (tagNames: string[]): string | undefined => {
    if (!metadataNode) return undefined;

    for (const tag of tagNames) {
      // 1. Try localName query
      const byLocal = Array.from(metadataNode.children).find(
        (child) => child.localName?.toLowerCase() === tag.toLowerCase()
      );
      if (byLocal?.textContent?.trim()) {
        return byLocal.textContent.trim();
      }

      // 2. Try standard selector
      const node = metadataNode.querySelector(tag);
      if (node?.textContent?.trim()) {
        return node.textContent.trim();
      }
    }
    return undefined;
  };

  const title = getDcValue(['dc\\:title', 'title']) || 'Untitled Book';
  const creator = getDcValue(['dc\\:creator', 'creator', 'author']);
  const description = getDcValue(['dc\\:description', 'description']);
  const publisher = getDcValue(['dc\\:publisher', 'publisher']);
  const language = getDcValue(['dc\\:language', 'language']) || 'en';
  const pubdate = getDcValue(['dc\\:date', 'date']);
  const identifier = getDcValue(['dc\\:identifier', 'identifier']);
  const rights = getDcValue(['dc\\:rights', 'rights']);

  // Find cover image reference
  const coverItem = findCoverManifestItem(opfDoc, manifest);
  let coverHref: string | undefined;
  let coverBlobUrl: string | undefined;
  let coverData: ArrayBuffer | undefined;
  let coverMediaType: string | undefined;

  if (coverItem) {
    coverHref = coverItem.fullPath;
    try {
      if (archive.hasFile(coverItem.fullPath)) {
        coverBlobUrl = await archive.readAsObjectUrl(coverItem.fullPath, coverItem.mediaType);
        coverData = await archive.readAsArrayBuffer(coverItem.fullPath);
        coverMediaType = coverItem.mediaType;
      }
    } catch (err) {
      console.warn('Could not extract cover blob:', err);
    }
  }

  return {
    title,
    creator,
    description,
    publisher,
    language,
    pubdate,
    identifier,
    rights,
    coverHref,
    coverBlobUrl,
    coverData,
    coverMediaType,
  };
}

/**
 * Locates the cover image item within the manifest using EPUB 2/3 and fallback standards
 */
export function findCoverManifestItem(
  opfDoc: Document,
  manifest: Map<string, EpubManifestItem>
): EpubManifestItem | undefined {
  // 1. EPUB 3: Manifest item with properties="cover-image"
  for (const item of manifest.values()) {
    if (item.properties?.includes('cover-image')) {
      return item;
    }
  }

  // 2. EPUB 2: <meta name="cover" content="[cover-id]" />
  const metaCover = opfDoc.querySelector('meta[name="cover"]');
  const coverId = metaCover?.getAttribute('content');
  if (coverId && manifest.has(coverId)) {
    return manifest.get(coverId);
  }

  // 3. Fallback: item with id="cover" or id="cover-image"
  const candidateIds = ['cover', 'cover-image', 'cover_image', 'cover-img'];
  for (const id of candidateIds) {
    if (manifest.has(id)) {
      return manifest.get(id);
    }
  }

  // 4. Fallback: Any image item whose href or id contains "cover"
  for (const item of manifest.values()) {
    if (
      item.mediaType.startsWith('image/') &&
      (item.id.toLowerCase().includes('cover') || item.href.toLowerCase().includes('cover'))
    ) {
      return item;
    }
  }

  return undefined;
}
