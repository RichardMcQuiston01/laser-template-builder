// Finds the largest integer font-size (px) where text fits within a box.
// Runs client-side only; uses a temporary hidden DOM element.

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 2000;

export interface FitFontSizeResult {
  /** Largest integer size (px) that fits, or the minimum size when none fits. */
  fontSize: number;
  /** False when the text overflows the box even at the minimum size. */
  fits: boolean;
}

/** Like {@link computeFitFontSize}, but also reports whether the text fits at all. */
export function measureFitFontSize(
  text: string,
  boxWidthPx: number,
  boxHeightPx: number,
  fontFamily = 'sans-serif',
): FitFontSizeResult {
  const hasUsableBox =
    Number.isFinite(boxWidthPx) && Number.isFinite(boxHeightPx) && boxWidthPx >= 1 && boxHeightPx >= 1;
  if (!hasUsableBox || typeof document === 'undefined' || !document.body) {
    return { fontSize: MIN_FONT_SIZE, fits: false };
  }

  const el = document.createElement('div');
  el.style.cssText =
    'visibility:hidden;position:absolute;top:-9999px;left:-9999px;' +
    'white-space:pre-wrap;word-break:break-word;overflow:hidden;line-height:1.2';
  el.style.width = `${boxWidthPx}px`;
  el.style.fontFamily = fontFamily;
  el.textContent = text || ' ';
  document.body.appendChild(el);

  try {
    const fitsAt = (size: number): boolean => {
      el.style.fontSize = `${size}px`;
      return el.scrollHeight <= boxHeightPx && el.scrollWidth <= boxWidthPx;
    };

    // Scales with the box (large photos need sizes above 200) but stays bounded.
    let lo = MIN_FONT_SIZE;
    let hi = Math.min(Math.ceil(boxHeightPx), MAX_FONT_SIZE);
    if (hi < lo || !fitsAt(MIN_FONT_SIZE)) {
      return { fontSize: MIN_FONT_SIZE, fits: false };
    }

    let result = MIN_FONT_SIZE;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (fitsAt(mid)) {
        result = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return { fontSize: result, fits: true };
  } finally {
    el.remove();
  }
}

/**
 * Returns the largest integer font-size in px such that `text` fits within
 * the given pixel dimensions using the provided font family. Returns the
 * minimum size (8px) for a missing, non-finite, or sub-pixel box.
 */
export function computeFitFontSize(
  text: string,
  boxWidthPx: number,
  boxHeightPx: number,
  fontFamily = 'sans-serif',
): number {
  return measureFitFontSize(text, boxWidthPx, boxHeightPx, fontFamily).fontSize;
}
