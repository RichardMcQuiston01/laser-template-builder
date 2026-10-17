import { describe, expect, it } from 'vitest';
import { renderSvgFile, validateSvg } from './svg';
import type { TextTemplateVariable } from '../../types';

describe('validateSvg', () => {
  it('accepts an XML declaration followed by <svg>', () => {
    expect(validateSvg('<?xml version="1.0"?><svg></svg>')).toBe(true);
  });

  it('accepts a BOM, comments, and a DOCTYPE before the root', () => {
    expect(validateSvg('﻿  <?xml version="1.0"?>\n<!-- c -->\n<!DOCTYPE svg>\n<svg xmlns="x"/>')).toBe(true);
  });

  it('accepts <svg> with no attributes', () => {
    expect(validateSvg('<svg></svg>')).toBe(true);
  });

  it('rejects prose that mentions an svg tag', () => {
    expect(validateSvg('notes: use an <svg icon later')).toBe(false);
  });

  it('rejects other root elements and look-alike names', () => {
    expect(validateSvg('<html><svg></svg></html>')).toBe(false);
    expect(validateSvg('<svgfoo></svgfoo>')).toBe(false);
    expect(validateSvg('')).toBe(false);
  });
});

describe('renderSvgFile escaping', () => {
  const variable: TextTemplateVariable = { token: '{{c}}', label: 'c', defaultValue: '' };

  it('keeps an attribute breakout inside the attribute', () => {
    const out = renderSvgFile('<rect fill="{{c}}"/>', [variable], { '{{c}}': '" onload="x' });
    expect(out).toBe('<rect fill="&quot; onload=&quot;x"/>');
  });

  it('escapes markup in text nodes and strips XML-forbidden characters', () => {
    const out = renderSvgFile('<text>{{c}}</text>', [variable], { '{{c}}': '<script>&\u0001' });
    expect(out).toBe('<text>&lt;script&gt;&amp;</text>');
  });
});
