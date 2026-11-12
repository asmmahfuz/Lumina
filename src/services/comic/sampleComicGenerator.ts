/**
 * Lumina Reader - Sample Manga & Comic Book Generator
 * Generates an in-memory CBZ (Zip) archive containing 6 high-fidelity Japanese cyberpunk manga pages
 * complete with panels, Japanese sound effects, dialogue bubbles, and ComicInfo.xml metadata.
 */

import JSZip from 'jszip';

function createSvgPage(
  pageNumber: number,
  title: string,
  japaneseTitle: string,
  panelContents: string
): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1200" width="800" height="1200">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a14"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#050508"/>
    </linearGradient>
    <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#818cf8"/>
    </linearGradient>
    <linearGradient id="neonPink" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f43f5e"/>
      <stop offset="100%" stop-color="#fb7185"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="0.75" stroke-opacity="0.6"/>
    </pattern>
  </defs>

  <!-- Page Background -->
  <rect width="800" height="1200" fill="url(#bgGrad)"/>
  <rect width="800" height="1200" fill="url(#grid)"/>

  <!-- Comic Header Rail -->
  <rect x="40" y="30" width="720" height="32" rx="4" fill="#1e293b" fill-opacity="0.5" stroke="#334155" stroke-width="1"/>
  <text x="60" y="51" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12" font-weight="600" letter-spacing="1">NEON VALKYRIE • CHAPTER 01</text>
  <text x="740" y="51" text-anchor="end" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="12" font-weight="700">PAGE ${pageNumber} / 06</text>

  <!-- Comic Page Panels -->
  ${panelContents}

  <!-- Page Footer -->
  <text x="400" y="1170" text-anchor="middle" fill="#64748b" font-family="system-ui, sans-serif" font-size="11" letter-spacing="2">
    ${title} • ${japaneseTitle} • LUMINA MANGA SUITE
  </text>
