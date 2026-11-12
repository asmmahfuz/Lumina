/**
 * Lumina Reader - Reader Style Generator
 * Generates injected CSS styles for the sandboxed iframe viewport,
 * supporting CSS multi-column pagination, two-page spreads, continuous scroll,
 * editorial typography, and 5 circadian themes.
 */

import { ReaderTypography, ReadingTheme } from '@/types/book';

export interface StyleInjectionParams {
  theme: ReadingTheme;
  typography: ReaderTypography;
}

export function generateReaderStyles(params: StyleInjectionParams): string {
  const { theme, typography } = params;

  // Harmonized circadian themes matching themes.css tokens
  const themeColors: Record<ReadingTheme, { bg: string; text: string; link: string; border: string }> = {
    oled: { bg: '#000000', text: '#E4E4E7', link: '#818CF8', border: '#27272A' },
    slate: { bg: '#0F172A', text: '#F8FAFC', link: '#38BDF8', border: '#334155' },
    sepia: { bg: '#FBF0D9', text: '#423223', link: '#B45309', border: '#E3CEAA' },
    paper: { bg: '#FAF8F5', text: '#2D2A26', link: '#3B82F6', border: '#E2DACD' },
    light: { bg: '#FFFFFF', text: '#18181B', link: '#4F46E5', border: '#E4E4E7' },
  };

  const colors = themeColors[theme] || themeColors.oled;

  const fontFamilies: Record<string, string> = {
    serif: '"Literata", Georgia, Cambria, "Times New Roman", Times, serif',
    slab: '"Bitter", Rockwell, "Courier New", Courier, Georgia, serif',
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    hyperlegible: '"Atkinson Hyperlegible", "Segoe UI", Arial, sans-serif',
    mono: '"JetBrains Mono", Consolas, "Courier New", monospace',
  };

  const fontFamily = fontFamilies[typography.fontFamily] || fontFamilies.serif;
  const isPaginated = typography.readingMode !== 'continuous';
  const isTwoPage = isPaginated && typography.twoPageSpread;

  // Layout mode rules: Paginated (Horizontal Multi-Column) vs Continuous Scroll
  const layoutRules = isPaginated
    ? `
      html {
        height: 100% !important;
        overflow-x: auto !important;
        overflow-y: hidden !important;
        scroll-behavior: smooth !important;
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      html::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
      body {
        height: 100vh !important;
        max-height: 100vh !important;
        box-sizing: border-box !important;
        margin: 0 !important;
        padding: 32px ${typography.marginPercent}% 40px ${typography.marginPercent}% !important;
        column-fill: auto !important;
        ${
          isTwoPage
            ? `
            column-count: 2 !important;
            column-gap: 48px !important;
            column-width: calc((100vw - 2 * ${typography.marginPercent}vw - 48px) / 2) !important;
            column-rule: 1px solid ${colors.border} !important;
            `
            : `
            column-count: 1 !important;
            column-gap: 48px !important;
            column-width: calc(100vw - 2 * ${typography.marginPercent}vw) !important;
            `
        }
        overflow: visible !important;
      }
    `
    : `
      html {
        height: auto !important;
        overflow-x: hidden !important;
        overflow-y: auto !important;
        scroll-behavior: smooth !important;
      }
      body {
        height: auto !important;
        min-height: 100vh !important;
        box-sizing: border-box !important;
        margin: 0 !important;
        padding: 28px ${typography.marginPercent}% 64px ${typography.marginPercent}% !important;
        column-count: unset !important;
        overflow-x: hidden !important;
        ${
          isTwoPage
            ? `
            column-count: 2 !important;
            column-gap: 48px !important;
            column-rule: 1px solid ${colors.border} !important;
            `
            : ''
        }
      }
    `;

  return `
    <style id="lumina-reader-theme">
      ${layoutRules}
      html, body {
        background-color: ${colors.bg} !important;
        color: ${colors.text} !important;
        font-family: ${fontFamily} !important;
        font-size: ${typography.fontSize}px !important;
        line-height: ${typography.lineHeight} !important;
        text-align: ${typography.textAlign} !important;
        -webkit-font-smoothing: antialiased !important;
        text-rendering: optimizeLegibility !important;
        transition: background-color 200ms ease, color 200ms ease !important;
      }
      p, div, span, li {
        font-size: ${typography.fontSize}px !important;
        line-height: ${typography.lineHeight} !important;
        word-break: break-word !important;
      }
      p {
        margin-bottom: 1.25em !important;
        text-indent: ${typography.textAlign === 'justify' ? '1.2em' : '0'} !important;
      }
      h1 {
        font-size: ${Math.round(typography.fontSize * 1.55)}px !important;
        color: ${colors.text} !important;
        margin-top: 1.2em !important;
        margin-bottom: 0.6em !important;
        line-height: 1.25 !important;
        break-after: avoid !important;
      }
      h2 {
        font-size: ${Math.round(typography.fontSize * 1.35)}px !important;
        color: ${colors.text} !important;
        margin-top: 1.1em !important;
        margin-bottom: 0.5em !important;
        line-height: 1.3 !important;
        break-after: avoid !important;
      }
      h3 {
        font-size: ${Math.round(typography.fontSize * 1.18)}px !important;
        color: ${colors.text} !important;
        margin-top: 1em !important;
        margin-bottom: 0.4em !important;
        break-after: avoid !important;
      }
      h4, h5, h6 {
        font-size: ${typography.fontSize}px !important;
        color: ${colors.text} !important;
        margin-top: 0.8em !important;
        margin-bottom: 0.4em !important;
        break-after: avoid !important;
      }
      a {
        color: ${colors.link} !important;
        text-decoration: underline !important;
      }
      img, svg {
        max-width: 100% !important;
        max-height: 80vh !important;
        height: auto !important;
        display: block !important;
        margin: 1.5em auto !important;
        border-radius: 4px !important;
        break-inside: avoid !important;
      }
      blockquote {
        border-left: 3px solid ${colors.link} !important;
        margin-left: 0 !important;
        padding-left: 16px !important;
        font-style: italic !important;
        opacity: 0.9 !important;
        break-inside: avoid !important;
      }
      table {
        border-collapse: collapse !important;
        width: 100% !important;
        margin: 1.5em 0 !important;
        break-inside: avoid !important;
      }
      th, td {
        border: 1px solid ${colors.border} !important;
        padding: 6px 10px !important;
      }
      code, pre {
        font-family: ${fontFamilies.mono} !important;
        background-color: ${colors.border}33 !important;
        border-radius: 3px !important;
      }
      pre {
        padding: 10px !important;
        overflow-x: auto !important;
        break-inside: avoid !important;
      }
      /* Text Highlights & Annotations */
      .lumina-highlight {
        cursor: pointer !important;
        border-radius: 2px !important;
        padding: 1px 2px !important;
        transition: opacity 150ms ease, filter 150ms ease !important;
      }
      .lumina-highlight:hover {
        filter: brightness(0.9) !important;
        outline: 1px dashed ${colors.link} !important;
      }
      .lumina-highlight-yellow {
        background-color: rgba(250, 204, 21, 0.42) !important;
        border-bottom: 2px solid #EAB308 !important;
        color: inherit !important;
      }
      .lumina-highlight-green {
        background-color: rgba(74, 222, 128, 0.42) !important;
        border-bottom: 2px solid #22C55E !important;
        color: inherit !important;
      }
      .lumina-highlight-blue {
        background-color: rgba(96, 165, 250, 0.42) !important;
        border-bottom: 2px solid #3B82F6 !important;
        color: inherit !important;
      }
      .lumina-highlight-pink {
        background-color: rgba(244, 114, 182, 0.42) !important;
        border-bottom: 2px solid #EC4899 !important;
        color: inherit !important;
      }
      .lumina-highlight-orange {
        background-color: rgba(251, 146, 60, 0.42) !important;
        border-bottom: 2px solid #F97316 !important;
        color: inherit !important;
      }
      .lumina-highlight-has-note::after {
        content: ' 📝' !important;
        font-size: 0.78em !important;
        vertical-align: super !important;
        opacity: 0.9 !important;
      }
      @keyframes lumina-highlight-pulse {
        0%, 100% { outline: 2px solid transparent; }
        50% { outline: 3px solid ${colors.link}; }
      }
      .lumina-highlight-active {
        animation: lumina-highlight-pulse 1.2s ease 2 !important;
      }
      /* In-Book Full-Text Search Highlighting */
      .lumina-search-match {
        background-color: rgba(250, 204, 21, 0.40) !important;
        color: inherit !important;
        border-radius: 2px !important;
        padding: 0 1px !important;
        outline: 1px solid rgba(234, 179, 8, 0.45) !important;
        transition: background-color 150ms ease, outline 150ms ease !important;
      }
      .lumina-search-match-active {
        background-color: #EAB308 !important;
        color: #000000 !important;
        font-weight: 600 !important;
        outline: 2px solid #CA8A04 !important;
        box-shadow: 0 0 8px rgba(234, 179, 8, 0.75) !important;
        animation: lumina-highlight-pulse 1.0s ease 2 !important;
      }
      /* FB2 & Editorial Typography */
      .fb2-epigraph {
        margin: 1.5em 2em !important;
        padding: 0.8em 1.2em !important;
        border-left: 2px solid ${colors.border} !important;
        font-style: italic !important;
        opacity: 0.9 !important;
      }
      .fb2-author {
        text-align: right !important;
        font-size: 0.88em !important;
        color: ${colors.link} !important;
        margin-top: 0.4em !important;
      }
      .fb2-poem {
        margin: 1.5em 2em !important;
      }
      .fb2-verse {
        margin: 0.2em 0 !important;
        font-style: italic !important;
      }
      .fb2-note-ref a {
        text-decoration: none !important;
        font-weight: 600 !important;
        font-size: 0.8em !important;
        color: ${colors.link} !important;
        padding: 0 2px !important;
      }
      .fb2-footnote-entry {
        display: flex !important;
        gap: 8px !important;
        margin: 0.8em 0 !important;
        font-size: 0.9em !important;
        border-bottom: 1px dashed ${colors.border} !important;
        padding-bottom: 0.6em !important;
      }
      .fb2-footnote-num {
        font-weight: bold !important;
        color: ${colors.link} !important;
      }
      .lumina-divider {
        border: none !important;
        border-top: 1px solid ${colors.border} !important;
        margin: 2em auto !important;
        width: 60% !important;
      }
    </style>
  `;
}

export function prepareReaderSrcDoc(chapterHtml: string, styles: string): string {
  const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src blob: data:; style-src 'unsafe-inline'; font-src blob: data:;" />`;

  if (chapterHtml.includes('<head>')) {
    return chapterHtml.replace('<head>', `<head>${cspMeta}${styles}`);
  }
  return `<!DOCTYPE html><html><head>${cspMeta}${styles}</head><body>${chapterHtml}</body></html>`;
}
