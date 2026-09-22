// Parses and writes LightBurn .lbrn2 files (XML format).

import {
  assertLbrn2Format,
  extractLbrn2Tokens as lbrn2Extract,
  renderLbrn2File as lbrn2Render,
} from '@richardmcquiston01/unofficial-lb-writer';
import type { TemplateVariable } from '../../types';

/** Scans a .lbrn2 XML string and returns all {{token}} placeholders found. */
export function extractLightBurnTokens(xmlContent: string): string[] {
  return lbrn2Extract(xmlContent);
}

/**
 * Applies variable substitution to a .lbrn2 XML string and returns the
 * updated file content ready for export.
 */
export function renderLightBurnFile(
  xmlContent: string,
  variables: TemplateVariable[],
  values: Record<string, string>,
): string {
  return lbrn2Render(xmlContent, variables, values);
}

/** Minimal structural validation — checks that the root element is <LightBurnProject>. */
export function validateLightBurnXml(xmlContent: string): boolean {
  try {
    assertLbrn2Format(xmlContent);
    return true;
  } catch {
    return false;
  }
}
