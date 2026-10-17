// Handles xTool Creative Space .xcs files (plain JSON format).

import {
  assertXcsFormat,
  readXcsFile as xcsRead,
  extractXcsTokens as xcsExtract,
  renderXcsFile as xcsRender,
} from '@richardmcquiston01/unofficial-xcs-writer';
import { toBareToken, toBracedToken } from '../utils/tokens';
import type { TemplateVariable } from '../../types';

/** Returns true if the buffer is a valid .xcs file, false otherwise. */
export function validateXcs(buffer: ArrayBuffer): boolean {
  try {
    assertXcsFormat(buffer);
    return true;
  } catch {
    return false;
  }
}

/** Decodes a .xcs ArrayBuffer to its raw JSON string. */
export function readXcsFile(buffer: ArrayBuffer): string {
  return xcsRead(buffer);
}

/** Scans a .xcs buffer and returns all placeholders found in text display elements, as `{{token}}`. */
export function extractXcsTokens(buffer: ArrayBuffer): string[] {
  return xcsExtract(buffer).map(toBracedToken);
}

/**
 * Applies variable substitution to a .xcs buffer and returns the updated
 * file content as a Uint8Array ready for download. Variable tokens may be
 * braced (`{{name}}`) or bare (`name`).
 *
 * Changed TEXT displays are laid out again; supply `fonts` (font family →
 * font file bytes) so they use the design's font. Families that are omitted
 * fall back to the writer's bundled default font.
 */
export function renderXcsFile(
  buffer: ArrayBuffer,
  variables: TemplateVariable[],
  values: Record<string, string>,
  fonts?: Record<string, ArrayBuffer>,
): Uint8Array {
  // The writer expects bare tokens and inserts values with String.replaceAll,
  // which expands `$` patterns; doubling `$` makes values literal.
  const bareVariables = variables.map((variable) => ({
    ...variable,
    token: toBareToken(variable.token),
  }));
  const literalValues: Record<string, string> = {};
  for (const variable of variables) {
    const value = values[variable.token] ?? variable.defaultValue ?? '';
    literalValues[toBareToken(variable.token)] = value.replace(/\$/g, '$$$$');
  }
  return xcsRender(buffer, bareVariables, literalValues, fonts);
}
