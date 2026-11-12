/**
 * Lumina Reader - Sample EPUB Archive & Zip-Slip Test Generator
 * Generates valid EPUBs with Dublin Core, NAV/NCX, and synthetic Zip-Slip attack vectors
 */

import JSZip from 'jszip';

/**
 * Generates an in-memory valid EPUB 3 / EPUB 2 book archive
 */
export async function generateSampleEpub(): Promise<ArrayBuffer> {
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

  // 3. OEBPS/content.opf
  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="pub-id" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Alice's Adventures in Wonderland</dc:title>
    <dc:creator id="author">Lewis Carroll</dc:creator>
    <dc:description>The classic tale of Alice tumbling down the rabbit-hole into a fantastical realm.</dc:description>
    <dc:publisher>Macmillan &amp; Co.</dc:publisher>
    <dc:language>en</dc:language>
    <dc:date>1865-11-26</dc:date>
    <dc:identifier id="pub-id">urn:isbn:9780141439761</dc:identifier>
    <dc:rights>Public Domain</dc:rights>
    <meta name="cover" content="cover-image"/>
  </metadata>
  <manifest>
    <item id="cover-image" href="images/cover.svg" media-type="image/svg+xml" properties="cover-image"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="ch01" href="text/ch01.xhtml" media-type="application/xhtml+xml"/>
    <item id="ch02" href="text/ch02.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="ch01"/>
    <itemref idref="ch02"/>
  </spine>
</package>`;
  zip.file('OEBPS/content.opf', contentOpf);

  // 4. Cover SVG Image
  const coverSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E1B4B" />
      <stop offset="50%" stop-color="#312E81" />
      <stop offset="100%" stop-color="#4C1D95" />
    </linearGradient>
  </defs>
  <rect width="400" height="600" fill="url(#bg)" rx="8" />
  <circle cx="200" cy="220" r="100" fill="#6366F1" opacity="0.25" />
  <text x="200" y="220" font-family="Georgia, serif" font-size="28" fill="#F8FAFC" text-anchor="middle" font-weight="bold">ALICE'S</text>
  <text x="200" y="255" font-family="Georgia, serif" font-size="18" fill="#E2E8F0" text-anchor="middle">ADVENTURES IN</text>
  <text x="200" y="285" font-family="Georgia, serif" font-size="24" fill="#A5B4FC" text-anchor="middle" font-weight="bold">WONDERLAND</text>
  <text x="200" y="480" font-family="sans-serif" font-size="16" fill="#94A3B8" text-anchor="middle">LEWIS CARROLL</text>
  <text x="200" y="550" font-family="sans-serif" font-size="11" fill="#64748B" text-anchor="middle">LUMINA READER EDITION</text>
</svg>`;
  zip.file('OEBPS/images/cover.svg', coverSvg);

  // 5. EPUB 3 Navigation Document (nav.xhtml)
  const navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Table of Contents</title></head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
      <li>
        <a href="text/ch01.xhtml">Chapter I: Down the Rabbit-Hole</a>
        <ol>
          <li><a href="text/ch01.xhtml#section-1">The White Rabbit</a></li>
          <li><a href="text/ch01.xhtml#section-2">The Hall of Doors</a></li>
        </ol>
      </li>
      <li>
        <a href="text/ch02.xhtml">Chapter II: The Pool of Tears</a>
      </li>
    </ol>
  </nav>
</body>
</html>`;
  zip.file('OEBPS/nav.xhtml', navXhtml);

  // 6. EPUB 2 NCX Document (toc.ncx)
  const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="urn:isbn:9780141439761"/></head>
  <docTitle><text>Alice's Adventures in Wonderland</text></docTitle>
  <navMap>
    <navPoint id="nav1" playOrder="1">
      <navLabel><text>Chapter I: Down the Rabbit-Hole</text></navLabel>
      <content src="text/ch01.xhtml"/>
      <navPoint id="nav1-sub1" playOrder="2">
        <navLabel><text>The White Rabbit</text></navLabel>
        <content src="text/ch01.xhtml#section-1"/>
      </navPoint>
      <navPoint id="nav1-sub2" playOrder="3">
        <navLabel><text>The Hall of Doors</text></navLabel>
        <content src="text/ch01.xhtml#section-2"/>
      </navPoint>
    </navPoint>
    <navPoint id="nav2" playOrder="4">
      <navLabel><text>Chapter II: The Pool of Tears</text></navLabel>
      <content src="text/ch02.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`;
  zip.file('OEBPS/toc.ncx', tocNcx);

  // 7. Chapters
  const ch01 = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Chapter I</title></head>
<body>
  <h1>Chapter I. Down the Rabbit-Hole</h1>
  <div id="section-1">
    <p>Alice was beginning to get very tired of sitting by her sister on the bank...</p>
  </div>
  <div id="section-2">
    <p>Down, down, down. Would the fall never come to an end?</p>
  </div>
</body>
</html>`;
  zip.file('OEBPS/text/ch01.xhtml', ch01);

  const ch02 = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Chapter II</title></head>
<body>
  <h1>Chapter II. The Pool of Tears</h1>
  <p>“Curiouser and curiouser!” cried Alice...</p>
</body>
</html>`;
  zip.file('OEBPS/text/ch02.xhtml', ch02);

  return await zip.generateAsync({ type: 'arraybuffer' });
}

/**
 * Generates a synthetic Zip-Slip attack archive containing traversal payloads
 */
export async function generateZipSlipAttackArchive(): Promise<ArrayBuffer> {
  const zip = new JSZip();

  // Benign entry
  zip.file('mimetype', 'application/epub+zip');
  zip.file('META-INF/container.xml', '<container/>');

  // Zip-Slip attack entries
  zip.file('../../etc/passwd', 'root:x:0:0:root:/root:/bin/bash');
  zip.file('..\\..\\windows\\system32\\malicious_payload.dll', 'MALICIOUS_BINARY_MOCK');
  zip.file('OEBPS/../../../var/log/escaped.txt', 'TRAVERSAL_BREACH_DETECTED');

  return await zip.generateAsync({ type: 'arraybuffer' });
}
