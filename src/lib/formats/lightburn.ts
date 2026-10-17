// Parses and writes LightBurn .lbrn2 files (XML format).

import {
  assertLbrn2Format,
  extractLbrn2Tokens as lbrn2Extract,
  escapeXml as lbrn2EscapeXml,
} from '@richardmcquiston01/unofficial-lb-writer';
import { applySubstitution } from '../utils/substitution';
import { toBracedToken } from '../utils/tokens';
import type { TemplateVariable } from '../../types';

/** Scans a .lbrn2 XML string and returns all placeholders found, as `{{token}}`. */
export function extractLightBurnTokens(xmlContent: string): string[] {
  return lbrn2Extract(xmlContent).map(toBracedToken);
}

/**
 * Applies variable substitution to a .lbrn2 XML string and returns the
 * updated file content ready for export. Variable tokens may be braced
 * (`{{name}}`) or bare (`name`). Values are XML-escaped for attribute use.
 */
export function renderLightBurnFile(
  xmlContent: string,
  variables: TemplateVariable[],
  values: Record<string, string>,
): string {
  return applySubstitution(xmlContent, variables, values, lbrn2EscapeXml);
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
