/**
 * Lumina Reader - Safe Archive Decompressor with Zip-Slip Guard
 * Supports zero-RAM disk streaming via Rust IPC on desktop and JSZip fallback on web
 */

import JSZip from 'jszip';
import { ZipSlipCheckResult } from '@/types/epub';

interface RawDiskInspection {
  entries: { path: string; size: number; is_dir: boolean }[];
  rejected_entries: string[];
}

export function validateZipPath(rawPath: string): ZipSlipCheckResult {
  if (!rawPath || typeof rawPath !== 'string') {
    return { isSafe: false, rejectedPath: rawPath, reason: 'Empty or non-string entry path' };
  }
  if (rawPath.includes('\0')) {
    return { isSafe: false, rejectedPath: rawPath, reason: 'Entry path contains null bytes' };
  }

  const normalized = rawPath.replace(/\\/g, '/');
  if (normalized.startsWith('/') || /^[a-zA-Z]:/.test(normalized)) {
    return { isSafe: false, rejectedPath: rawPath, reason: 'Absolute path or drive prefix not allowed' };
  }

  const lower = normalized.toLowerCase();
  if (lower.includes('%2e%2e') || lower.includes('..%2f') || lower.includes('%2f..')) {
    return { isSafe: false, rejectedPath: rawPath, reason: 'URL-encoded path traversal sequence detected' };
  }

  const segments = normalized.split('/');
  let depth = 0;
  for (const seg of segments) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') {
      depth--;
      if (depth < 0) return { isSafe: false, rejectedPath: rawPath, reason: 'Zip-Slip path traversal (..) escapes root' };
    } else {
      depth++;
    }
  }
  return { isSafe: true };
}

export function sanitizeArchivePath(rawPath: string): string {
  const normalized = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const cleanSegments: string[] = [];
  for (const seg of normalized.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') cleanSegments.pop();
    else cleanSegments.push(seg);
  }
  return cleanSegments.join('/');
}

const MAX_OBJECT_URL_CACHE = 24;

export class SafeArchiveReader {
  private zip?: JSZip;
  private diskFilePath?: string;
  private diskEntryMap = new Map<string, string>(); // sanitized/raw -> exact zip entry name
  private safeFiles = new Map<string, JSZip.JSZipObject>();
  private zipSlipAlerts: string[] = [];
  private objectUrlCache = new Map<string, string>(); // LRU order

  private constructor(zip?: JSZip, diskFilePath?: string) {
    this.zip = zip;
    this.diskFilePath = diskFilePath;
  }

  public static async fromData(data: ArrayBuffer | Blob): Promise<SafeArchiveReader> {
    const zip = new JSZip();
    await zip.loadAsync(data);
    const reader = new SafeArchiveReader(zip);
    reader.inspectAndIndexEntries();
    return reader;
  }

  public static async fromFilePath(filePath: string): Promise<SafeArchiveReader> {
    const { invoke } = await import('@tauri-apps/api/core');
    const result = await invoke<RawDiskInspection>('inspect_epub_archive', { filePath });
    const reader = new SafeArchiveReader(undefined, filePath);

    for (const bad of result.rejected_entries || []) {
      reader.zipSlipAlerts.push(`[Zip-Slip Blocked] Entry "${bad}"`);
    }

    for (const entry of result.entries || []) {
      if (entry.is_dir) continue;
      const clean = sanitizeArchivePath(entry.path);
      reader.diskEntryMap.set(clean, entry.path);
      if (clean !== entry.path) reader.diskEntryMap.set(entry.path, entry.path);
    }

    return reader;
  }

  private inspectAndIndexEntries(): void {
    if (!this.zip) return;
    this.zip.forEach((relativePath, entry) => {
      const validation = validateZipPath(relativePath);
      if (!validation.isSafe) {
        const alert = `[Zip-Slip Blocked] Entry "${relativePath}": ${validation.reason}`;
        console.warn(alert);
        this.zipSlipAlerts.push(alert);
        return;
      }

      const cleanPath = sanitizeArchivePath(relativePath);
      this.safeFiles.set(cleanPath, entry);
      if (cleanPath !== relativePath) this.safeFiles.set(relativePath, entry);
    });
  }

