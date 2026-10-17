import { describe, expect, it } from 'vitest';
import { sanitizeFilename } from './download';

describe('sanitizeFilename', () => {
  it('keeps a single safe path segment and adds the extension once', () => {
    expect(sanitizeFilename('../a/b:c*?.svg', '.svg')).toBe('_a_b_c__.svg');
    expect(sanitizeFilename('Name', '.png')).toBe('Name.png');
    expect(sanitizeFilename('Name.PNG', '.png')).toBe('Name.PNG');
  });

  it('falls back when nothing usable remains', () => {
    expect(sanitizeFilename('...', '.svg')).toBe('template.svg');
  });
});
