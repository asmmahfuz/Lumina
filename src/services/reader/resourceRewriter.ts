/**
 * Lumina Reader - Resource Rewriter & Sandboxed Styler
 * Rewrites relative images, SVGs, and stylesheets to safe blob URLs or inline styles,
 * enforces strict sanitization, and injects reader typography & circadian themes.
 */

import { SafeArchiveReader } from '@/services/archive/safeDecompressor';
import { resolveRelativePath } from '@/services/epub/manifestResolver';
export { generateReaderStyles, prepareReaderSrcDoc } from './readerStyleGenerator';
export type { StyleInjectionParams } from './readerStyleGenerator';

/**
 * Rewrites relative CSS url(...) paths to archive blob URLs
 */
async function rewriteCssUrls(
  cssText: string,
  cssDir: string,
  archive: SafeArchiveReader
): Promise<string> {
  const urlRegex = /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
  const matches = Array.from(cssText.matchAll(urlRegex));

  let rewritten = cssText;
  for (const match of matches) {
    const rawUrl = match[1]?.trim();
    if (!rawUrl || rawUrl.startsWith('data:') || rawUrl.startsWith('blob:') || rawUrl.startsWith('http')) {
      continue;
    }

    const resolved = resolveRelativePath(cssDir, rawUrl);
    if (archive.hasFile(resolved)) {
      try {
        const blobUrl = await archive.readAsObjectUrl(resolved);
        rewritten = rewritten.replace(match[0], `url("${blobUrl}")`);
      } catch (err) {
        console.warn(`Failed to resolve CSS asset: ${resolved}`, err);
      }
    }
  }

  return rewritten;
}

/**
 * Rewrites relative image and stylesheet attributes in chapter HTML to safe blob Object URLs
 */
export async function rewriteChapterResources(
  rawHtml: string,
  chapterFullPath: string,
  archive: SafeArchiveReader
): Promise<string> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // Compute directory of current chapter file (e.g. "OEBPS/text/")
  const lastSlash = chapterFullPath.lastIndexOf('/');
  const chapterDir = lastSlash !== -1 ? chapterFullPath.substring(0, lastSlash + 1) : '';

  // 1. Rewrite <img> and <image> tags
  const imgElements = doc.querySelectorAll('img, image');
  for (const el of Array.from(imgElements)) {
    const rawSrc = el.getAttribute('src') || el.getAttribute('href') || el.getAttribute('xlink:href');
    if (!rawSrc || rawSrc.startsWith('data:') || rawSrc.startsWith('blob:') || rawSrc.startsWith('http')) {
      continue;
    }

    const resolvedPath = resolveRelativePath(chapterDir, rawSrc);
    if (archive.hasFile(resolvedPath)) {
      try {
        const objectUrl = await archive.readAsObjectUrl(resolvedPath);
        if (el.tagName.toLowerCase() === 'image') {
          el.setAttribute('href', objectUrl);
          el.setAttribute('xlink:href', objectUrl);
        } else {
          el.setAttribute('src', objectUrl);
        }
      } catch (err) {
        console.warn(`Failed to resolve image blob for: ${resolvedPath}`, err);
      }
    }
  }

  // 2. Rewrite <source srcset="..."> in <picture> tags
  const sources = doc.querySelectorAll('source[srcset]');
  for (const source of Array.from(sources)) {
    const rawSrcset = source.getAttribute('srcset');
    if (rawSrcset && !rawSrcset.startsWith('data:') && !rawSrcset.startsWith('blob:') && !rawSrcset.startsWith('http')) {
      const resolved = resolveRelativePath(chapterDir, rawSrcset);
      if (archive.hasFile(resolved)) {
        try {
          const blobUrl = await archive.readAsObjectUrl(resolved);
          source.setAttribute('srcset', blobUrl);
        } catch {
          // ignore
        }
      }
    }
  }

  // 3. Rewrite SVG <use xlink:href="...">
  const uses = doc.querySelectorAll('use');
  for (const use of Array.from(uses)) {
    const rawHref = use.getAttribute('xlink:href') || use.getAttribute('href');
    if (rawHref && !rawHref.startsWith('#') && !rawHref.startsWith('data:') && !rawHref.startsWith('blob:')) {
      const [pathPart, hashPart] = rawHref.split('#');
      const resolved = resolveRelativePath(chapterDir, pathPart);
      if (archive.hasFile(resolved)) {
        try {
          const blobUrl = await archive.readAsObjectUrl(resolved);
          const fullTarget = hashPart ? `${blobUrl}#${hashPart}` : blobUrl;
          use.setAttribute('xlink:href', fullTarget);
          use.setAttribute('href', fullTarget);
        } catch {
          // ignore
        }
      }
    }
  }

  // 4. Resolve and inline EPUB stylesheets (<link rel="stylesheet">)
  const linkElements = doc.querySelectorAll('link[rel="stylesheet"], link[rel="Stylesheet"]');
  for (const link of Array.from(linkElements)) {
    const rawHref = link.getAttribute('href');
    if (!rawHref || rawHref.startsWith('http') || rawHref.startsWith('data:') || rawHref.startsWith('blob:')) {
      continue;
    }

    const resolvedPath = resolveRelativePath(chapterDir, rawHref);
    if (archive.hasFile(resolvedPath)) {
      try {
        const rawCss = await archive.readAsText(resolvedPath);
        const cssDir = resolvedPath.lastIndexOf('/') !== -1 ? resolvedPath.substring(0, resolvedPath.lastIndexOf('/') + 1) : '';
        const rewrittenCss = await rewriteCssUrls(rawCss, cssDir, archive);

        const styleEl = doc.createElement('style');
        styleEl.setAttribute('data-epub-css', resolvedPath);
        styleEl.textContent = rewrittenCss;
        link.replaceWith(styleEl);
      } catch (err) {
        console.warn(`Failed to inline stylesheet: ${resolvedPath}`, err);
        link.remove();
      }
    } else {
      link.remove();
    }
  }

  // 5. Strict Defense-in-Depth Sanitization: Strip scripts and inline event handlers
  const scripts = doc.querySelectorAll('script');
  scripts.forEach((s) => s.remove());

  const allElements = doc.querySelectorAll('*');
  for (const el of Array.from(allElements)) {
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.toLowerCase().startsWith('on')) {
        el.removeAttribute(attr.name);
      }
    }
  }

  // Remove any conflicting <base> tags
  doc.querySelectorAll('base').forEach((b) => b.remove());

  return doc.documentElement.outerHTML;
}

