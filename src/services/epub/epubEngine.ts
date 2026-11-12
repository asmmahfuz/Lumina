/**
 * Lumina Reader - EPUB Ingestion & Normalization Engine Coordinator
 * Orchestrates safe decompression, container locating, metadata extraction, spine & TOC resolution
 */

import { ParsedEpubBook } from '@/types/epub';
import { SafeArchiveReader } from '@/services/archive/safeDecompressor';
import { parseContainerXml } from './containerParser';
import { parseManifest } from './manifestResolver';
import { parseSpine } from './spineResolver';
import { extractDublinCoreMetadata } from './metadataExtractor';
import { parseTableOfContents } from './tocParser';

export class EpubEngine {
  /**
   * Fully parses an EPUB archive binary into structured metadata, spine items, and TOC hierarchy
   */
  public static async parseEpub(
    archiveData: ArrayBuffer | Blob
  ): Promise<{ book: ParsedEpubBook; archive: SafeArchiveReader }> {
    // 1. Safe Decompression with Zip-Slip defense
    const archive = await SafeArchiveReader.fromData(archiveData);
    const zipSlipAlerts = archive.getZipSlipAlerts();

    // 2. Container XML Parsing
    const { opfPath, opfDir } = await parseContainerXml(archive);

    if (!archive.hasFile(opfPath)) {
      throw new Error(`OPF package document not found in archive at: ${opfPath}`);
    }

    // 3. OPF XML Document Parsing
    const opfContent = await archive.readAsText(opfPath);
    const parser = new DOMParser();
    const opfDoc = parser.parseFromString(opfContent, 'application/xml');

    const parseError = opfDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error(`Failed to parse OPF XML package document: ${parseError.textContent}`);
    }

    const packageEl = opfDoc.querySelector('package') || opfDoc.getElementsByTagName('package')[0];
    const version = packageEl?.getAttribute('version') || '2.0';

    // 4. Manifest Resolution
    const manifest = parseManifest(opfDoc, opfDir);

    // 5. Spine Resolution
    const { spineItems, tocId } = parseSpine(opfDoc, manifest);

    // 6. Dublin Core Metadata & Cover Art Extraction
    const metadata = await extractDublinCoreMetadata(opfDoc, manifest, archive, opfDir);

    // 7. Table of Contents (NCX / NAV) Recursive Hierarchy Parsing
    const toc = await parseTableOfContents(archive, manifest, tocId, opfDir);

    const book: ParsedEpubBook = {
      metadata,
      opfPath,
      opfDir,
      version,
      manifest,
      spine: spineItems,
      toc,
      zipSlipAlerts,
    };

    return { book, archive };
  }
}
