// Finds the largest integer font-size (px) where text fits within a box.
// Runs client-side only; uses a hidden sentinel DOM element.

let sentinel: HTMLDivElement | null = null;

function getSentinel(): HTMLDivElement {
  if (!sentinel) {
    sentinel = document.createElement('div');
    sentinel.style.cssText =
      'visibility:hidden;position:absolute;top:-9999px;left:-9999px;' +
      'white-space:pre-wrap;word-break:break-word;overflow:hidden;line-height:1.2';
    document.body.appendChild(sentinel);
  }
  return sentinel;
}

/**
 * Returns the largest integer font-size in px such that `text` fits within
 * the given pixel dimensions using the provided font family.
 */
export function computeFitFontSize(
  text: string,
  boxWidthPx: number,
  boxHeightPx: number,
  fontFamily = 'sans-serif',
): number {
  const el = getSentinel();
  el.style.width = `${boxWidthPx}px`;
  el.style.fontFamily = fontFamily;
  el.textContent = text || ' ';

  const MIN = 8;
  const MAX = 200;
  let lo = MIN;
  let hi = MAX;
  let result = MIN;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    el.style.fontSize = `${mid}px`;
    if (el.scrollHeight <= boxHeightPx) {
      result = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return result;
}
