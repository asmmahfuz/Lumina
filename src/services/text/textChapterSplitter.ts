/**
 * Lumina Reader - Text & Markdown Chapter Splitter
 * Detects structural headings, divides long manuscripts into ergonomic chapters,
 * and formats plain text with editorial book typography.
 */

import { VirtualChapter } from '@/services/archive/virtualArchiveBuilder';
import { MarkdownParser } from './markdownParser';
import { TableOfContentsItem } from '@/types/book';

export interface SplitResult {
  title: string;
  author?: string;
  description?: string;
  chapters: VirtualChapter[];
}

export class TextChapterSplitter {
  /**
   * Splits a Markdown document into chapters and builds a hierarchical TOC
   */
  public static splitMarkdown(content: string, defaultTitle: string): SplitResult {
    const lines = content.replace(/\r\n/g, '\n').split('\n');

    // Extract title from first H1 if present
    let title = defaultTitle;
    let description = '';
    const h1Index = lines.findIndex((l) => /^#\s+/.test(l.trim()));
    if (h1Index !== -1) {
      title = lines[h1Index].replace(/^#\s+/, '').trim();
    }

    // Extract description from first non-heading non-blank line
    for (const l of lines) {
      const clean = l.trim();
      if (clean && !clean.startsWith('#') && !clean.startsWith('```') && clean.length > 20) {
        description = clean.slice(0, 200);
        break;
      }
    }

    // Split chapters on '# ' (H1) or '---' / '***'
    // If no '# ' exists, fall back to '## '
    const hasMultipleH1 = lines.filter((l) => /^#\s+/.test(l.trim())).length > 1;
    const splitRegex = hasMultipleH1
      ? /(?=^#\s+)/m
      : /(?=^##\s+)/m;

    let rawSections = content.split(splitRegex).map((s) => s.trim()).filter(Boolean);
    if (rawSections.length === 0) {
      rawSections = [content];
    }

    const chapters: VirtualChapter[] = [];

    rawSections.forEach((sec, idx) => {
      const secLines = sec.split('\n');
      const firstLine = secLines[0]?.trim() || '';
      const headingMatch = firstLine.match(/^#{1,3}\s+(.*)$/);

      let chTitle = headingMatch ? headingMatch[1].trim() : '';
      if (!chTitle) {
        chTitle = idx === 0 ? 'Introduction' : `Chapter ${idx + 1}`;
      }

      // Collect sub-headings for TOC
      const subitems: TableOfContentsItem[] = [];
      const chId = `ch${String(idx + 1).padStart(2, '0')}`;

      secLines.slice(1).forEach((l, lineIdx) => {
        const subMatch = l.trim().match(/^#{2,3}\s+(.*)$/);
        if (subMatch) {
          const subLabel = subMatch[1].trim();
          subitems.push({
            id: `${chId}-sub${lineIdx + 1}`,
            label: subLabel,
            href: `text/${chId}.xhtml#${slugify(subLabel)}`,
          });
        }
      });

      const parsedHtml = MarkdownParser.parse(sec);
      const xhtml = wrapInXhtml(chTitle, parsedHtml);

      chapters.push({
        id: chId,
        title: chTitle,
        xhtml,
        subitems: subitems.length > 0 ? subitems : undefined,
      });
    });

    return {
      title,
      description,
      chapters,
    };
  }

  /**
   * Splits a plain text document into chapters and applies editorial book typography
   */
  public static splitPlainText(content: string, defaultTitle: string): SplitResult {
    const normalized = content.replace(/\r\n/g, '\n');
    const lines = normalized.split('\n');

    let title = defaultTitle;
    let description = '';

    // Check first non-blank line for title
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i].trim();
      if (line && line.length < 80) {
        title = line;
        break;
      }
    }

    // Pattern for chapter markers: "CHAPTER 1", "Chapter I", "Part 1", "BOOK TWO"
    const chapterHeadingRegex =
      /^(?:chapter|part|book|section|act)\s+[0-9ivxlcdm]+(?:[:\s\-]+.*)?$/i;

    const sections: { title: string; paragraphs: string[] }[] = [];
    let currentTitle = 'Introduction';
    let currentParas: string[] = [];
    let pendingPara: string[] = [];

    const flushPara = () => {
      if (pendingPara.length > 0) {
        const p = pendingPara.join(' ').trim();
        if (p) currentParas.push(p);
        pendingPara = [];
      }
    };

    const flushSection = () => {
      flushPara();
      if (currentParas.length > 0) {
        sections.push({ title: currentTitle, paragraphs: currentParas });
        currentParas = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === '') {
        flushPara();
        continue;
      }

      if (chapterHeadingRegex.test(line)) {
        flushSection();
        currentTitle = line;
        continue;
      }

      pendingPara.push(line);
    }
    flushSection();

    // If no headings found, split by word count (~2,500 words per section)
    const finalSections: { title: string; paragraphs: string[] }[] = [];
    if (sections.length <= 1) {
      const allParas = sections[0]?.paragraphs || [];
      let currentChunk: string[] = [];
      let currentWordCount = 0;
      let partIdx = 1;

      for (const p of allParas) {
        currentChunk.push(p);
        currentWordCount += p.split(/\s+/).length;

        if (currentWordCount >= 2500) {
          finalSections.push({
            title: `Part ${partIdx++}`,
            paragraphs: currentChunk,
          });
          currentChunk = [];
          currentWordCount = 0;
        }
      }
      if (currentChunk.length > 0) {
        finalSections.push({
          title: partIdx === 1 ? 'Complete Text' : `Part ${partIdx}`,
          paragraphs: currentChunk,
        });
      }
    } else {
      finalSections.push(...sections);
    }

    if (finalSections.length > 0 && finalSections[0].paragraphs.length > 0) {
      description = finalSections[0].paragraphs[0].slice(0, 200);
    }

    const chapters: VirtualChapter[] = finalSections.map((sec, idx) => {
      const chId = `ch${String(idx + 1).padStart(2, '0')}`;
      const parasHtml = sec.paragraphs
        .map((p) => `<p>${applyEditorialTypography(p)}</p>`)
        .join('\n');

      const bodyHtml = `<h2 class="lumina-plain-chapter-title">${escapeXml(sec.title)}</h2>\n${parasHtml}`;
      const xhtml = wrapInXhtml(sec.title, bodyHtml);

      return {
        id: chId,
        title: sec.title,
        xhtml,
      };
    });

    return {
      title,
      description,
      chapters,
    };
  }
}

function applyEditorialTypography(text: string): string {
  let res = escapeXml(text);
  // Em dashes: -- to —
  res = res.replace(/--/g, '—');
  // Ellipses: ... to …
  res = res.replace(/\.\.\./g, '…');
  // Smart quotes: "quote" -> “quote”
  res = res.replace(/(^|[\s(])"([a-zA-Z0-9])/g, '$1“$2');
  res = res.replace(/([a-zA-Z0-9,.;:!?])"([\s).!?]|$)/g, '$1”$2');
  // Single quotes: 'word' -> ‘word’
  res = res.replace(/(^|[\s(])'([a-zA-Z0-9])/g, '$1‘$2');
  res = res.replace(/([a-zA-Z0-9])'([a-zA-Z0-9])/g, '$1’$2');
  return res;
}

function wrapInXhtml(title: string, bodyContent: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8"/>
  <title>${escapeXml(title)}</title>
</head>
<body class="lumina-text-body">
  ${bodyContent}
</body>
</html>`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
