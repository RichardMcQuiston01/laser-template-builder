// Normalises token shapes. The public shape is braced ("{{name}}"); the
// delegated LightBurn/XCS writers use the bare name ("name").

const BRACED_TOKEN_PATTERN = /^\{\{([^{}]+)\}\}$/;

/** Returns the bare token name, stripping one `{{ }}` pair when present. */
export function toBareToken(token: string): string {
  const match = BRACED_TOKEN_PATTERN.exec(token);
  return match ? match[1] : token;
}

/** Returns the braced `{{name}}` form of a token, whatever shape was supplied. */
export function toBracedToken(token: string): string {
  return `{{${toBareToken(token)}}}`;
}
