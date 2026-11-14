/**
 * Lumina Reader - EPUB Ingestion & Normalization Engine Coordinator
 * Orchestrates safe decompression/disk streaming, metadata extraction, spine & TOC resolution
 */

import { ParsedEpubBook } from '@/types/epub';
import { SafeArchiveReader } from '@/services/archive/safeDecompressor';
import { parseContainerXml } from './containerParser';
import { parseManifest } from './manifestResolver';
import { parseSpine } from './spineResolver';
import { extractDublinCoreMetadata } from './metadataExtractor';
import { parseTableOfContents } from './tocParser';

export class EpubEngine {
  public static async parseEpub(
    archiveData: ArrayBuffer | Blob
  ): Promise<{ book: ParsedEpubBook; archive: SafeArchiveReader }> {
    const archive = await SafeArchiveReader.fromData(archiveData);
    return await this.parseFromArchive(archive);
  }

  public static async parseEpubFromPath(
    filePath: string
  ): Promise<{ book: ParsedEpubBook; archive: SafeArchiveReader }> {
    const archive = await SafeArchiveReader.fromFilePath(filePath);
    return await this.parseFromArchive(archive);
  }

  public static async parseFromArchive(
    archive: SafeArchiveReader
  ): Promise<{ book: ParsedEpubBook; archive: SafeArchiveReader }> {
    const zipSlipAlerts = archive.getZipSlipAlerts();
    const { opfPath, opfDir } = await parseContainerXml(archive);

    if (!archive.hasFile(opfPath)) {
      throw new Error(`OPF package document not found in archive at: ${opfPath}`);
    }

    const opfContent = await archive.readAsText(opfPath);
    const parser = new DOMParser();
    const opfDoc = parser.parseFromString(opfContent, 'application/xml');

    const parseError = opfDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error(`Failed to parse OPF XML package document: ${parseError.textContent}`);
    }

    const packageEl = opfDoc.querySelector('package') || opfDoc.getElementsByTagName('package')[0];
    const version = packageEl?.getAttribute('version') || '2.0';

    const manifest = parseManifest(opfDoc, opfDir);
    const { spineItems, tocId } = parseSpine(opfDoc, manifest);
    const metadata = await extractDublinCoreMetadata(opfDoc, manifest, archive, opfDir);
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
