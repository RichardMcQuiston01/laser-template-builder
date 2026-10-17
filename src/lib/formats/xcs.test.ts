import { describe, expect, it, vi } from 'vitest';

const render = vi.fn((..._args: unknown[]) => new Uint8Array());
vi.mock('@richardmcquiston01/unofficial-xcs-writer', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  renderXcsFile: (...args: unknown[]) => render(...args),
}));

import { renderXcsFile } from './xcs';
import type { TextTemplateVariable } from '../../types';

describe('renderXcsFile', () => {
  const variable: TextTemplateVariable = { token: '{{Name}}', label: 'Name', defaultValue: '' };

  it('passes bare tokens, literal values, and the font map to the writer', () => {
    const fonts = { Arial: new ArrayBuffer(4) };
    renderXcsFile(new ArrayBuffer(0), [variable], { '{{Name}}': "$' $$ $&" }, fonts);

    const [, variables, values, passedFonts] = render.mock.calls[0] as [
      unknown,
      TextTemplateVariable[],
      Record<string, string>,
      Record<string, ArrayBuffer>,
    ];
    expect(variables[0].token).toBe('Name');
    // The writer's String.replaceAll turns "$$" back into "$".
    expect(values.Name).toBe("$$' $$$$ $$&");
    expect(passedFonts).toBe(fonts);
  });
});
