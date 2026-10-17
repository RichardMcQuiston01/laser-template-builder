import { describe, expect, it } from 'vitest';
import { extractLightBurnTokens, renderLightBurnFile, validateLightBurnXml } from './lightburn';
import type { TextTemplateVariable } from '../../types';

const xml = '<?xml version="1.0"?><LightBurnProject><Shape Type="Text" Str="{{Name}}"/></LightBurnProject>';

describe('lightburn tokens', () => {
  it('extracts braced tokens', () => {
    expect(extractLightBurnTokens(xml)).toEqual(['{{Name}}']);
  });

  it.each(['{{Name}}', 'Name'])('substitutes a variable stored as %s', (token) => {
    const variable: TextTemplateVariable = { token, label: 'Name', defaultValue: '' };
    expect(renderLightBurnFile(xml, [variable], { [token]: 'Ada' })).toContain('Str="Ada"');
  });

  it('escapes values so they stay inside the attribute', () => {
    const variable: TextTemplateVariable = { token: '{{Name}}', label: 'Name', defaultValue: '' };
    const out = renderLightBurnFile(xml, [variable], { '{{Name}}': '"/><x a="' });
    expect(out).not.toContain('"/><x');
    expect(out).toContain('Str="&quot;/&gt;&lt;x a=&quot;"');
  });
});

describe('validateLightBurnXml', () => {
  it('requires a LightBurnProject root', () => {
    expect(validateLightBurnXml(xml)).toBe(true);
    expect(validateLightBurnXml('<svg/>')).toBe(false);
  });
});
