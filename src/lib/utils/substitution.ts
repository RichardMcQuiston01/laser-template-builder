// Replaces {{token}} placeholders in a string with provided values.

import type { TemplateVariable } from '../../types';

/**
 * Applies variable substitution to a raw template string.
 *
 * @param source         - Raw file content (SVG XML, LightBurn XML, etc.)
 * @param variables      - Variable definitions from the template record.
 * @param values         - Map of token -> user-supplied value.
 * @returns              - The content with all known tokens replaced.
 */
export function applySubstitution(
  source: string,
  variables: TemplateVariable[],
  values: Record<string, string>,
): string {
  let result = source;

  for (const variable of variables) {
    const replacement = values[variable.token] ?? variable.defaultValue;
    // Escape special regex characters inside the token string.
    const escaped = variable.token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escaped, 'g'), replacement);
  }

  return result;
}

/**
 * Scans raw file content for {{token}} patterns and returns
 * a list of unique tokens found, suitable for building a TemplateVariable list.
 */
export function extractTokens(source: string): string[] {
  const matches = source.matchAll(/\{\{([^}]+)\}\}/g);
  const tokens = new Set<string>();

  for (const match of matches) {
    tokens.add(`{{${match[1]}}}`);
  }

  return Array.from(tokens);
}
