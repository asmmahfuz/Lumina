/**
 * Lumina Reader - Pure TypeScript Markdown-to-XHTML Parser
 * Converts CommonMark / GFM markdown into semantic XHTML with code blocks,
 * tables, blockquotes, lists, and typography formatting.
 */

export class MarkdownParser {
  /**
   * Converts a markdown string into clean XHTML markup
   */
  public static parse(md: string): string {
    const lines = md.replace(/\r\n/g, '\n').split('\n');
    const output: string[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeLines: string[] = [];
    let inList: 'ul' | 'ol' | null = null;
    let inTable = false;
    let tableRows: string[][] = [];
    let paragraphBuffer: string[] = [];

    const flushParagraph = () => {
      if (paragraphBuffer.length > 0) {
        const text = paragraphBuffer.join(' ').trim();
        if (text) {
          output.push(`<p>${this.parseInline(text)}</p>`);
        }
        paragraphBuffer = [];
      }
    };

    const flushList = () => {
      if (inList) {
        output.push(`</${inList}>`);
        inList = null;
      }
    };

    const flushTable = () => {
      if (inTable && tableRows.length > 0) {
        output.push(renderTable(tableRows));
        inTable = false;
        tableRows = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 1. Fenced Code Blocks (```lang)
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          flushParagraph();
          flushList();
          flushTable();
          inCodeBlock = true;
          codeLanguage = line.trim().slice(3).trim();
          codeLines = [];
        } else {
          inCodeBlock = false;
          const escapedCode = escapeXml(codeLines.join('\n'));
          const langClass = codeLanguage ? ` class="language-${escapeXml(codeLanguage)}"` : '';
          output.push(`<pre><code${langClass}>${escapedCode}</code></pre>`);
          codeLines = [];
          codeLanguage = '';
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      // 2. Blank Lines
      if (line.trim() === '') {
        flushParagraph();
        flushList();
        flushTable();
        continue;
      }

      // 3. Headings (# to ######)
      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        flushParagraph();
        flushList();
        flushTable();
        const level = headingMatch[1].length;
        const text = headingMatch[2].trim();
        const slug = slugify(text);
        output.push(`<h${level} id="${slug}">${this.parseInline(text)}</h${level}>`);
        continue;
      }

      // 4. Horizontal Rules (--- or *** or ___)
      if (/^(\*{3,}|-{3,}|_{3,})$/.test(line.trim())) {
        flushParagraph();
        flushList();
        flushTable();
        output.push('<hr class="lumina-divider"/>');
        continue;
      }

      // 5. Blockquotes (> ...)
      if (line.trim().startsWith('>')) {
        flushParagraph();
        flushList();
        flushTable();
        const quoteText = line.trim().replace(/^>\s*/, '');
        output.push(`<blockquote><p>${this.parseInline(quoteText)}</p></blockquote>`);
        continue;
      }

      // 6. Tables (| Col 1 | Col 2 |)
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        flushParagraph();
        flushList();
        const cells = line
          .trim()
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());

        // Skip divider row (e.g. |---|---|)
        if (cells.every((c) => /^:?-+:?$/.test(c))) {
          continue;
        }

        inTable = true;
        tableRows.push(cells);
        continue;
      } else {
        flushTable();
      }

      // 7. Unordered Lists (- or * or +)
      const ulMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
      if (ulMatch) {
        flushParagraph();
        flushTable();
        if (inList !== 'ul') {
          flushList();
          inList = 'ul';
          output.push('<ul class="lumina-list">');
        }
        output.push(`<li>${this.parseInline(ulMatch[2].trim())}</li>`);
        continue;
      }

      // 8. Ordered Lists (1. 2. 3.)
      const olMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
      if (olMatch) {
        flushParagraph();
        flushTable();
        if (inList !== 'ol') {
          flushList();
          inList = 'ol';
          output.push('<ol class="lumina-list">');
        }
        output.push(`<li>${this.parseInline(olMatch[2].trim())}</li>`);
        continue;
      }

      flushList();

      // Regular paragraph line
      paragraphBuffer.push(line.trim());
    }

    flushParagraph();
    flushList();
    flushTable();

    return output.join('\n');
  }

  /**
   * Parses inline Markdown formatting (bold, italic, code, links, images, strike)
   */
  public static parseInline(text: string): string {
    let result = escapeXml(text);

    // Code `...`
    result = result.replace(/`([^`]+)`/g, '<code class="lumina-inline-code">$1</code>');

    // Images ![alt](url)
    result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="lumina-md-image"/>');

    // Links [text](url)
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="lumina-link">$1</a>');

    // Bold + Italic ***text*** or ___text___
    result = result.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    result = result.replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>');

    // Bold **text** or __text__
    result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // Italic *text* or _text_
    result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    result = result.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Strikethrough ~~text~~
    result = result.replace(/~~([^~]+)~~/g, '<s>$1</s>');

    return result;
  }
}

function renderTable(rows: string[][]): string {
  if (rows.length === 0) return '';
  const header = rows[0];
  const bodyRows = rows.slice(1);

  const headerHtml = `<thead><tr>${header
    .map((h) => `<th>${MarkdownParser.parseInline(h)}</th>`)
    .join('')}</tr></thead>`;

  const bodyHtml = `<tbody>${bodyRows
    .map(
      (r) =>
        `<tr>${r.map((c) => `<td>${MarkdownParser.parseInline(c)}</td>`).join('')}</tr>`
    )
    .join('\n')}</tbody>`;

  return `<div class="lumina-table-wrapper"><table class="lumina-table">${headerHtml}\n${bodyHtml}</table></div>`;
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
