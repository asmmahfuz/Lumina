/**
 * Lumina Reader - Virtual EPUB Archive Builder
 * Constructs valid in-memory EPUB 3/2 archives from normalized content
 * conforming to SafeArchiveReader and ParsedEpubBook specifications
 */

import JSZip from 'jszip';
import { DublinCoreMetadata, ParsedEpubBook } from '@/types/epub';
import { TableOfContentsItem } from '@/types/book';
import { SafeArchiveReader } from '@/services/archive/safeDecompressor';
import { EpubEngine } from '@/services/epub/epubEngine';

export interface VirtualChapter {
  id: string;
  title: string;
  xhtml: string;
  subitems?: TableOfContentsItem[];
}

export interface VirtualBookSpec {
  metadata: DublinCoreMetadata;
  chapters: VirtualChapter[];
  assets?: Map<string, ArrayBuffer | string>;
  coverData?: ArrayBuffer;
  coverMediaType?: string;
}

export class VirtualArchiveBuilder {
  /**
   * Builds an in-memory EPUB archive from normalized book content
   */
  public static async build(spec: VirtualBookSpec): Promise<{
    book: ParsedEpubBook;
    archive: SafeArchiveReader;
    buffer: ArrayBuffer;
  }> {
    const zip = new JSZip();

    // 1. mimetype (first entry, uncompressed)
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

    // 2. META-INF/container.xml
    const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
    zip.file('META-INF/container.xml', containerXml);

    const hasCover = !!(spec.coverData || spec.metadata.coverBlobUrl || spec.metadata.coverHref);
    const coverPath = spec.metadata.coverHref || 'images/cover.jpg';
    const coverMediaType = spec.coverMediaType || 'image/jpeg';

    if (spec.coverData) {
      zip.file(`OEBPS/${coverPath}`, spec.coverData);
    }

    // Add extra assets (images, stylesheets)
    if (spec.assets) {
      spec.assets.forEach((content, relPath) => {
        const cleanPath = relPath.startsWith('OEBPS/') ? relPath : `OEBPS/${relPath}`;
        zip.file(cleanPath, content);
      });
    }

    // 3. Chapters
    const manifestItems: string[] = [];
    const spineItems: string[] = [];
    const tocItems: TableOfContentsItem[] = [];

    if (hasCover) {
      manifestItems.push(
        `<item id="cover-image" href="${coverPath}" media-type="${coverMediaType}" properties="cover-image"/>`
      );
    }

    manifestItems.push(
      `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`
    );
    manifestItems.push(
      `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`
    );

    spec.chapters.forEach((ch) => {
      const chFile = `text/${ch.id}.xhtml`;
      manifestItems.push(
        `<item id="${ch.id}" href="${chFile}" media-type="application/xhtml+xml"/>`
      );
      spineItems.push(`<itemref idref="${ch.id}"/>`);

      // Write chapter XHTML
      zip.file(`OEBPS/${chFile}`, ch.xhtml);

      tocItems.push({
        id: ch.id,
        label: ch.title,
        href: chFile,
        subitems: ch.subitems,
      });
    });

    // 4. OEBPS/content.opf
    const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="pub-id" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(spec.metadata.title)}</dc:title>
    <dc:creator id="author">${escapeXml(spec.metadata.creator || 'Unknown Author')}</dc:creator>
    <dc:description>${escapeXml(spec.metadata.description || '')}</dc:description>
    <dc:publisher>${escapeXml(spec.metadata.publisher || 'Lumina Reader')}</dc:publisher>
    <dc:language>${escapeXml(spec.metadata.language || 'en')}</dc:language>
    <dc:date>${escapeXml(spec.metadata.pubdate || new Date().toISOString().split('T')[0])}</dc:date>
    <dc:identifier id="pub-id">${escapeXml(spec.metadata.identifier || `lumina-${Date.now()}`)}</dc:identifier>
    <dc:rights>${escapeXml(spec.metadata.rights || 'Public Domain')}</dc:rights>
    ${hasCover ? '<meta name="cover" content="cover-image"/>' : ''}
  </metadata>
  <manifest>
    ${manifestItems.join('\n    ')}
  </manifest>
  <spine toc="ncx">
    ${spineItems.join('\n    ')}
  </spine>
</package>`;
    zip.file('OEBPS/content.opf', contentOpf);

    // 5. OEBPS/nav.xhtml
    const navListItems = tocItems
      .map((item) => `<li><a href="${item.href}">${escapeXml(item.label)}</a></li>`)
      .join('\n      ');

    const navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Table of Contents</title></head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
      ${navListItems}
    </ol>
  </nav>
</body>
</html>`;
    zip.file('OEBPS/nav.xhtml', navXhtml);

    // 6. OEBPS/toc.ncx
    const navPoints = tocItems
      .map(
        (item, idx) => `  <navPoint id="np-${idx + 1}" playOrder="${idx + 1}">
    <navLabel><text>${escapeXml(item.label)}</text></navLabel>
    <content src="${item.href}"/>
  </navPoint>`
      )
      .join('\n');

    const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${escapeXml(spec.metadata.identifier || 'lumina-book')}"/>
    <meta name="dtb:depth" content="2"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeXml(spec.metadata.title)}</text></docTitle>
  <navMap>
${navPoints}
  </navMap>
</ncx>`;
    zip.file('OEBPS/toc.ncx', tocNcx);

    // 7. Generate array buffer and parse via EpubEngine
    const buffer = await zip.generateAsync({ type: 'arraybuffer' });
    const { book, archive } = await EpubEngine.parseEpub(buffer);

    return { book, archive, buffer };
  }
}

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
