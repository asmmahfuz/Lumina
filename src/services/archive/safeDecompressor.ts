/**
 * Lumina Reader - Safe Archive Decompressor with Zip-Slip Guard
 * Implements strict path traversal defense against malicious zip archives
 */

import JSZip from 'jszip';
import { ZipSlipCheckResult } from '@/types/epub';

/**
 * Validates a zip archive entry path against Zip-Slip traversal attacks
 */
export function validateZipPath(rawPath: string): ZipSlipCheckResult {
  if (!rawPath || typeof rawPath !== 'string') {
    return { isSafe: false, rejectedPath: rawPath, reason: 'Empty or non-string entry path' };
  }

  // Detect null bytes
  if (rawPath.includes('\0')) {
    return { isSafe: false, rejectedPath: rawPath, reason: 'Entry path contains null bytes' };
  }

  // Normalize path separators to forward slash
  const normalized = rawPath.replace(/\\/g, '/');

  // Detect absolute paths or Windows drive letters
  if (normalized.startsWith('/') || /^[a-zA-Z]:/.test(normalized)) {
    return { isSafe: false, rejectedPath: rawPath, reason: 'Absolute path or drive prefix not allowed' };
  }

  // Detect encoded path traversals
  const lower = normalized.toLowerCase();
  if (lower.includes('%2e%2e') || lower.includes('..%2f') || lower.includes('%2f..')) {
    return { isSafe: false, rejectedPath: rawPath, reason: 'URL-encoded path traversal sequence detected' };
  }

  // Tokenize segments and verify no component escapes root
  const segments = normalized.split('/');
  let depth = 0;

  for (const seg of segments) {
    if (seg === '' || seg === '.') {
      continue;
    }
    if (seg === '..') {
      depth--;
      if (depth < 0) {
        return { isSafe: false, rejectedPath: rawPath, reason: 'Zip-Slip path traversal (..) escapes root' };
      }
    } else {
      depth++;
    }
  }

  return { isSafe: true };
}

/**
 * Sanitizes and normalizes an archive internal relative path
 */
export function sanitizeArchivePath(rawPath: string): string {
  const normalized = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const segments = normalized.split('/');
  const cleanSegments: string[] = [];

  for (const seg of segments) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') {
      if (cleanSegments.length > 0) {
        cleanSegments.pop();
      }
    } else {
      cleanSegments.push(seg);
    }
  }

  return cleanSegments.join('/');
}

export class SafeArchiveReader {
  private zip: JSZip;
  private safeFiles: Map<string, JSZip.JSZipObject> = new Map();
  private zipSlipAlerts: string[] = [];
  private createdObjectUrls: string[] = [];
  private objectUrlCache: Map<string, string> = new Map();

  private constructor(zip: JSZip) {
    this.zip = zip;
  }

  public static async fromData(data: ArrayBuffer | Blob): Promise<SafeArchiveReader> {
    const zip = new JSZip();
    await zip.loadAsync(data);

    const reader = new SafeArchiveReader(zip);
    reader.inspectAndIndexEntries();
    return reader;
  }

  private inspectAndIndexEntries(): void {
    this.zip.forEach((relativePath, entry) => {
      const validation = validateZipPath(relativePath);
      if (!validation.isSafe) {
        const alert = `[Zip-Slip Blocked] Entry "${relativePath}": ${validation.reason}`;
        console.warn(alert);
        this.zipSlipAlerts.push(alert);
        return; // Safely omit traversal entries
      }

      const cleanPath = sanitizeArchivePath(relativePath);
      this.safeFiles.set(cleanPath, entry);
      // Also register original relative path if clean
      if (cleanPath !== relativePath) {
        this.safeFiles.set(relativePath, entry);
      }
    });
  }

  public getSafeFileList(): string[] {
    return Array.from(this.safeFiles.keys());
  }

  public getZipSlipAlerts(): string[] {
    return [...this.zipSlipAlerts];
  }

  public hasFile(path: string): boolean {
    const clean = sanitizeArchivePath(path);
    return this.safeFiles.has(clean) || this.safeFiles.has(path);
  }

  private getEntry(path: string): JSZip.JSZipObject {
    const clean = sanitizeArchivePath(path);
    const entry = this.safeFiles.get(clean) || this.safeFiles.get(path);
    if (!entry) {
      throw new Error(`File not found in archive: ${path}`);
    }
    return entry;
  }

  public async readAsText(path: string): Promise<string> {
    const entry = this.getEntry(path);
    return await entry.async('string');
  }

  public async readAsArrayBuffer(path: string): Promise<ArrayBuffer> {
    const entry = this.getEntry(path);
    return await entry.async('arraybuffer');
  }

  public async readAsBlob(path: string, mimeType?: string): Promise<Blob> {
    const entry = this.getEntry(path);
    const buffer = await entry.async('arraybuffer');
    const type = mimeType || guessMimeType(path);
    return new Blob([buffer], { type });
  }

  public async readAsObjectUrl(path: string, mimeType?: string): Promise<string> {
    const clean = sanitizeArchivePath(path);
    if (this.objectUrlCache.has(clean)) {
      return this.objectUrlCache.get(clean)!;
    }
    const blob = await this.readAsBlob(path, mimeType);
    const url = URL.createObjectURL(blob);
    this.objectUrlCache.set(clean, url);
    this.createdObjectUrls.push(url);
    return url;
  }

  public revokeObjectUrls(): void {
    for (const url of this.createdObjectUrls) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }
    this.createdObjectUrls = [];
    this.objectUrlCache.clear();
  }
}

export function guessMimeType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    html: 'text/html',
    xhtml: 'application/xhtml+xml',
    xml: 'application/xml',
    css: 'text/css',
    js: 'application/javascript',
    ncx: 'application/x-dtbncx+xml',
    otf: 'font/otf',
    ttf: 'font/ttf',
    woff: 'font/woff',
    woff2: 'font/woff2',
  };
  return mimeMap[ext] || 'application/octet-stream';
}
