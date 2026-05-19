// Handles xTool Creative Space .xcs files (plain JSON format).

import {
  assertXcsFormat,
  readXcsFile as xcsRead,
  extractXcsTokens as xcsExtract,
  renderXcsFile as xcsRender,
} from '@richardmcquiston01/unofficial-xcs-writer';
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

/** Scans a .xcs buffer and returns all {{token}} placeholders found in text display elements. */
export function extractXcsTokens(buffer: ArrayBuffer): string[] {
  return xcsExtract(buffer);
}

/**
 * Applies variable substitution to a .xcs buffer and returns the updated
 * file content as a Uint8Array ready for download.
 */
export function renderXcsFile(
  buffer: ArrayBuffer,
  variables: TemplateVariable[],
  values: Record<string, string>,
): Uint8Array {
  return xcsRender(buffer, variables, values);
}
