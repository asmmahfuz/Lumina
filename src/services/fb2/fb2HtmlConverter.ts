/**
 * Lumina Reader - FictionBook (FB2) HTML Converter
 * Transforms FB2 XML DOM trees into editorial XHTML chapters with styled epigraphs,
 * poems, verses, citations, and interactive footnotes.
 */

import { Fb2ParsedDocument, Fb2BinaryItem } from './fb2XmlParser';
import { VirtualChapter } from '@/services/archive/virtualArchiveBuilder';
import { TableOfContentsItem } from '@/types/book';

export interface ConvertedFb2 {
  chapters: VirtualChapter[];
  assets: Map<string, ArrayBuffer | string>;
  coverData?: ArrayBuffer;
  coverMediaType?: string;
}

export class Fb2HtmlConverter {
  /**
   * Converts FB2 XML document and binaries into normalized VirtualChapter items
   */
  public static convert(doc: Fb2ParsedDocument): ConvertedFb2 {
    const assets = new Map<string, ArrayBuffer | string>();
    const imagePathMap = new Map<string, string>();

    // 1. Index and map binary images
    let coverData: ArrayBuffer | undefined;
    let coverMediaType: string | undefined;

    doc.binaries.forEach((bin: Fb2BinaryItem, id: string) => {
      const ext = bin.contentType.includes('png')
        ? 'png'
        : bin.contentType.includes('gif')
        ? 'gif'
        : 'jpg';
      const cleanId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
      const assetPath = `images/${cleanId}.${ext}`;

      assets.set(assetPath, bin.data);
      imagePathMap.set(id, assetPath);
      imagePathMap.set(`#${id}`, assetPath);

      if (id === doc.coverImageId || (!coverData && doc.binaries.size > 0)) {
        coverData = bin.data;
        coverMediaType = bin.contentType;
      }
    });

    // 2. Locate Main Body & Notes Body
    const bodies = Array.from(doc.xmlDoc.querySelectorAll('FictionBook > body, body'));
    const mainBody = bodies.find((b) => !b.getAttribute('name')) || bodies[0];
    const notesBody = bodies.find((b) => b.getAttribute('name') === 'notes');

    const chapters: VirtualChapter[] = [];

    if (mainBody) {
      // Find top-level sections in main body
      const topSections = Array.from(mainBody.children).filter(
        (c) => c.nodeName.toLowerCase() === 'section'
      );

      if (topSections.length > 0) {
        topSections.forEach((sectionEl, index) => {
          const { chapter, subitems } = convertSection(sectionEl, index + 1, imagePathMap);
          chapter.subitems = subitems;
          chapters.push(chapter);
        });
      } else {
        // Flat body without sections
        const html = renderNodes(Array.from(mainBody.children), imagePathMap);
        chapters.push({
          id: 'ch01',
          title: doc.title,
          xhtml: wrapInXhtml(doc.title, html),
        });
      }
    }

    // 3. Convert Notes Body (if exists) into Footnotes chapter
    if (notesBody) {
      const notesSections = Array.from(notesBody.children).filter(
        (c) => c.nodeName.toLowerCase() === 'section'
      );
      if (notesSections.length > 0) {
        const notesHtml = notesSections
          .map((sec) => {
            const secId = sec.getAttribute('id') || '';
            const secTitle = sec.querySelector('title')?.textContent?.trim() || '';
            const bodyContent = renderNodes(
              Array.from(sec.children).filter((c) => c.nodeName.toLowerCase() !== 'title'),
              imagePathMap
            );
            return `<div class="fb2-footnote-entry" id="${secId}">
              <span class="fb2-footnote-num">[${secTitle || secId}]</span>
              <div class="fb2-footnote-body">${bodyContent}</div>
            </div>`;
          })
          .join('\n');

        chapters.push({
          id: 'notes',
          title: 'Footnotes & Annotations',
          xhtml: wrapInXhtml('Footnotes & Annotations', `<div class="fb2-notes-page">${notesHtml}</div>`),
        });
      }
    }

    return {
      chapters,
      assets,
      coverData,
      coverMediaType,
    };
  }
}

