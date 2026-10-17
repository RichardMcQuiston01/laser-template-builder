import { describe, expect, it } from 'vitest';
import { computeFitFontSize, measureFitFontSize } from './fitText';

describe('computeFitFontSize', () => {
  it.each([
    [Infinity, 100],
    [100, Infinity],
    [NaN, 100],
    [0, 100],
    [100, 0.5],
  ])('returns the minimum for a non-usable box (%s x %s)', (width, height) => {
    expect(computeFitFontSize('hello', width, height)).toBe(8);
    expect(measureFitFontSize('hello', width, height).fits).toBe(false);
  });

  it('removes its measuring element', () => {
    computeFitFontSize('hello', 100, 100);
    expect(document.body.children).toHaveLength(0);
  });
});
