/**
 * Lumina Reader - Markdown & Plain Text Reading Engine
 * Normalizes .md and .txt files into full-fidelity reflowable EPUB reading archives
 * with dynamic cover generation, editorial typography, and TOC navigation.
 */

import { ParsedEpubBook, DublinCoreMetadata } from '@/types/epub';
import { SafeArchiveReader } from '@/services/archive/safeDecompressor';
import { TextChapterSplitter } from './textChapterSplitter';
import { VirtualArchiveBuilder } from '@/services/archive/virtualArchiveBuilder';

export interface ParsedTextResult {
  book: ParsedEpubBook;
  archive: SafeArchiveReader;
  buffer: ArrayBuffer;
}

export class TextEngine {
  /**
   * Parses Markdown or Plain Text into a normalized reflowable EPUB archive
   */
  public static async parseTextDocument(
    data: ArrayBuffer,
    fileName: string,
    format: 'md' | 'txt'
  ): Promise<ParsedTextResult> {
    const rawText = decodeBuffer(data);
    const defaultTitle = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    const split =
      format === 'md'
        ? TextChapterSplitter.splitMarkdown(rawText, defaultTitle)
        : TextChapterSplitter.splitPlainText(rawText, defaultTitle);

    const title = split.title || defaultTitle;
    const author = split.author || (format === 'md' ? 'Markdown Author' : 'Plain Text Author');
    const description = split.description || `${format === 'md' ? 'Markdown' : 'Plain Text'} Document`;

    // 1. Generate Artistic SVG Cover
    const coverSvg = generateTextCoverSvg(title, author, format);
    const coverData = new TextEncoder().encode(coverSvg).buffer;
    const coverBlob = new Blob([coverData], { type: 'image/svg+xml' });
    const coverBlobUrl = URL.createObjectURL(coverBlob);

    const metadata: DublinCoreMetadata = {
      title,
      creator: author,
      description,
      publisher: 'Lumina Notes & Manuscripts',
      language: 'en',
      pubdate: new Date().toISOString().split('T')[0],
      identifier: `${format}-${Date.now()}`,
      rights: 'Personal Reading Copy',
      coverHref: 'images/cover.svg',
      coverBlobUrl,
      coverData,
      coverMediaType: 'image/svg+xml',
    };

    // 2. Build in-memory virtual EPUB archive
    const { book, archive, buffer } = await VirtualArchiveBuilder.build({
      metadata,
      chapters: split.chapters,
      coverData,
      coverMediaType: 'image/svg+xml',
    });

    return {
      book,
      archive,
      buffer,
    };
  }
}

function decodeBuffer(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: false }).decode(buffer);
  } catch {
    return new TextDecoder('windows-1252').decode(buffer);
  }
}

function generateTextCoverSvg(title: string, author: string, format: 'md' | 'txt'): string {
  const isMd = format === 'md';
  const c1 = isMd ? '#0f172a' : '#1c1917';
  const c2 = isMd ? '#0284c7' : '#d97706';
  const badgeText = isMd ? 'MARKDOWN MANUSCRIPT' : 'EDITORIAL PLAIN TEXT';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
  <defs>
    <linearGradient id="coverBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="60%" stop-color="${c1}" />
      <stop offset="100%" stop-color="${c2}" />
    </linearGradient>
  </defs>
  <rect width="400" height="600" fill="url(#coverBg)" rx="8" />
  <rect x="24" y="24" width="352" height="552" fill="none" stroke="${c2}" stroke-width="1.5" stroke-opacity="0.4" rx="6" />
  
  <!-- Format Badge -->
  <rect x="110" y="60" width="180" height="26" rx="13" fill="${c2}" fill-opacity="0.2" stroke="${c2}" stroke-width="1" />
  <text x="200" y="77" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="10" font-weight="bold" fill="#f8fafc" text-anchor="middle" letter-spacing="1">${badgeText}</text>
  
  <!-- Title -->
  <text x="200" y="240" font-family="Georgia, serif" font-size="26" font-weight="bold" fill="#f8fafc" text-anchor="middle">
    ${escapeXml(title.slice(0, 30))}
  </text>
  ${
    title.length > 30
      ? `<text x="200" y="275" font-family="Georgia, serif" font-size="22" font-weight="bold" fill="#94a3b8" text-anchor="middle">${escapeXml(title.slice(30, 60))}</text>`
      : ''
  }

  <!-- Author -->
  <text x="200" y="460" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="14" font-weight="500" fill="#94a3b8" text-anchor="middle">${escapeXml(author)}</text>
  
  <!-- Footer -->
  <text x="200" y="530" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" fill="#64748b" text-anchor="middle" letter-spacing="2">LUMINA READING SUITE</text>
</svg>`;
}

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
