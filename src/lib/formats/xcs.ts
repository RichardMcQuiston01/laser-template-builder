// Handles xTool Creative Suite .xcs files.
// An .xcs file is a ZIP archive containing:
//   - project.json  (element tree including text objects)
//   - *.svg         (one or more SVG layers)
//   - thumbnail.png (optional preview)

import JSZip from 'jszip';
import { applySubstitution, extractTokens } from '../utils/substitution';
import type { TemplateVariable } from '../../types';

/**
 * Reads a .xcs ArrayBuffer and returns the raw project.json content string
 * and a map of all other files (SVG layers, thumbnail, etc.).
 */
function assertZipMagic(buffer: ArrayBuffer): void {
  if (buffer.byteLength < 4) throw new Error('File is too small to be a valid .xcs archive.');
  const magic = new DataView(buffer).getUint32(0, false);
  if (magic !== 0x504b0304 && magic !== 0x504b0506 && magic !== 0x504b0708) {
    throw new Error(
      'This file does not appear to be a valid .xcs archive. ' +
      'Only .xcs files exported from xTool Creative Space are supported.',
    );
  }
}

export async function readXcsArchive(
  buffer: ArrayBuffer,
): Promise<{ projectJson: string; assets: Map<string, string | Uint8Array> }> {
  assertZipMagic(buffer);
  const zip = await JSZip.loadAsync(buffer);
  const assets = new Map<string, string | Uint8Array>();
  let projectJson = '';

  for (const [filename, file] of Object.entries(zip.files)) {
    if (file.dir) continue;

    if (filename === 'project.json') {
      projectJson = await file.async('string');
    } else if (filename.endsWith('.svg')) {
      assets.set(filename, await file.async('string'));
    } else {
      assets.set(filename, await file.async('uint8array'));
    }
  }

  if (!projectJson) {
    throw new Error('Invalid .xcs file: project.json not found in archive.');
  }

  return { projectJson, assets };
}

/**
 * Scans an .xcs archive buffer and extracts all {{token}} placeholders
 * found in both project.json and any embedded SVG files.
 */
export async function extractXcsTokens(buffer: ArrayBuffer): Promise<string[]> {
  const { projectJson, assets } = await readXcsArchive(buffer);
  const allContent = [projectJson, ...Array.from(assets.values())
    .filter((v): v is string => typeof v === 'string')]
    .join('\n');

  return extractTokens(allContent);
}

/**
 * Applies variable substitution to an .xcs archive and returns a new ZIP
 * buffer ready for download.
 */
export async function renderXcsFile(
  buffer: ArrayBuffer,
  variables: TemplateVariable[],
  values: Record<string, string>,
): Promise<Uint8Array> {
  const { projectJson, assets } = await readXcsArchive(buffer);

  const updatedJson = applySubstitution(projectJson, variables, values);

  const zip = new JSZip();
  zip.file('project.json', updatedJson);

  for (const [filename, content] of assets.entries()) {
    if (typeof content === 'string') {
      zip.file(filename, applySubstitution(content, variables, values));
    } else {
      zip.file(filename, content);
    }
  }

  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}
