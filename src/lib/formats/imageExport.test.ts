import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderImageAsPng, renderImageAsSvg } from './imageExport';
import type { ImageTextboxVariable } from '../../types';

const box: ImageTextboxVariable = {
  kind: 'textbox',
  token: 't',
  label: 'T',
  defaultValue: '',
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  properties: { fontFamily: 'Fo"nt' },
};

function mockFetch(init: { ok?: boolean; status?: number; type?: string }): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: init.ok ?? true,
      status: init.status ?? 200,
      statusText: '',
      headers: new Headers(init.type ? { 'Content-Type': init.type } : {}),
      blob: async () => new Blob(['x'], { type: init.type }),
    })),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('renderImageAsSvg', () => {
  it('escapes text, quotes, and the font family, and splits lines into tspans', async () => {
    mockFetch({ type: 'image/png' });
    const svg = await renderImageAsSvg('https://example.com/a.png', 100, 100, [box], {
      t: `a<b & "c"\nsecond`,
    });
    expect(svg).toContain('a&lt;b &amp; &quot;c&quot;');
    expect(svg).toContain('font-family="Fo&quot;nt"');
    expect(svg.match(/<tspan/g)).toHaveLength(2);
  });

  it('rejects disallowed URL schemes', async () => {
    mockFetch({ type: 'image/png' });
    await expect(renderImageAsSvg('javascript:alert(1)', 10, 10, [], {})).rejects.toThrow(/not allowed/);
    await expect(renderImageAsSvg('file:///etc/passwd', 10, 10, [], {})).rejects.toThrow(/not allowed/);
  });

  it('rejects failed and non-image responses', async () => {
    mockFetch({ ok: false, status: 404, type: 'text/html' });
    await expect(renderImageAsSvg('https://example.com/a.png', 10, 10, [], {})).rejects.toThrow(/HTTP 404/);
    mockFetch({ type: 'application/json' });
    await expect(renderImageAsSvg('https://example.com/a.png', 10, 10, [], {})).rejects.toThrow(/Content-Type/);
  });
});

describe('renderImageAsPng', () => {
  it('refuses canvases beyond the size budget', async () => {
    await expect(renderImageAsPng('<svg/>', 20000, 10)).rejects.toThrow(/Cannot create/);
    await expect(renderImageAsPng('<svg/>', 10000, 10000)).rejects.toThrow(/Cannot create/);
    await expect(renderImageAsPng('<svg/>', Infinity, 10)).rejects.toThrow(/Cannot create/);
  });
});
