import { describe, expect, it } from 'vitest';
import { renderXcsFile } from './xcs';
import type { TextTemplateVariable } from '../../types';

function buildXcs(text: string): ArrayBuffer {
  const project = { canvas: [{ displays: [{ type: 'TEXT', text, x: 0, y: 0, style: {} }] }] };
  return new TextEncoder().encode(JSON.stringify(project)).buffer as ArrayBuffer;
}

function renderedText(bytes: Uint8Array): string {
  return JSON.parse(new TextDecoder().decode(bytes)).canvas[0].displays[0].text as string;
}

describe('renderXcsFile with the real writer', () => {
  const variables: TextTemplateVariable[] = [
    { token: '{{a}}', label: 'a', defaultValue: '' },
    { token: '{{b}}', label: 'b', defaultValue: '' },
  ];

  it('inserts $ patterns literally', () => {
    const out = renderXcsFile(buildXcs('{{a}}'), variables, { '{{a}}': "$' $$ $&" });
    expect(renderedText(out)).toBe("$' $$ $&");
  });

  it('does not re-scan inserted values for later tokens', () => {
    const out = renderXcsFile(buildXcs('{{a}}|{{b}}'), variables, { '{{a}}': 'see {{b}}', '{{b}}': 'X' });
    expect(renderedText(out)).toBe('see {{b}}|X');
  });
});
