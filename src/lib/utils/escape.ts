// XML escaping shared by every exporter that writes user text into markup.

// Characters XML 1.0 forbids (everything below U+0020 except tab, LF, CR, plus U+FFFE/U+FFFF).
const XML_FORBIDDEN_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;

/**
 * Escapes text for use in an XML text node or attribute value. Characters
 * that XML 1.0 cannot represent are removed.
 */
export function escapeXml(text: string): string {
  return text
    .replace(XML_FORBIDDEN_CHARS, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
