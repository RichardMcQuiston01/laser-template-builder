# Changelog

## 0.4.0 - 2026-10-18

### Changed (breaking)

- `extractLightBurnTokens` and `extractXcsTokens` now return braced `{{token}}` strings instead of
  bare names, matching `extractSvgTokens` and the documented `TemplateVariable.token` shape.
  `renderLightBurnFile` and `renderXcsFile` accept either shape.
- `validateSvg` is now a root-element check: it skips a BOM, whitespace, XML declaration, comments,
  and DOCTYPE, then requires `<svg>`. Documents that start with an XML declaration are now accepted;
  prose that merely mentions `<svg ` is rejected. It is not a sanitizer.
- `UploadForm`'s image preview URL now URL-encodes the filename.
- `renderImageAsSvg` only fetches `http:`, `https:`, `blob:`, or relative URLs, requires an OK
  `image/*` response under 25 MB, and `renderImageAsPng` rejects canvases over 16384 px per side or
  64 megapixels.
- `Select`'s empty placeholder option is now selectable; `Button` defaults to `type="button"`.

### Fixed

- Substitution inserts values literally in a single pass: no `$` pattern expansion, no re-scanning
  of inserted values, empty tokens ignored.
- SVG and LightBurn output escapes substituted values for XML.
- `renderXcsFile` accepts an optional `fonts` map; requires `unofficial-xcs-writer` >= 0.8.3.
- Textbox resize stays inside the image; drag uses pointer events (touch works).
- Editors reset when the template changes; rename no longer saves twice; rename/delete/convert
  failures show an error; `VariableEditor` accepts `outputFormats`.
- `computeFitFontSize` no longer hangs on a non-finite box and cleans up its DOM node.
- Downloads keep the blob URL alive until read and sanitize the filename.
- Unique ids for inputs and selects, retryable uploads, safe `backHref`.

### Added

- Vitest tests, a `typecheck` script, and a CI workflow.
- `VariableEditor` `outputFormats` prop and `renderXcsFile` `fonts` argument (listed above).
