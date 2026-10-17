import { describe, expect, it } from 'vitest';
import { getSafeHref } from './TemplateHeader';

describe('getSafeHref', () => {
  it.each(['/templates', '#', '../up', '?q=1', 'https://example.com/x', 'http://example.com', '//cdn.example.com'])(
    'allows %s',
    (href) => expect(getSafeHref(href)).toBe(href),
  );

  it.each(['javascript:alert(1)', ' JavaScript:alert(1)', 'java\tscript:alert(1)', 'data:text/html,x', 'vbscript:x'])(
    'blocks %s',
    (href) => expect(getSafeHref(href)).toBe('#'),
  );
});
