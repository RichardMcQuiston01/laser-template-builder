// Replaces {{token}} placeholders in a string with provided values.

import type { TemplateVariable } from '../../types';
import { toBareToken, toBracedToken } from './tokens';

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Applies variable substitution to a raw template string.
 *
 * Only whole `{{name}}` placeholders are replaced. A variable token may be
 * stored braced (`{{name}}`) or bare (`name`); both match `{{name}}`. Values
 * are inserted literally (no `$` replacement patterns) in a single pass, so
 * inserted text is never scanned for further tokens.
 *
 * @param source         - Raw file content (SVG XML, LightBurn XML, etc.)
 * @param variables      - Variable definitions from the template record.
 * @param values         - Map of token -> user-supplied value.
 * @param transformValue - Optional hook applied to each value before insertion
 *                         (e.g. XML escaping).
 * @returns              - The content with all known tokens replaced.
 */
export function applySubstitution(
  source: string,
  variables: TemplateVariable[],
  values: Record<string, string>,
  transformValue: (value: string) => string = (value) => value,
): string {
  const replacementByPlaceholder = new Map<string, string>();

  for (const variable of variables) {
    if (toBareToken(variable.token) === '') continue;
    const rawValue = values[variable.token] ?? variable.defaultValue ?? '';
    replacementByPlaceholder.set(toBracedToken(variable.token), transformValue(rawValue));
  }

  if (replacementByPlaceholder.size === 0) return source;

  const alternation = Array.from(replacementByPlaceholder.keys())
    .map(escapeRegExp)
    .join('|');

  return source.replace(
    new RegExp(alternation, 'g'),
    (placeholder) => replacementByPlaceholder.get(placeholder) ?? placeholder,
  );
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
