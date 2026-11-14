/**
 * Lumina Reader - Tauri On-Demand PDF Byte-Range Transport
 * Streams 64KB PDF chunks directly from disk via Rust IPC instead of loading whole files into RAM.
 */

import * as pdfjsLib from 'pdfjs-dist';
import { invoke } from '@tauri-apps/api/core';

export const PDF_RANGE_CHUNK_SIZE = 65536; // 64 KB chunks

export class TauriPdfRangeTransport extends pdfjsLib.PDFDataRangeTransport {
  private filePath: string;
  private isAborted = false;

  constructor(filePath: string, length: number, initialData: Uint8Array, fileName: string) {
    super(length, initialData, false, fileName);
    this.filePath = filePath;
  }

  public requestDataRange(begin: number, end: number): void {
    if (this.isAborted || end <= begin) return;
    const len = Math.min(end - begin, this.length - begin);
    if (len <= 0) return;

    invoke<ArrayBuffer>('read_file_range', {
      path: this.filePath,
      offset: begin,
      length: len,
    })
      .then((buf) => {
        if (!this.isAborted) {
          this.onDataRange(begin, new Uint8Array(buf));
        }
      })
      .catch((err) => {
        console.warn(`PDF range read error [${begin}..${end}]:`, err);
      });
  }

  public abort(): void {
    this.isAborted = true;
    super.abort();
  }
}

export async function createTauriPdfRangeTransport(
  filePath: string,
  fileName: string
): Promise<{ transport: TauriPdfRangeTransport; fileSize: number }> {
  const fileSize = await invoke<number>('get_file_size', { path: filePath });
  const initialLength = Math.min(PDF_RANGE_CHUNK_SIZE, fileSize);
  const initialBuf =
    initialLength > 0
      ? await invoke<ArrayBuffer>('read_file_range', {
          path: filePath,
          offset: 0,
          length: initialLength,
        })
      : new ArrayBuffer(0);

  const transport = new TauriPdfRangeTransport(
    filePath,
    fileSize,
    new Uint8Array(initialBuf),
    fileName
  );
  transport.transportReady();
  return { transport, fileSize };
}
