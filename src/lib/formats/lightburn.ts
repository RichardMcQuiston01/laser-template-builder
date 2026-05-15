// Parses and writes LightBurn .lbrn2 files (XML format).

import { XMLParser, XMLBuilder, type X2jOptions, type XmlBuilderOptions } from 'fast-xml-parser';
import { applySubstitution, extractTokens } from '../utils/substitution';
import type { TemplateVariable } from '../../types';

const PARSER_OPTIONS: X2jOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  preserveOrder: true,
  trimValues: false,
};

const BUILDER_OPTIONS: XmlBuilderOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  preserveOrder: true,
  format: true,
};

/** Scans a .lbrn2 XML string and returns all {{token}} placeholders found. */
export function extractLightBurnTokens(xmlContent: string): string[] {
  return extractTokens(xmlContent);
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
  return applySubstitution(xmlContent, variables, values);
}

/** Minimal structural validation — checks that the root element is <LightBurnProject>. */
export function validateLightBurnXml(xmlContent: string): boolean {
  const parser = new XMLParser(PARSER_OPTIONS);

  try {
    const parsed = parser.parse(xmlContent) as unknown[];
    return Array.isArray(parsed) && parsed.some(
      (node) =>
        typeof node === 'object' &&
        node !== null &&
        'LightBurnProject' in node,
    );
  } catch {
    return false;
  }
}