  public getSafeFileList(): string[] {
    if (this.diskFilePath) {
      return Array.from(new Set(this.diskEntryMap.values()));
    }
    return Array.from(this.safeFiles.keys());
  }

  public getZipSlipAlerts(): string[] {
    return [...this.zipSlipAlerts];
  }

  public hasFile(path: string): boolean {
    const clean = sanitizeArchivePath(path);
    if (this.diskFilePath) {
      return this.diskEntryMap.has(clean) || this.diskEntryMap.has(path);
    }
    return this.safeFiles.has(clean) || this.safeFiles.has(path);
  }

  private getRawDiskName(path: string): string {
    const clean = sanitizeArchivePath(path);
    const raw = this.diskEntryMap.get(clean) || this.diskEntryMap.get(path);
    if (!raw) throw new Error(`File not found in archive: ${path}`);
    return raw;
  }

  private getZipEntry(path: string): JSZip.JSZipObject {
    const clean = sanitizeArchivePath(path);
    const entry = this.safeFiles.get(clean) || this.safeFiles.get(path);
    if (!entry) throw new Error(`File not found in archive: ${path}`);
    return entry;
  }

  public async readAsText(path: string): Promise<string> {
    if (this.diskFilePath) {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<string>('read_archive_entry_text', {
        filePath: this.diskFilePath,
        entryName: this.getRawDiskName(path),
      });
    }
    return await this.getZipEntry(path).async('string');
  }

  public async readAsArrayBuffer(path: string): Promise<ArrayBuffer> {
    if (this.diskFilePath) {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<ArrayBuffer>('read_archive_entry_bytes', {
        filePath: this.diskFilePath,
        entryName: this.getRawDiskName(path),
      });
    }
    return await this.getZipEntry(path).async('arraybuffer');
  }

  public async readAsBlob(path: string, mimeType?: string): Promise<Blob> {
    const buffer = await this.readAsArrayBuffer(path);
    return new Blob([buffer], { type: mimeType || guessMimeType(path) });
  }

  public async readAsObjectUrl(path: string, mimeType?: string): Promise<string> {
    const clean = sanitizeArchivePath(path);
    const existing = this.objectUrlCache.get(clean);
    if (existing) {
      // Touch LRU position
      this.objectUrlCache.delete(clean);
      this.objectUrlCache.set(clean, existing);
      return existing;
    }

    const blob = await this.readAsBlob(path, mimeType);
    const url = URL.createObjectURL(blob);
    this.objectUrlCache.set(clean, url);

    if (this.objectUrlCache.size > MAX_OBJECT_URL_CACHE) {
      const oldestKey = this.objectUrlCache.keys().next().value;
      if (oldestKey !== undefined) {
        const oldestUrl = this.objectUrlCache.get(oldestKey);
        this.objectUrlCache.delete(oldestKey);
        if (oldestUrl) {
          try { URL.revokeObjectURL(oldestUrl); } catch { /* ignore */ }
        }
      }
    }

    return url;
  }

  public revokeObjectUrls(): void {
    for (const url of this.objectUrlCache.values()) {
      try { URL.revokeObjectURL(url); } catch { /* ignore */ }
    }
    this.objectUrlCache.clear();
  }
}

export function guessMimeType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
    webp: 'image/webp', svg: 'image/svg+xml', html: 'text/html', xhtml: 'application/xhtml+xml',
    xml: 'application/xml', css: 'text/css', js: 'application/javascript',
    ncx: 'application/x-dtbncx+xml', otf: 'font/otf', ttf: 'font/ttf',
    woff: 'font/woff', woff2: 'font/woff2',
  };
  return mimeMap[ext] || 'application/octet-stream';
}
