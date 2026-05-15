// Handles plain SVG template files.

import { applySubstitution, extractTokens } from '../utils/substitution';
import type { TemplateVariable } from '../../types';

/** Returns all {{token}} placeholders found in an SVG string. */
export function extractSvgTokens(svgContent: string): string[] {
  return extractTokens(svgContent);
}

/** Applies variable substitution to an SVG string. */
export function renderSvgFile(
  svgContent: string,
  variables: TemplateVariable[],
  values: Record<string, string>,
): string {
  return applySubstitution(svgContent, variables, values);
}

/** Basic structural check — confirms the string looks like an SVG document. */
export function validateSvg(svgContent: string): boolean {
  return svgContent.trimStart().startsWith('<svg') ||
    svgContent.includes('<svg ') ||
    svgContent.includes('<svg\n');
}
