import { describe, expect, it } from 'vitest';
import { applySubstitution, extractTokens } from './substitution';
import type { TextTemplateVariable } from '../../types';

const textVariable = (token: string, defaultValue = ''): TextTemplateVariable => ({
  token,
  label: token,
  defaultValue,
});

describe('applySubstitution', () => {
  it('inserts $ patterns literally', () => {
    const result = applySubstitution(
      'prefix {{name}} suffix',
      [textVariable('{{name}}')],
      { '{{name}}': "cost $' end $$ and $& $`" },
    );
    expect(result).toBe("prefix cost $' end $$ and $& $` suffix");
  });

  it('does not scan inserted values for later tokens', () => {
    const result = applySubstitution(
      'A={{a}}; B={{b}}',
      [textVariable('{{a}}'), textVariable('{{b}}')],
      { '{{a}}': 'see {{b}}', '{{b}}': 'SECRET' },
    );
    expect(result).toBe('A=see {{b}}; B=SECRET');
  });

  it('ignores empty tokens', () => {
    expect(applySubstitution('abc', [textVariable(''), textVariable('{{}}')], {})).toBe('abc');
  });

  it('treats a bare token as {{token}} and leaves other occurrences alone', () => {
    const result = applySubstitution(
      '<text name="name">{{name}}</text>',
      [textVariable('name')],
      { name: 'Ada' },
    );
    expect(result).toBe('<text name="name">Ada</text>');
  });

  it('falls back to the default value and applies the value transform', () => {
    const result = applySubstitution(
      '{{x}}',
      [textVariable('{{x}}', 'a<b')],
      {},
      (value) => value.toUpperCase(),
    );
    expect(result).toBe('A<B');
  });
});

describe('extractTokens', () => {
  it('returns unique braced tokens', () => {
    expect(extractTokens('{{a}} {{b}} {{a}}')).toEqual(['{{a}}', '{{b}}']);
  });
});