</svg>`;
}

export async function generateSampleComic(): Promise<ArrayBuffer> {
  const zip = new JSZip();

  // Page 1: Cover Page
  const coverSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1200" width="800" height="1200">
  <defs>
    <linearGradient id="cGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="60%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </linearGradient>
    <linearGradient id="neonTitle" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="50%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
  </defs>
  <rect width="800" height="1200" fill="url(#cGrad)"/>

  <!-- Cover Cyber Matrix -->
  <circle cx="400" cy="500" r="280" fill="none" stroke="#38bdf8" stroke-width="2" stroke-opacity="0.3" stroke-dasharray="8 8"/>
  <circle cx="400" cy="500" r="220" fill="none" stroke="#ec4899" stroke-width="1.5" stroke-opacity="0.4"/>
  <polygon points="400,280 590,610 210,610" fill="none" stroke="#a855f7" stroke-width="2" stroke-opacity="0.5"/>

  <!-- Central Silhouette Graphic -->
  <path d="M 400 340 L 460 480 L 430 480 L 480 620 L 415 620 L 440 760 L 340 560 L 380 560 L 330 440 L 385 440 Z" fill="#38bdf8" fill-opacity="0.85"/>

  <!-- Japanese Kanji Banner -->
  <text x="400" y="190" text-anchor="middle" fill="#ec4899" font-family="'Noto Sans JP', sans-serif" font-size="28" font-weight="900" letter-spacing="8">ネオン・ワルキューレ</text>

  <!-- Title & Issue -->
  <text x="400" y="250" text-anchor="middle" fill="url(#neonTitle)" font-family="system-ui, sans-serif" font-size="54" font-weight="900" letter-spacing="3">NEON VALKYRIE</text>
  <text x="400" y="290" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="16" font-weight="600" letter-spacing="4">ACT 1: THE CYBER SPARK</text>

  <!-- Badge Pill -->
  <rect x="330" y="860" width="140" height="34" rx="17" fill="#ec4899" fill-opacity="0.2" stroke="#ec4899" stroke-width="1.5"/>
  <text x="400" y="882" text-anchor="middle" fill="#f43f5e" font-family="system-ui, sans-serif" font-size="13" font-weight="800" letter-spacing="2">ISSUE #01</text>

  <!-- Credits -->
  <text x="400" y="960" text-anchor="middle" fill="#e2e8f0" font-family="system-ui, sans-serif" font-size="18" font-weight="700">STORY BY KENJI TAKAHASHI</text>
  <text x="400" y="990" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="15" font-weight="500">ART BY AOI SORA</text>
  <text x="400" y="1080" text-anchor="middle" fill="#64748b" font-family="system-ui, sans-serif" font-size="12" letter-spacing="3">RTL MANGA SPREAD • LUMINA COMIC ENGINE</text>
</svg>`;

  // Page 2: Neo-Tokyo Skyline (RTL Right Page)
  const page2Svg = createSvgPage(
    2,
    'THE DIGITAL HORIZON',
    '電脳の夜明け',
    `<!-- Top Panel: Skyline -->
    <rect x="40" y="80" width="720" height="420" rx="8" fill="#0f172a" stroke="#334155" stroke-width="2"/>
    <path d="M 40 420 L 140 280 L 220 340 L 320 220 L 400 300 L 520 180 L 620 260 L 760 190 L 760 500 L 40 500 Z" fill="#1e293b"/>
    <text x="80" y="140" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="32" font-weight="900">NEO-TOKYO 2088</text>
    <text x="80" y="175" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="15">The neural firewall grid had stood impenetrable for half a century.</text>

    <!-- Japanese Sound Effect: ZUUUU -->
    <text x="640" y="340" fill="#f43f5e" font-family="'Noto Sans JP', sans-serif" font-size="52" font-weight="900" transform="rotate(-12 640 340)" opacity="0.85">ズゥゥ</text>

    <!-- Lower Panel Left: Heroine Silhouette -->
    <rect x="40" y="520" width="350" height="580" rx="8" fill="#111827" stroke="#334155" stroke-width="2"/>
    <circle cx="215" cy="740" r="90" fill="#38bdf8" fill-opacity="0.15"/>
    <path d="M 215 650 L 245 740 L 215 820 L 185 740 Z" fill="#38bdf8"/>
    <!-- Speech Bubble -->
    <rect x="70" y="550" width="290" height="100" rx="12" fill="#f8fafc" stroke="#0f172a" stroke-width="2"/>
    <text x="90" y="585" fill="#0f172a" font-family="system-ui, sans-serif" font-size="14" font-weight="700">"The code sequence... it matches</text>
    <text x="90" y="610" fill="#0f172a" font-family="system-ui, sans-serif" font-size="14" font-weight="700">the ancient Lumina Reader cipher!"</text>

    <!-- Lower Panel Right: Terminal Stream -->
    <rect x="410" y="520" width="350" height="580" rx="8" fill="#090d16" stroke="#38bdf8" stroke-width="2"/>
    <text x="440" y="570" fill="#38bdf8" font-family="'JetBrains Mono', monospace" font-size="14">> PROTOCOL: PHASE 9 INITIALIZED</text>
    <text x="440" y="600" fill="#22c55e" font-family="'JetBrains Mono', monospace" font-size="13">> DECOMPRESSING CBZ ARCHIVE...</text>
    <text x="440" y="630" fill="#a855f7" font-family="'JetBrains Mono', monospace" font-size="13">> MOUNTING RTL SPREAD ENGINE [OK]</text>
    <text x="440" y="660" fill="#f43f5e" font-family="'JetBrains Mono', monospace" font-size="13">> ZIP-SLIP DEFENSE: ACTIVE</text>
    <text x="440" y="690" fill="#94a3b8" font-family="'JetBrains Mono', monospace" font-size="12">> 0 TELEMETRY PACKETS TRANSMITTED</text>
    <text x="580" y="920" fill="#f43f5e" font-family="'Noto Sans JP', sans-serif" font-size="64" font-weight="900" transform="rotate(8 580 920)">ドドド</text>`
  );

  // Page 3: Dual Spread Match - Action Sequence
  const page3Svg = createSvgPage(
    3,
    'CYBER BLADE ENGAGED',
    'サイバーブレード',
    `<!-- Dynamic Diagonal Slash Panel -->
    <polygon points="40,80 760,140 760,600 40,520" fill="#18181b" stroke="#f43f5e" stroke-width="3"/>
    <line x1="50" y1="580" x2="750" y2="100" stroke="#f43f5e" stroke-width="6" stroke-linecap="round"/>
    <text x="80" y="240" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="44" font-weight="900" letter-spacing="2">SHINGGG!</text>
    <text x="480" y="380" fill="#f43f5e" font-family="'Noto Sans JP', sans-serif" font-size="80" font-weight="900">バッ!!</text>

    <!-- Lower Split Panels -->
    <rect x="40" y="620" width="720" height="480" rx="8" fill="#0f172a" stroke="#334155" stroke-width="2"/>
    <circle cx="400" cy="850" r="140" fill="#38bdf8" fill-opacity="0.1" stroke="#38bdf8" stroke-width="2"/>
    <text x="400" y="840" text-anchor="middle" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="28" font-weight="900">DUAL SPREAD VERIFIED</text>
    <text x="400" y="875" text-anchor="middle" fill="#e2e8f0" font-family="system-ui, sans-serif" font-size="16">Pages 2 & 3 flow side-by-side in natural Japanese RTL order.</text>
    <text x="400" y="905" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="14">Press Left Arrow or click left edge to advance.</text>`
  );

  // Page 4: Character Dialogue
  const page4Svg = createSvgPage(
    4,
    'THE ARCHIVE CONSPIRACY',
    '失われた記録',
    `<!-- Dialogue 3-Tier Panels -->
    <rect x="40" y="80" width="720" height="320" rx="8" fill="#1e1e24" stroke="#334155" stroke-width="2"/>
    <rect x="80" y="110" width="340" height="90" rx="12" fill="#ffffff"/>
    <text x="100" y="145" fill="#09090b" font-family="system-ui, sans-serif" font-size="14" font-weight="700">"Is it true that Lumina supports</text>
    <text x="100" y="170" fill="#09090b" font-family="system-ui, sans-serif" font-size="14" font-weight="700">both EPUB and Comic archives natively?"</text>

    <rect x="40" y="420" width="720" height="320" rx="8" fill="#13141f" stroke="#334155" stroke-width="2"/>
    <rect x="340" y="460" width="380" height="110" rx="12" fill="#ffffff"/>
    <text x="360" y="495" fill="#09090b" font-family="system-ui, sans-serif" font-size="14" font-weight="700">"Yes! CBZ, CBR, CBT, and CB7 streaming,</text>
    <text x="360" y="520" fill="#09090b" font-family="system-ui, sans-serif" font-size="14" font-weight="700">plus Webtoon infinite scroll mode!"</text>
    <text x="100" y="640" fill="#38bdf8" font-family="'Noto Sans JP', sans-serif" font-size="52" font-weight="900">ゴゴゴ</text>

    <rect x="40" y="760" width="720" height="340" rx="8" fill="#0f172a" stroke="#a855f7" stroke-width="2"/>
    <text x="400" y="910" text-anchor="middle" fill="#c084fc" font-family="system-ui, sans-serif" font-size="24" font-weight="800">"Then the future of reading is secure."</text>`
  );

  // Page 5: High-Voltage Webtoon Vertical Panel
  const page5Svg = createSvgPage(
    5,
    'WEBTOON DESCENT',
    '無限の降下',
    `<!-- Tall Gapless Panel Strip -->
    <rect x="40" y="80" width="720" height="1020" rx="8" fill="#070a12" stroke="#38bdf8" stroke-width="2"/>
    <line x1="400" y1="100" x2="400" y2="1080" stroke="#38bdf8" stroke-width="4" stroke-dasharray="16 12"/>
    <text x="400" y="240" text-anchor="middle" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="34" font-weight="900">VERTICAL WEBTOON STRIP</text>
    <text x="400" y="280" text-anchor="middle" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="16">Optimized for seamless gapless mobile & desktop scrolling</text>
    <circle cx="400" cy="600" r="120" fill="#f43f5e" fill-opacity="0.2" stroke="#f43f5e" stroke-width="2"/>
    <text x="400" y="610" text-anchor="middle" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="22" font-weight="800">SMOOTH 60 FPS SCROLL</text>`
  );

  // Page 6: Cliffhanger Finale
  const page6Svg = createSvgPage(
    6,
    'TO BE CONTINUED',
    'つづく',
    `<!-- Full Finale Panel -->
    <rect x="40" y="80" width="720" height="1020" rx="8" fill="#020617" stroke="#f43f5e" stroke-width="2"/>
    <text x="400" y="440" text-anchor="middle" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="48" font-weight="900" letter-spacing="4">ACT 1 COMPLETE</text>
    <text x="400" y="500" text-anchor="middle" fill="#e2e8f0" font-family="system-ui, sans-serif" font-size="20">The Lumina Comic Engine is fully verified.</text>

    <!-- Japanese Kanji "To Be Continued" -->
    <rect x="250" y="620" width="300" height="90" rx="12" fill="#f43f5e"/>
    <text x="400" y="675" text-anchor="middle" fill="#ffffff" font-family="'Noto Sans JP', sans-serif" font-size="38" font-weight="900" letter-spacing="8">つづく</text>

    <text x="400" y="820" text-anchor="middle" fill="#64748b" font-family="system-ui, sans-serif" font-size="14" letter-spacing="2">LUMINA READER • PHASE 9 COMIC & MANGA SUITE</text>`
  );

  // ComicInfo.xml metadata
  const comicInfoXml = `<?xml version="1.0" encoding="utf-8"?>
<ComicInfo xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Title>Act 1: The Cyber Spark</Title>
  <Series>Neon Valkyrie</Series>
  <Number>1</Number>
  <Volume>1</Volume>
  <Summary>In Neo-Tokyo 2088, rogue operative Aoi uncovers an ancient universal reading archive capable of streaming comics, RTL manga dual spreads, and seamless Webtoon strips offline.</Summary>
  <Writer>Kenji Takahashi</Writer>
  <Penciller>Aoi Sora</Penciller>
  <Publisher>Lumina Manga Studio</Publisher>
  <Manga>YesAndRightToLeft</Manga>
  <PageCount>6</PageCount>
</ComicInfo>`;

  zip.file('01_cover.svg', coverSvg);
  zip.file('02_page01.svg', page2Svg);
  zip.file('03_page02.svg', page3Svg);
  zip.file('04_page03.svg', page4Svg);
  zip.file('05_page04.svg', page5Svg);
  zip.file('06_page05.svg', page6Svg);
  zip.file('ComicInfo.xml', comicInfoXml);

  return await zip.generateAsync({ type: 'arraybuffer' });
}