function convertSection(
  sectionEl: Element,
  index: number,
  imageMap: Map<string, string>
): { chapter: VirtualChapter; subitems: TableOfContentsItem[] } {
  const titleEl = sectionEl.querySelector(':scope > title');
  const titleText = titleEl ? titleEl.textContent?.trim() || '' : '';
  const chapterTitle = titleText || `Section ${index}`;
  const chapterId = `ch${String(index).padStart(2, '0')}`;

  const subitems: TableOfContentsItem[] = [];
  const contentChildren = Array.from(sectionEl.children).filter(
    (c) => c.nodeName.toLowerCase() !== 'title'
  );

  // Check for nested sub-sections
  contentChildren.forEach((child, subIdx) => {
    if (child.nodeName.toLowerCase() === 'section') {
      const subTitle = child.querySelector(':scope > title')?.textContent?.trim();
      if (subTitle) {
        subitems.push({
          id: `${chapterId}-sub${subIdx + 1}`,
          label: subTitle,
          href: `text/${chapterId}.xhtml#sub${subIdx + 1}`,
        });
      }
    }
  });

  const bodyHtml = renderNodes(contentChildren, imageMap);
  const xhtml = wrapInXhtml(
    chapterTitle,
    `<h2 class="fb2-chapter-title">${escapeXml(chapterTitle)}</h2>\n${bodyHtml}`
  );

  return {
    chapter: {
      id: chapterId,
      title: chapterTitle,
      xhtml,
    },
    subitems,
  };
}

function renderNodes(nodes: Element[], imageMap: Map<string, string>): string {
  return nodes
    .map((node) => {
      const tag = node.nodeName.toLowerCase();
      switch (tag) {
        case 'p':
          return `<p>${renderInline(node, imageMap)}</p>`;
        case 'epigraph':
          return `<blockquote class="fb2-epigraph">${renderNodes(
            Array.from(node.children),
            imageMap
          )}</blockquote>`;
        case 'text-author':
          return `<p class="fb2-author">— ${escapeXml(node.textContent?.trim() || '')}</p>`;
        case 'subtitle':
          return `<h3 class="fb2-subtitle">${renderInline(node, imageMap)}</h3>`;
        case 'empty-line':
          return `<br class="fb2-empty-line"/>`;
        case 'poem':
          return `<div class="fb2-poem">${renderNodes(Array.from(node.children), imageMap)}</div>`;
        case 'stanza':
          return `<div class="fb2-stanza">${renderNodes(Array.from(node.children), imageMap)}</div>`;
        case 'v':
          return `<p class="fb2-verse">${renderInline(node, imageMap)}</p>`;
        case 'cite':
          return `<blockquote class="fb2-cite">${renderNodes(Array.from(node.children), imageMap)}</blockquote>`;
        case 'image': {
          const href =
            node.getAttribute('l:href') ||
            node.getAttribute('xlink:href') ||
            node.getAttribute('href') ||
            '';
          const resolvedPath = imageMap.get(href) || imageMap.get(href.replace(/^#/, '')) || href;
          return `<div class="fb2-image-wrap"><img src="${resolvedPath}" alt="Illustration" /></div>`;
        }
        case 'section': {
          const subTitle = node.querySelector(':scope > title')?.textContent?.trim() || '';
          const subContent = renderNodes(
            Array.from(node.children).filter((c) => c.nodeName.toLowerCase() !== 'title'),
            imageMap
          );
          return `<div class="fb2-subsection">
            ${subTitle ? `<h3 class="fb2-subtitle">${escapeXml(subTitle)}</h3>` : ''}
            ${subContent}
          </div>`;
        }
        default:
          return renderInline(node, imageMap);
      }
    })
    .join('\n');
}

function renderInline(node: Element, imageMap: Map<string, string>): string {
  let result = '';
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      result += escapeXml(child.textContent || '');
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tag = el.nodeName.toLowerCase();
      switch (tag) {
        case 'emphasis':
          return (result += `<em>${renderInline(el, imageMap)}</em>`);
        case 'strong':
          return (result += `<strong>${renderInline(el, imageMap)}</strong>`);
        case 'strikethrough':
          return (result += `<s>${renderInline(el, imageMap)}</s>`);
        case 'sub':
          return (result += `<sub>${renderInline(el, imageMap)}</sub>`);
        case 'sup':
          return (result += `<sup>${renderInline(el, imageMap)}</sup>`);
        case 'code':
          return (result += `<code>${renderInline(el, imageMap)}</code>`);
        case 'a': {
          const href =
            el.getAttribute('l:href') || el.getAttribute('xlink:href') || el.getAttribute('href') || '#';
          const type = el.getAttribute('type');
          if (type === 'note') {
            return (result += `<sup class="fb2-note-ref"><a href="${href}">[${escapeXml(
              el.textContent?.trim() || '*'
            )}]</a></sup>`);
          }
          return (result += `<a href="${href}">${renderInline(el, imageMap)}</a>`);
        }
        default:
          result += renderInline(el, imageMap);
      }
    }
  });
  return result;
}

function wrapInXhtml(title: string, bodyContent: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8"/>
  <title>${escapeXml(title)}</title>
</head>
<body class="lumina-fb2-body">
  ${bodyContent}
</body>
</html>`;
}

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
