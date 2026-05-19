# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Commands

- **Build**: `npm run build` — Compiles TypeScript to ESM/CJS with type declarations
- **Watch mode**: `npm run dev` — Builds and watches for changes (useful during development)

## Project Overview

**laser-template-builder** is a React component library for building laser cutter template editors. It's a lightweight, framework-agnostic package that supports multiple file formats (SVG, LightBurn .lbrn2, xTool .xcs, and images) with token-based variable substitution.

### Core Purpose

The library provides:
1. **Format handlers** — Parse and export templates in SVG, LightBurn, and xTool formats
2. **Variable substitution** — Replace `{{token}}` placeholders with user-supplied values
3. **Image templating** — Place text overlays on images with visual editing
4. **React components** — Turnkey UI for template upload, editing, and export

## Architecture

### High-Level Structure

```
src/
├── components/          # React components (UI + editors)
├── lib/                 # Core logic (format handlers, utilities)
├── types/               # TypeScript interfaces (single file)
└── index.ts             # Public API surface
```

### Three Layers

**1. Utilities Layer** (`lib/utils/`)
- `substitution.ts` — Token replacement engine (`{{token}}` → values)
- `variables.ts` — Type guards for variable types
- `fitText.ts` — Client-side binary search for max font-size that fits in a box

**2. Format Handlers** (`lib/formats/`)
- `svg.ts` — Plain SVG templates (simple string substitution)
- `lightburn.ts` — `.lbrn2` XML (uses `fast-xml-parser` for validation)
- `xcs.ts` — xTool `.xcs` archives (ZIP with `project.json` + SVG layers; uses `jszip`)
- `imageExport.ts` — Converts image templates to SVG/PNG with text overlays

**3. React Components** (`components/`)
- **UI primitives** (`ui/`) — `Button`, `Input`, `Select` (minimal styling hooks for Tailwind)
- **Editors** (`editor/`) — `ImagePlacementEditor` (drag/resize boxes on images), `ImageEditor` (preview + export)
- **Templates** (`template/`) — `UploadForm` (3-step wizard), `VariableEditor` (edit values + export), `TemplateHeader` (rename/delete/convert)

### Data Flow

1. **Upload** → Extract tokens from file → Create `TemplateVariable[]`
2. **Edit** → User modifies token values or (for images) textbox placement
3. **Export** → Apply substitution + render to target format → Download blob

### Key Types

**TemplateVariable** (union type):
- `TextTemplateVariable` — Token + label + default value (for SVG/LBRN2/XCS)
- `ImageTextboxVariable` — Extends text variable with x, y, width, height (percentages), font/alignment properties

**Formats**:
- `SourceFormat` — What was uploaded (SVG, LBRN2, XCS, IMAGE)
- `OutputFormat` — What user exports to (SVG, LBRN2, XCS, IMAGE_SVG, IMAGE_PNG)

## Design Patterns & Constraints

### Token Substitution
- Tokens are literal strings: `{{tokenName}}`
- Regex-escaped during replacement to handle special chars in token names
- Works identically across all formats (SVG, XML, JSON)

### Image Templating (IMAGE format)
- Stores image file as a binary blob; textbox layout as `ImageTextboxVariable[]`
- Export flow: Image URL → base64 → SVG with `<image>` + text overlays → optionally rasterize to PNG
- Textbox positioning uses percentages (0–100) of image natural dimensions for responsiveness
- Font sizing is computed client-side via binary search (`computeFitFontSize`) using a hidden DOM sentinel

### Component Props Pattern
- Editors accept `onUpload`, `onSave`, `onExport` callbacks — callers handle HTTP/navigation
- Components manage local state but delegate side effects to consumers
- Error states captured and displayed inline; errors thrown from callbacks surface as alerts

### XCS Format Handling
- Async-only (ZIP parsing)
- Validates ZIP magic number before parsing
- Preserves non-SVG/non-JSON assets (binary) during re-export
- Applies substitution to both `project.json` and embedded SVG files

## Important Implementation Details

1. **Responsive Text on Images** — `computeFitFontSize` uses DOM measurement; client-side only. Respects font family from variable properties.

2. **Drag/Resize State Machine** — `ImagePlacementEditor` distinguishes between `move` and `resize` drag modes; enforces minimum 5% box dimensions.

3. **Image Export** — `renderImageAsSvg` converts image URL to data URL (handles CORS via fetch), then builds SVG with positioned `<text>` elements using `<tspan>` for line breaks.

4. **Three-Step Upload Wizard** — `UploadForm` progresses: upload → details/variables → placement (image only). Image format triggers extra step; others skip straight to save.

5. **Format Conversion** — `TemplateHeader` exposes "Convert to Image" action for SVG templates (likely converts SVG to rasterized image + creates initial textboxes).

## Build & Distribution

- **Entry point**: `src/index.ts`
- **Output formats**: ESM (`dist/index.js`) + CJS (`dist/index.cjs`) + types (`dist/index.d.ts`)
- **External deps**: `react` and `react-dom` are peer dependencies (not bundled)
- **Internal deps**: `fast-xml-parser`, `jszip` (bundled)
- **Target**: ES2020 (modern browsers)
