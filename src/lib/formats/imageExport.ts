// Client-side only: renders an image template + textbox values to SVG or PNG.

import { computeFitFontSize } from '../utils/fitText';
import type { ImageTextboxVariable } from '../../types';

/** Converts an image URL to a base64 data URL via FileReader. */
async function imageUrlToDataUrl(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Renders the image template as an SVG string with text overlays.
 */
export async function renderImageAsSvg(
  imageUrl: string,
  naturalWidth: number,
  naturalHeight: number,
  variables: ImageTextboxVariable[],
  values: Record<string, string>,
): Promise<string> {
  const dataUrl = await imageUrlToDataUrl(imageUrl);

  const textboxElements = variables.map((v) => {
    const xPx = (v.x / 100) * naturalWidth;
    const yPx = (v.y / 100) * naturalHeight;
    const wPx = (v.width / 100) * naturalWidth;
    const hPx = (v.height / 100) * naturalHeight;
    const text = values[v.token] ?? v.defaultValue;
    const fontFamily = v.properties?.fontFamily ?? 'sans-serif';
    const textAlign = v.properties?.textAlign ?? 'left';
    const fontSize = computeFitFontSize(text, wPx, hPx, fontFamily);

    const textAnchor =
      textAlign === 'center' ? 'middle' : textAlign === 'right' ? 'end' : 'start';
    const xRef =
      textAlign === 'center' ? xPx + wPx / 2 : textAlign === 'right' ? xPx + wPx : xPx;

    // Split on explicit newlines; centre the whole text block vertically in the box
    const lines = text.split('\n');
    const lineHeight = fontSize * 1.2;
    const firstY = yPx + hPx / 2 - ((lines.length - 1) * lineHeight) / 2;

    const tspans = lines.map((line, i) =>
      i === 0
        ? `<tspan x="${xRef.toFixed(2)}" y="${firstY.toFixed(2)}">${escapeXml(line || ' ')}</tspan>`
        : `<tspan x="${xRef.toFixed(2)}" dy="${lineHeight.toFixed(2)}">${escapeXml(line || ' ')}</tspan>`,
    ).join('');

    return `  <text font-family="${escapeXml(fontFamily)}" font-size="${fontSize}px" text-anchor="${textAnchor}" dominant-baseline="central" fill="black">${tspans}</text>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${naturalWidth}" height="${naturalHeight}" viewBox="0 0 ${naturalWidth} ${naturalHeight}">
  <image href="${dataUrl}" x="0" y="0" width="${naturalWidth}" height="${naturalHeight}" preserveAspectRatio="none"/>
${textboxElements.join('\n')}
</svg>`;
}

/**
 * Rasterises an SVG string to a PNG Blob via a hidden canvas.
 */
export async function renderImageAsPng(
  svgString: string,
  width: number,
  height: number,
): Promise<Blob> {
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  return new Promise<Blob>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas 2D context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('canvas.toBlob returned null'));
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error('Failed to load SVG for PNG conversion'));
    };
    img.src = svgUrl;
  });
}
