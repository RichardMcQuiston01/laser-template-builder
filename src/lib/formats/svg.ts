// Handles plain SVG template files.

import { applySubstitution, extractTokens } from '../utils/substitution';
import { escapeXml } from '../utils/escape';
import type { TemplateVariable } from '../../types';

/** Returns all {{token}} placeholders found in an SVG string. */
export function extractSvgTokens(svgContent: string): string[] {
  return extractTokens(svgContent);
}

/**
 * Applies variable substitution to an SVG string. Values are XML-escaped, so
 * they stay inside the text or attribute they are written into.
 */
export function renderSvgFile(
  svgContent: string,
  variables: TemplateVariable[],
  values: Record<string, string>,
): string {
  return applySubstitution(svgContent, variables, values, escapeXml);
}

// BOM, whitespace, XML declaration, comments, and DOCTYPE that may precede the root element.
const SVG_PROLOG = /^(?:﻿|\s+|<\?xml[\s\S]*?\?>|<!--[\s\S]*?-->|<!DOCTYPE[^>[]*(?:\[[\s\S]*?\])?\s*>)*/i;
const SVG_ROOT = /^<svg(?=[\s/>])/;

/**
 * Structural sniff: true when the first element after the prolog (BOM,
 * whitespace, XML declaration, comments, DOCTYPE) is `<svg>`. It does not
 * parse the document or make it safe — sanitize SVG (scripts, `foreignObject`,
 * external references) before inlining it in a page.
 */
export function validateSvg(svgContent: string): boolean {
  const body = svgContent.replace(SVG_PROLOG, '');
  return SVG_ROOT.test(body);
}
