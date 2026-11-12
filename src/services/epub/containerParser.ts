/**
 * Lumina Reader - EPUB Container Parser
 * Parses META-INF/container.xml to locate the OPF rootfile path and directory
 */

import { SafeArchiveReader } from '@/services/archive/safeDecompressor';

export interface ContainerInfo {
  opfPath: string;
  opfDir: string;
}

/**
 * Extracts the OPF rootfile path and directory from META-INF/container.xml
 */
export async function parseContainerXml(archive: SafeArchiveReader): Promise<ContainerInfo> {
  const containerXmlPath = 'META-INF/container.xml';

  if (!archive.hasFile(containerXmlPath)) {
    throw new Error('Invalid EPUB: Missing META-INF/container.xml');
  }

  const xmlContent = await archive.readAsText(containerXmlPath);
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');

  // Verify XML parse errors
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error(`Failed to parse container.xml: ${parseError.textContent}`);
  }

  // Look for rootfiles > rootfile
  const rootfiles = xmlDoc.querySelectorAll('rootfiles > rootfile');
  let opfPath = '';

  for (const rf of Array.from(rootfiles)) {
    const mediaType = rf.getAttribute('media-type');
    const fullPath = rf.getAttribute('full-path');

    if (fullPath) {
      if (mediaType === 'application/oebps-package+xml' || !opfPath) {
        opfPath = fullPath.trim();
        if (mediaType === 'application/oebps-package+xml') {
          break;
        }
      }
    }
  }

  if (!opfPath) {
    throw new Error('Invalid EPUB: No valid rootfile full-path found in container.xml');
  }

  // Calculate opf directory (e.g. "OEBPS/" or "")
  const lastSlashIndex = opfPath.lastIndexOf('/');
  const opfDir = lastSlashIndex !== -1 ? opfPath.substring(0, lastSlashIndex + 1) : '';

  return {
    opfPath,
    opfDir,
  };
}
