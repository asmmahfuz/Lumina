/**
 * Lumina Reader - File Export & Save Utility
 * Handles downloading/saving ArrayBuffer book archives to the user's filesystem
 */

export function downloadArrayBuffer(
  data: ArrayBuffer,
  fileName: string,
  mimeType = 'application/octet-stream'
): void {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
