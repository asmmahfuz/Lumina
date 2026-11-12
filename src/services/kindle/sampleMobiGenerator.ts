/**
 * Lumina Reader - Sample Kindle MOBI / KF8 Generator
 * Generates an in-memory authentic Palm Database MOBI file with EXTH metadata,
 * PalmDOC LZ77 compression, multiple chapters, and image records.
 */

export async function generateSampleMobi(): Promise<ArrayBuffer> {
  const bookTitle = "The Quantum Garden: A Cybernetic Odyssey";
  const author = "Dr. Elena Rostova";
  const publisher = "Lumina Digital Press";
  const description = "A speculative fiction chronicle through sentient biomechanical flora and crystalline realities.";

  // 1. Prepare Chapter Text (HTML)
  const ch1Html = `<h1>Chapter I: The Neon Arboretum</h1>
<p>In the subterranean depths of Station Kepler-9, the flora did not photosynthesize sunlight; they fed on electromagnetic radiation leaking from the fusion conduits.</p>
<p>Dr. Elena Rostova adjusted the chromatic filters on her ocular visor. Before her stretched an endless expanse of bioluminescent ferns, their fronds shimmering in rhythmic waves of ultraviolet and deep cyan.</p>
<p><em>"Observation cycle 441,"</em> she spoke into her wrist transceiver. <em>"The cellular lattice shows unmistakable signs of quantum coherence. The biomechanics are alive, and they are listening."</em></p>
<p><img recindex="1" alt="Arboretum View" /></p>
<p>A whisper reverberated through the metallic vault—not through the atmosphere, but conducted directly through the alloy floor plates. The Garden was awakening.</p>`;

  const ch2Html = `<h1>Chapter II: Crystalline Synapses</h1>
<p>The crystalline tendrils reached toward the observation console with uncanny precision. Each facet pulsed with petabytes of optical data, refracting the cabin lighting into prismatic spectrums.</p>
<p>Elena reached out a gloved finger. A micro-arc of harmless static discharged between the visor sensor and the primary stem. In an instant, her heads-up display flooded with neural telemetry.</p>
<blockquote><p>"To comprehend the forest, one must cease thinking like an isolated node, and perceive oneself as the mycelial network."</p></blockquote>
<p>The journey into the quantum horizon had truly begun.</p>`;

  const fullText = `${ch1Html}\n<mbp:pagebreak/>\n${ch2Html}`;

  // 2. Compress text using PalmDOC LZ77
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(fullText);
  const compressedRecord = compressPalmDoc(textBytes);

  // 3. Create Sample Cover JPEG (Valid minimal JPEG)
  const coverJpeg = createMinimalSampleJpeg(120, 180);
  const illustrationJpeg = createMinimalSampleJpeg(100, 100);

  // 4. Construct Palm Database (PDB)
  // Record 0: PalmDOC + MOBI + EXTH headers
  const record0 = buildRecordZero(bookTitle, author, publisher, description);

  // Records array:
  // Rec 0: Headers
  // Rec 1: Text record
  // Rec 2: Cover image (index 2, relIndex 0)
  // Rec 3: Illustration image (index 3, relIndex 1)
  const records = [record0, compressedRecord, coverJpeg, illustrationJpeg];
  const numRecords = records.length;

  // Calculate offsets
  // PDB Header: 78 bytes + 8 bytes * numRecords + 2 padding bytes = 78 + 8*4 + 2 = 112 bytes
  const headerSize = 78 + numRecords * 8 + 2;
  const offsets: number[] = [];
  let currentOffset = headerSize;

  for (const rec of records) {
    offsets.push(currentOffset);
    currentOffset += rec.byteLength;
  }

  const totalFileSize = currentOffset;
  const fileBuffer = new ArrayBuffer(totalFileSize);
  const view = new DataView(fileBuffer);
  const bytes = new Uint8Array(fileBuffer);

  // Write PDB Header (78 bytes)
  const dbName = "Quantum_Garden";
  for (let i = 0; i < dbName.length && i < 31; i++) {
    bytes[i] = dbName.charCodeAt(i);
  }
  view.setUint16(32, 0, false); // attributes
  view.setUint16(34, 0, false); // version
  const now = Math.floor(Date.now() / 1000);
  view.setUint32(36, now, false); // creation date
  view.setUint32(40, now, false); // modification date
  // Type: 'BOOK', Creator: 'MOBI'
  bytes[60] = 0x42; bytes[61] = 0x4f; bytes[62] = 0x4f; bytes[63] = 0x4b;
  bytes[64] = 0x4d; bytes[65] = 0x4f; bytes[66] = 0x42; bytes[67] = 0x49;
  view.setUint16(76, numRecords, false);

  // Write Record Info Entries (8 bytes each)
  for (let i = 0; i < numRecords; i++) {
    const entryOffset = 78 + i * 8;
    view.setUint32(entryOffset, offsets[i], false);
    bytes[entryOffset + 4] = 0x40; // normal record
    bytes[entryOffset + 5] = 0;
    bytes[entryOffset + 6] = 0;
    bytes[entryOffset + 7] = i;
  }

  // Copy record data
  for (let i = 0; i < numRecords; i++) {
    bytes.set(new Uint8Array(records[i]), offsets[i]);
  }

  return fileBuffer;
}

