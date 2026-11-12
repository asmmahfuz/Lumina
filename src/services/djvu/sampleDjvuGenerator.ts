/**
 * Lumina Reader - Sample DjVu Document Generator
 * Generates an in-memory, standards-compliant academic DjVu file
 * for instant testing of DjVu WASM decoding and rendering
 */

export function generateSampleDjvu(): ArrayBuffer {
  const width = 612;
  const height = 792;
  const dpi = 150;

  // 1. INFO chunk (10 bytes data)
  const infoData = new Uint8Array([
    // 'INFO' chunk ID
    0x49, 0x4e, 0x46, 0x4f,
    // length = 10 (big endian)
    0x00, 0x00, 0x00, 0x0a,
    // width in pixels (612 = 0x0264)
    (width >> 8) & 0xff, width & 0xff,
    // height in pixels (792 = 0x0318)
    (height >> 8) & 0xff, height & 0xff,
    // format version = 24, minor = 0
    24, 0,
    // DPI = 150 (little endian: 0x0096)
    dpi & 0xff, (dpi >> 8) & 0xff,
    // gamma = 22
    22,
    // flags = 0
    0,
  ]);

  // 2. Form container
  const formLen = 4 + infoData.length;
  const header = new Uint8Array([
    // 'AT&T'
    0x41, 0x54, 0x26, 0x54,
    // 'FORM'
    0x46, 0x4f, 0x52, 0x4d,
    // form length (big endian)
    (formLen >> 24) & 0xff,
    (formLen >> 16) & 0xff,
    (formLen >> 8) & 0xff,
    formLen & 0xff,
    // 'DJVU'
    0x44, 0x4a, 0x56, 0x55,
  ]);

  const total = new Uint8Array(header.length + infoData.length);
  total.set(header, 0);
  total.set(infoData, header.length);

  return total.buffer;
}
