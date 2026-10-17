// Browser file download helper shared by the export components.

const INVALID_FILENAME_CHARS = /[\\/:*?"<>|\u0000-\u001F]/g;
const REVOKE_DELAY_MS = 1000;

/**
 * Reduces a user-supplied name to a single safe path segment and appends
 * `extension` (e.g. ".svg") unless the name already ends with it.
 */
export function sanitizeFilename(name: string, extension: string, fallback = 'template'): string {
  const cleaned = name
    .replace(INVALID_FILENAME_CHARS, '_')
    .trim()
    .replace(/^\.+/, '')
    .replace(/[. ]+$/, '');
  const base = cleaned || fallback;
  return base.toLowerCase().endsWith(extension.toLowerCase()) ? base : `${base}${extension}`;
}

/** Triggers a browser download for `blob`, keeping the object URL alive until the browser has read it. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}