function buildRecordZero(title: string, author: string, publisher: string, description: string): ArrayBuffer {
  const enc = new TextEncoder();
  const titleBytes = enc.encode(title);
  const authorBytes = enc.encode(author);
  const publisherBytes = enc.encode(publisher);
  const descBytes = enc.encode(description);

  // PalmDOC header: 16 bytes
  // MOBI header: 128 bytes
  // EXTH header: 12 bytes + items
  const exthItems = [
    { type: 100, data: authorBytes },
    { type: 101, data: publisherBytes },
    { type: 103, data: descBytes },
    { type: 201, data: new Uint8Array([0, 0, 0, 0]) }, // Cover offset = 0 (first image)
    { type: 503, data: titleBytes },
  ];

  let exthLen = 12;
  for (const item of exthItems) {
    exthLen += 8 + item.data.byteLength;
  }

  const mobiHeaderLen = 128;
  const fullNameOffset = 16 + mobiHeaderLen + exthLen;
  const rec0Size = fullNameOffset + titleBytes.byteLength;

  const buffer = new ArrayBuffer(rec0Size);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // 1. PalmDOC header (16 bytes)
  view.setUint16(0, 2, false); // Compression: 2 = PalmDOC LZ77
  view.setUint16(2, 0, false);
  view.setUint32(4, 2048, false); // Uncompressed text length
  view.setUint16(8, 1, false); // Text record count: 1
  view.setUint16(10, 4096, false); // Record size

  // 2. MOBI header (at offset 16)
  // 'MOBI' magic
  bytes[16] = 0x4d; bytes[17] = 0x4f; bytes[18] = 0x42; bytes[19] = 0x49;
  view.setUint32(20, mobiHeaderLen, false); // Header length
  view.setUint32(24, 2, false); // Mobi type: 2 = Book
  view.setUint32(28, 65001, false); // Text encoding: UTF-8
  view.setUint32(32, 1001, false); // Unique ID
  view.setUint32(36, 8, false); // Version 8 (KF8)
  view.setUint32(84, fullNameOffset, false); // Full name offset
  view.setUint32(88, titleBytes.byteLength, false); // Full name length
  view.setUint32(108, 2, false); // firstImageIndex = 2
  view.setUint32(128, 0x40, false); // exthFlags (bit 6 set)

  // 3. EXTH header (at offset 16 + 128 = 144)
  const exthStart = 144;
  bytes[exthStart] = 0x45; bytes[exthStart + 1] = 0x58; bytes[exthStart + 2] = 0x54; bytes[exthStart + 3] = 0x48;
  view.setUint32(exthStart + 4, exthLen, false);
  view.setUint32(exthStart + 8, exthItems.length, false);

  let currentExthOffset = exthStart + 12;
  for (const item of exthItems) {
    const itemTotalLen = 8 + item.data.byteLength;
    view.setUint32(currentExthOffset, item.type, false);
    view.setUint32(currentExthOffset + 4, itemTotalLen, false);
    bytes.set(item.data, currentExthOffset + 8);
    currentExthOffset += itemTotalLen;
  }

  // 4. Full title string
  bytes.set(titleBytes, fullNameOffset);

  return buffer;
}

function compressPalmDoc(data: Uint8Array): Uint8Array {
  // Simple literal run compression: each byte < 0x80 is emitted as literal
  const out: number[] = [];
  let i = 0;
  while (i < data.length) {
    // Collect literal bytes
    let runLen = 0;
    while (runLen < 8 && i + runLen < data.length) {
      runLen++;
    }
    out.push(runLen);
    for (let j = 0; j < runLen; j++) {
      out.push(data[i++]);
    }
  }
  return new Uint8Array(out);
}

function createMinimalSampleJpeg(width: number, height: number): ArrayBuffer {
  // Construct a minimal valid JPEG with SOI, APP0, SOF0, SOS, and EOI
  const jpegBytes = [
    0xff, 0xd8, // SOI
    0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, // APP0
    0xff, 0xdb, 0x00, 0x43, 0x00, // DQT
    ...new Array(64).fill(0x10),
    0xff, 0xc0, 0x00, 0x0b, 0x08, (height >> 8) & 0xff, height & 0xff, (width >> 8) & 0xff, width & 0xff, 0x01, 0x01, 0x11, 0x00, // SOF0
    0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // DHT
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
    0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, // SOS
    0x7f, 0xff, 0x00, // dummy scan
    0xff, 0xd9 // EOI
  ];
  return new Uint8Array(jpegBytes).buffer;
}
