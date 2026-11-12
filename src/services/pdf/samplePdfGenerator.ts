/**
 * Lumina Reader - Sample PDF Document Generator
 * Generates an in-memory, standards-compliant multi-page PDF document
 * with academic typography, vector charts, diagrams, and hierarchical outlines (TOC bookmarks).
 */

export function generateSamplePdf(): ArrayBuffer {
  // Build a valid 4-page scientific research paper PDF 1.4
  const objects: string[] = [];

  function addObject(content: string): number {
    objects.push(content);
    return objects.length; // 1-based object number
  }

  // 1. Catalog (will be updated with outlines & pages)
  const catalogObjNum = addObject('<< /Type /Catalog /Pages 2 0 R /Outlines 3 0 R >>');
  // 2. Pages root (will be updated with kids)
  const pagesObjNum = 2; // placeholder
  // 3. Outlines root
  const outlinesObjNum = 3; // placeholder

  // Page 1 Content
  const p1Stream = `
q
0.05 0.08 0.15 rg 50 740 512 36 re f
1 1 1 rg /F1 16 Tf 65 752 Td (QUANTUM HORIZONS: FIXED-LAYOUT ARCHITECTURE) Tj ET
0.2 0.4 0.8 rg /F1 11 Tf 50 715 Td (Dr. Elena Rostova & Dr. Marcus Vance  |  Quantum Computing Laboratory, Geneva) Tj ET
0.4 0.4 0.45 rg /F2 9 Tf 50 700 Td (Published: October 2026  *  Lumina Universal Reading Suite Research Series) Tj ET

0.85 0.85 0.9 rg 50 620 512 65 re f
0.1 0.15 0.2 rg /F1 11 Tf 65 665 Td (ABSTRACT) Tj ET
0.2 0.25 0.3 rg /F2 9.5 Tf 65 648 Td (Fixed-layout document rendering demands millisecond response times and rigorous) Tj ET
0.2 0.25 0.3 rg /F2 9.5 Tf 65 634 Td (memory bounding. This paper introduces a virtualized canvas streaming pipeline) Tj ET
0.2 0.25 0.3 rg /F2 9.5 Tf 65 620 Td (synchronizing hardware-accelerated rasterization with an invisible text layer.) Tj ET

0.1 0.1 0.1 rg /F1 13 Tf 50 580 Td (1. Introduction and Architectural Motivation) Tj ET
0.25 0.25 0.3 rg /F2 10 Tf 50 558 Td (Digital reading suites must handle diverse formats without memory fragmentation.) Tj ET
0.25 0.25 0.3 rg /F2 10 Tf 50 542 Td (While reflowable formats like EPUB adapt dynamically to font scaling, fixed-layout) Tj ET
0.25 0.25 0.3 rg /F2 10 Tf 50 526 Td (documents such as PDF and DjVu preserve pixel-perfect academic typesetting.) Tj ET
0.25 0.25 0.3 rg /F2 10 Tf 50 510 Td (To maintain performance under 60 MB RAM, off-screen canvases are discarded) Tj ET
0.25 0.25 0.3 rg /F2 10 Tf 50 494 Td (and dynamically regenerated on demand with HiDPI Retina subpixel precision.) Tj ET

0.15 0.3 0.6 rg 50 340 512 120 re S
0.95 0.97 1.0 rg 51 341 510 118 re f
0.1 0.2 0.5 rg /F1 10 Tf 65 435 Td (Figure 1: Hybrid Dual-Layer Document Normalization Pipeline) Tj ET
0.2 0.4 0.8 rg 70 370 120 40 re f
1 1 1 rg /F1 9 Tf 85 392 Td (Binary Stream) Tj ET
1 1 1 rg /F2 8 Tf 82 380 Td (PDF / DJVU / Scan) Tj ET

0.7 0.2 0.5 rg 240 370 140 40 re f
1 1 1 rg /F1 9 Tf 252 392 Td (Virtualized Canvas) Tj ET
1 1 1 rg /F2 8 Tf 248 380 Td (RenderTask Worker) Tj ET

0.1 0.6 0.4 rg 420 370 120 40 re f
1 1 1 rg /F1 9 Tf 435 392 Td (Sync Text Layer) Tj ET
1 1 1 rg /F2 8 Tf 432 380 Td (Selection / Search) Tj ET

0.3 0.3 0.3 rg 192 390 m 238 390 l S
0.3 0.3 0.3 rg 382 390 m 418 390 l S

0.25 0.25 0.3 rg /F2 9 Tf 50 290 Td (Our tests confirm that asynchronous canvas decoding with cancellation guards) Tj ET
0.25 0.25 0.3 rg /F2 9 Tf 50 274 Td (prevents UI thread starvation during rapid viewport pan and zoom gestures.) Tj ET
0.5 0.5 0.5 rg /F2 8 Tf 260 40 Td (- Page 1 of 4 -) Tj ET
Q
`.trim();

  // Page 2 Content
  const p2Stream = `
q
0.05 0.08 0.15 rg 50 750 512 24 re f
1 1 1 rg /F1 10 Tf 60 758 Td (QUANTUM HORIZONS  *  MATHEMATICAL FOUNDATIONS & BENCHMARKS) Tj ET

0.1 0.1 0.1 rg /F1 13 Tf 50 710 Td (2. Mathematical Models for Subpixel Transform) Tj ET
0.25 0.25 0.3 rg /F2 10 Tf 50 690 Td (Let S be the current viewport scaling factor and D be devicePixelRatio.) Tj ET
0.25 0.25 0.3 rg /F2 10 Tf 50 674 Td (The backing store canvas buffer dimension B is governed by:) Tj ET

0.92 0.94 0.98 rg 70 610 470 45 re f
0.1 0.2 0.5 rg 70 610 470 45 re S
0.05 0.15 0.35 rg /F1 11 Tf 90 635 Td (W_canvas = floor(W_pt * S * D),   H_canvas = floor(H_pt * S * D)) Tj ET
0.3 0.3 0.3 rg /F2 9 Tf 90 620 Td (Where pt denotes standard 72 DPI PDF typographic user units.) Tj ET

0.1 0.1 0.1 rg /F1 13 Tf 50 570 Td (3. Memory Consumption Benchmarks) Tj ET
0.25 0.25 0.3 rg /F2 10 Tf 50 550 Td (We evaluated 500-page academic documents under full continuous scroll:) Tj ET

0.2 0.2 0.2 rg 70 340 470 180 re S
0.98 0.98 0.99 rg 71 341 468 178 re f
0.1 0.1 0.1 rg /F1 10 Tf 85 495 Td (Memory Footprint (MB) vs Document Page Count) Tj ET

0.8 0.8 0.8 rg 110 370 m 510 370 l S
0.8 0.8 0.8 rg 110 410 m 510 410 l S
0.8 0.8 0.8 rg 110 450 m 510 450 l S

0.5 0.5 0.5 rg /F2 8 Tf 80 367 Td (0 MB) Tj ET
0.5 0.5 0.5 rg /F2 8 Tf 75 407 Td (50 MB) Tj ET
0.5 0.5 0.5 rg /F2 8 Tf 70 447 Td (100 MB) Tj ET

0.9 0.3 0.3 rg 140 370 45 42 re f
0.9 0.3 0.3 rg 230 370 45 80 re f
0.9 0.3 0.3 rg 320 370 45 110 re f
0.2 0.7 0.4 rg 190 370 35 15 re f
0.2 0.7 0.4 rg 280 370 35 18 re f
0.2 0.7 0.4 rg 370 370 35 20 re f

0.2 0.2 0.2 rg /F2 8 Tf 145 355 Td (50 Pages) Tj ET
0.2 0.2 0.2 rg /F2 8 Tf 235 355 Td (200 Pages) Tj ET
0.2 0.2 0.2 rg /F2 8 Tf 325 355 Td (500 Pages) Tj ET

0.9 0.3 0.3 rg 420 495 12 8 re f
0.2 0.2 0.2 rg /F2 8 Tf 436 496 Td (Naive Reader (No GC)) Tj ET
0.2 0.7 0.4 rg 420 480 12 8 re f
0.2 0.2 0.2 rg /F2 8 Tf 436 481 Td (Lumina Fixed Studio) Tj ET

0.25 0.25 0.3 rg /F2 9.5 Tf 50 300 Td (The Lumina Fixed Studio architecture stabilizes memory under 35 MB consistently,) Tj ET
0.25 0.25 0.3 rg /F2 9.5 Tf 50 284 Td (achieving full garbage collection of discarded off-screen canvas pixmaps.) Tj ET
0.5 0.5 0.5 rg /F2 8 Tf 260 40 Td (- Page 2 of 4 -) Tj ET
Q
`.trim();

  // Page 3 Content
  const p3Stream = `
q
0.05 0.08 0.15 rg 50 750 512 24 re f
1 1 1 rg /F1 10 Tf 60 758 Td (QUANTUM HORIZONS  *  TEXT SELECTION & CANVAS SYNCHRONIZATION) Tj ET

0.1 0.1 0.1 rg /F1 13 Tf 50 710 Td (4. Synchronized Text Selection Layer) Tj ET
0.25 0.25 0.3 rg /F2 10 Tf 50 690 Td (Canvas elements are purely graphical raster arrays lacking native DOM selection.) Tj ET
0.25 0.25 0.3 rg /F2 10 Tf 50 674 Td (To provide fluent cursor highlighting, copy-paste, and keyboard accessibility,) Tj ET
0.25 0.25 0.3 rg /F2 10 Tf 50 658 Td (an invisible text layer matches the exact bounding geometry of glyph runs.) Tj ET

0.1 0.12 0.16 rg 50 490 512 145 re f
0.2 0.7 0.9 rg /F1 9 Tf 65 615 Td (// Text Layer Coordinate Mapping Function) Tj ET
0.8 0.9 1.0 rg /F3 8.5 Tf 65 595 Td (export function applyTextLayerTransform(viewport: PageViewport) {) Tj ET
0.8 0.9 1.0 rg /F3 8.5 Tf 80 580 Td (  const textDiv = document.createElement('div');) Tj ET
0.8 0.9 1.0 rg /F3 8.5 Tf 80 565 Td (  textDiv.className = 'textLayer lumina-text-overlay';) Tj ET
0.8 0.9 1.0 rg /F3 8.5 Tf 80 550 Td (  textDiv.style.width = \`\${viewport.width}px\`;) Tj ET
0.8 0.9 1.0 rg /F3 8.5 Tf 80 535 Td (  textDiv.style.height = \`\${viewport.height}px\`;) Tj ET
0.8 0.9 1.0 rg /F3 8.5 Tf 80 520 Td (  renderTextLayer({ textContent, container: textDiv, viewport });) Tj ET
0.8 0.9 1.0 rg /F3 8.5 Tf 65 505 Td (}) Tj ET

0.1 0.1 0.1 rg /F1 13 Tf 50 450 Td (4.1 DjVu Wavelet Document Compatibility) Tj ET
0.25 0.25 0.3 rg /F2 10 Tf 50 430 Td (DjVu utilizes IW44 wavelet compression for scans, achieving 5-10x smaller sizes) Tj ET
0.25 0.25 0.3 rg /F2 10 Tf 50 414 Td (than JPEG for high-resolution academic manuscripts. Through our WebAssembly) Tj ET
0.25 0.25 0.3 rg /F2 10 Tf 50 398 Td (bridge, DjVu bitmaps stream directly to HTML5 2D canvas context pixmaps.) Tj ET

0.85 0.95 0.9 rg 50 320 512 55 re f
0.1 0.4 0.2 rg 50 320 512 55 re S
0.1 0.3 0.15 rg /F1 10 Tf 65 355 Td (Key Feature: Multi-Format Seamless Normalization) Tj ET
0.2 0.3 0.25 rg /F2 9 Tf 65 338 Td (Whether opening a modern vector PDF or a 19th-century scanned DjVu monograph,) Tj ET
0.2 0.3 0.25 rg /F2 9 Tf 65 326 Td (Lumina applies the identical zoom, thumbnail rail, and bookmarking ergonomics.) Tj ET

0.5 0.5 0.5 rg /F2 8 Tf 260 40 Td (- Page 3 of 4 -) Tj ET
Q
`.trim();

  // Page 4 Content
  const p4Stream = `
q
0.05 0.08 0.15 rg 50 750 512 24 re f
1 1 1 rg /F1 10 Tf 60 758 Td (QUANTUM HORIZONS  *  CONCLUSIONS & REFERENCES) Tj ET

0.1 0.1 0.1 rg /F1 13 Tf 50 710 Td (5. Conclusion) Tj ET
0.25 0.25 0.3 rg /F2 10 Tf 50 690 Td (The Lumina Fixed-Layout Studio establishes a novel benchmark for client-side) Tj ET
0.25 0.25 0.3 rg /F2 10 Tf 50 674 Td (document performance. Combining strict single-bar chrome with virtualized) Tj ET
0.25 0.25 0.3 rg /F2 10 Tf 50 658 Td (canvas page caching, the studio renders high-resolution pages in sub-16ms) Tj ET
0.25 0.25 0.3 rg /F2 10 Tf 50 642 Td (frames while maintaining 100% offline privacy and zero telemetry.) Tj ET

0.1 0.1 0.1 rg /F1 12 Tf 50 600 Td (References) Tj ET
0.3 0.3 0.3 rg /F2 8.5 Tf 50 580 Td ([1] Adobe Systems Incorporated, 'Document Management - Portable Document Format', ISO 32000-1, 2008.) Tj ET
0.3 0.3 0.3 rg /F2 8.5 Tf 50 564 Td ([2] Bottou, L. et al., 'High Quality Document Image Compression with DjVu', IEEE TIP, 1998.) Tj ET
0.3 0.3 0.3 rg /F2 8.5 Tf 50 548 Td ([3] Mozilla Foundation, 'PDF.js: A General-Purpose, Web Standards-based Platform for Parsing PDFs', 2024.) Tj ET
0.3 0.3 0.3 rg /F2 8.5 Tf 50 532 Td ([4] W3C, 'EPUB Canonical Fragment Identifiers (epubcfi) 1.1 Specification', 2023.) Tj ET
0.3 0.3 0.3 rg /F2 8.5 Tf 50 516 Td ([5] Rostova, E., 'Subpixel Canvas Scaling and Retina Memory Bound Allocations', ACM Trans., 2025.) Tj ET
0.3 0.3 0.3 rg /F2 8.5 Tf 50 500 Td ([6] Vance, M., 'Continuous Vertical Virtualization for Fixed Aspect Scans', J. Digital Lib., 2026.) Tj ET

0.95 0.95 0.95 rg 50 360 512 90 re f
0.8 0.8 0.8 rg 50 360 512 90 re S
0.1 0.1 0.1 rg /F1 10 Tf 65 430 Td (Research Lab Certification & Integrity Verification) Tj ET
0.3 0.3 0.3 rg /F2 8.5 Tf 65 412 Td (This electronic document has been compiled directly via the Lumina Reader Engine.) Tj ET
0.3 0.3 0.3 rg /F2 8.5 Tf 65 396 Td (Digital Signature: SHA-256 [A4F92C81-99B7-402E-BD83-7B1A5C0E289F]) Tj ET
0.3 0.3 0.3 rg /F2 8.5 Tf 65 380 Td (Universal Reading Suite -- Clean Architectural Standards Adherence Guaranteed.) Tj ET

0.5 0.5 0.5 rg /F2 8 Tf 260 40 Td (- Page 4 of 4 -) Tj ET
Q
`.trim();

  // Define fonts
  const fontHelvetica = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const fontRegular = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const fontMono = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');

  const fontDict = `<< /F1 ${fontHelvetica} 0 R /F2 ${fontRegular} 0 R /F3 ${fontMono} 0 R >>`;

  // Streams
  const p1StreamObj = addObject(`<< /Length ${p1Stream.length} >>\nstream\n${p1Stream}\nendstream`);
  const p2StreamObj = addObject(`<< /Length ${p2Stream.length} >>\nstream\n${p2Stream}\nendstream`);
  const p3StreamObj = addObject(`<< /Length ${p3Stream.length} >>\nstream\n${p3Stream}\nendstream`);
  const p4StreamObj = addObject(`<< /Length ${p4Stream.length} >>\nstream\n${p4Stream}\nendstream`);

  // Page Objects (US Letter: 612 x 792 pt)
  const p1Obj = addObject(`<< /Type /Page /Parent ${pagesObjNum} 0 R /MediaBox [0 0 612 792] /Resources << /Font ${fontDict} >> /Contents ${p1StreamObj} 0 R >>`);
  const p2Obj = addObject(`<< /Type /Page /Parent ${pagesObjNum} 0 R /MediaBox [0 0 612 792] /Resources << /Font ${fontDict} >> /Contents ${p2StreamObj} 0 R >>`);
  const p3Obj = addObject(`<< /Type /Page /Parent ${pagesObjNum} 0 R /MediaBox [0 0 612 792] /Resources << /Font ${fontDict} >> /Contents ${p3StreamObj} 0 R >>`);
  const p4Obj = addObject(`<< /Type /Page /Parent ${pagesObjNum} 0 R /MediaBox [0 0 612 792] /Resources << /Font ${fontDict} >> /Contents ${p4StreamObj} 0 R >>`);

  // Pages Root Object (replace placeholder at index 1)
  objects[pagesObjNum - 1] = `<< /Type /Pages /Kids [${p1Obj} 0 R ${p2Obj} 0 R ${p3Obj} 0 R ${p4Obj} 0 R] /Count 4 >>`;

  // Outlines Bookmarks Linked List
  const outline1 = addObject(`<< /Title (1. Abstract & Introduction) /Parent ${outlinesObjNum} 0 R /Next ${outlinesObjNum + 2} 0 R /Dest [${p1Obj} 0 R /Fit] >>`);
  const outline2 = addObject(`<< /Title (2. Mathematical Foundations) /Parent ${outlinesObjNum} 0 R /Prev ${outline1} 0 R /Next ${outlinesObjNum + 3} 0 R /Dest [${p2Obj} 0 R /Fit] >>`);
  const outline3 = addObject(`<< /Title (3. Virtualized Memory Benchmarks) /Parent ${outlinesObjNum} 0 R /Prev ${outline2} 0 R /Next ${outlinesObjNum + 4} 0 R /Dest [${p2Obj} 0 R /Fit] >>`);
  const outline4 = addObject(`<< /Title (4. Canvas & Text Layer Sync) /Parent ${outlinesObjNum} 0 R /Prev ${outline3} 0 R /Next ${outlinesObjNum + 5} 0 R /Dest [${p3Obj} 0 R /Fit] >>`);
  const outline5 = addObject(`<< /Title (5. Conclusions & References) /Parent ${outlinesObjNum} 0 R /Prev ${outline4} 0 R /Dest [${p4Obj} 0 R /Fit] >>`);

  // Outlines Root Object (replace placeholder at index 2)
  objects[outlinesObjNum - 1] = `<< /Type /Outlines /First ${outline1} 0 R /Last ${outline5} 0 R /Count 5 >>`;

  // Info Metadata Object
  const infoObj = addObject(`<<
    /Title (Quantum Horizons: Fixed-Layout Document Architecture)
    /Author (Dr. Elena Rostova & Dr. Marcus Vance)
    /Subject (Research Paper on High-Performance Document Rendering)
    /Keywords (PDF, DjVu, Fixed-Layout, Virtualized Canvas, Lumina)
    /Creator (Lumina Fixed-Layout Studio)
    /Producer (Lumina Reader Engine 2.0)
    /CreationDate (D:20261026120000Z)
  >>`);

  // Assemble full PDF binary
  let body = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(body.length);
    body += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const startxref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

  for (let i = 1; i <= objects.length; i++) {
    body += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  body += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObjNum} 0 R /Info ${infoObj} 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  const buffer = new ArrayBuffer(body.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < body.length; i++) {
    view[i] = body.charCodeAt(i);
  }

  return buffer;
}
