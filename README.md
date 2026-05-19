# laser-template-builder

A React component library for building laser cutter template editors — supports SVG, LightBurn (`.lbrn2`), and xTool (`.xcs`) formats with token-based variable substitution and visual image overlay placement.

## Install

```bash
npm install laser-template-builder
# or
pnpm add laser-template-builder
```

**Peer dependencies:** React 18 or 19 and the matching react-dom are required.

## Tailwind CSS setup

The components are styled with Tailwind CSS and reference a `brand` color palette that you must define. Add the package to your Tailwind content paths and extend your theme:

```js
// tailwind.config.js
export default {
  content: [
    './src/**/*.{ts,tsx}',
    './node_modules/laser-template-builder/dist/**/*.js', // include package classes
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff6ff',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
};
```

## Concepts

### Token syntax

Tokens are `{{double-brace}}` placeholders embedded directly in your template files:

```
Hello, {{customer_name}}! Your order #{{order_id}} is ready.
```

`extractTokens` scans a file's raw text for these patterns. `applySubstitution` replaces them at export time.

### Template types

| Type | Formats | How variables work |
|---|---|---|
| **Vector** | SVG, `.lbrn2`, `.xcs` | `{{token}}` placeholders in the file content |
| **Image** | PNG / JPG / WebP | Visual textboxes drawn over the image |

## Usage

### Vector template flow (SVG / LightBurn / XCS)

The typical flow is: user uploads a file → library scans for tokens → user fills in values → file is exported with substitutions applied.

**Step 1 — Upload page.** Render `UploadForm` with callbacks that talk to your backend:

```tsx
import { UploadForm } from 'laser-template-builder';
import type { UploadResult, SaveTemplateData } from 'laser-template-builder';

function NewTemplatePage({ categories }) {
  async function handleUpload(file: File): Promise<UploadResult> {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/templates/upload', { method: 'POST', body: form });
    if (!res.ok) throw new Error(await res.text());
    return res.json(); // { filePath, sourceFormat, detectedVariables }
  }

  async function handleSave(data: SaveTemplateData): Promise<void> {
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    window.location.href = '/templates';
  }

  return (
    <UploadForm
      categories={categories}
      onUpload={handleUpload}
      onSave={handleSave}
    />
  );
}
```

**Step 2 — Edit / export page.** Render `TemplateHeader` and `VariableEditor` with your loaded `Template` object:

```tsx
import { TemplateHeader, VariableEditor } from 'laser-template-builder';
import type { Template, ExportRequest } from 'laser-template-builder';

function TemplatePage({ template }: { template: Template }) {
  async function handleExport(req: ExportRequest) {
    const res = await fetch('/api/templates/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(await res.text());
    return { blob: await res.blob() }; // component triggers the download
  }

  return (
    <>
      <TemplateHeader
        template={template}
        backHref="/templates"
        onRename={async (name) => { await fetch(`/api/templates/${template.id}`, { method: 'PATCH', body: JSON.stringify({ name }) }); }}
        onDelete={async () => { await fetch(`/api/templates/${template.id}`, { method: 'DELETE' }); window.location.href = '/templates'; }}
        onConvertToImage={async () => { await fetch(`/api/templates/${template.id}/convert-to-image`, { method: 'POST' }); }}
      />
      <VariableEditor template={template} onExport={handleExport} />
    </>
  );
}
```

### Image template flow

Image templates don't use `{{token}}` in the file. Instead, users draw textboxes on top of the image, and the library composites text into the image at export time.

`UploadForm` automatically shows an extra placement step when an image is uploaded — no extra wiring required, just provide `imageBaseUrl` so the editor can load the preview:

```tsx
<UploadForm
  categories={categories}
  onUpload={handleUpload}
  onSave={handleSave}
  imageBaseUrl="/api/images"  // prepended to filePath filename for the preview URL
/>
```

On the edit page, use `ImageEditor` instead of `VariableEditor`:

```tsx
import { ImageEditor } from 'laser-template-builder';
import type { ImageTextboxVariable } from 'laser-template-builder';

function ImageTemplatePage({ template }) {
  async function handleSaveBoxes(boxes: ImageTextboxVariable[]) {
    await fetch(`/api/templates/${template.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variables: boxes }),
    });
  }

  return (
    <ImageEditor
      template={template}
      imageUrl={`/api/images/${template.filePath.split('/').pop()}`}
      onSaveBoxes={handleSaveBoxes}
    />
  );
}
```

`ImageEditor` handles preview rendering, font sizing, SVG export, and PNG rasterisation client-side — no export endpoint needed for image templates.

## Component API

### `UploadForm`

3-step wizard: file upload → template details / variable labels → textbox placement (image only).

| Prop | Type | Description |
|---|---|---|
| `categories` | `Category[]` | Populates the category dropdown |
| `onUpload` | `(file: File) => Promise<UploadResult>` | Upload the file and return detected variables. Throw to surface an error. |
| `onSave` | `(data: SaveTemplateData) => Promise<void>` | Persist the template. Throw to surface an error. |
| `imageBaseUrl` | `string` | Base URL for image preview in the placement step (e.g. `"/api/images"`) |

### `VariableEditor`

Renders inputs for each template variable and a format selector. Calls `onExport` and triggers a browser download.

| Prop | Type | Description |
|---|---|---|
| `template` | `Template` | The loaded template record |
| `onExport` | `(req: ExportRequest) => Promise<{ blob: Blob; filename?: string }>` | Apply substitution server-side and return the file blob. Throw to surface an error. |

### `TemplateHeader`

Breadcrumb + title with inline rename, delete confirmation, and SVG→Image conversion.

| Prop | Type | Description |
|---|---|---|
| `template` | `Template` | The loaded template record |
| `backHref` | `string` | Breadcrumb link (default `"#"`) |
| `onRename` | `(name: string) => Promise<void>` | Persist the new name. Throw to keep rename mode open. |
| `onDelete` | `() => Promise<void>` | Delete the template and navigate away. Throw to allow retry. |
| `onConvertToImage` | `() => Promise<void>` | Convert SVG to IMAGE format. Only shown for SVG templates. |

### `ImageEditor`

Preview + text-field inputs + SVG/PNG export for image templates. Includes an "Edit Textboxes" mode that shows `ImagePlacementEditor`.

| Prop | Type | Description |
|---|---|---|
| `template` | `Template` | The loaded template (must have `sourceFormat: 'IMAGE'`) |
| `imageUrl` | `string` | Full URL to load the background image |
| `onSaveBoxes` | `(boxes: ImageTextboxVariable[]) => Promise<void>` | Persist updated textbox layout. Throw to surface an error. |

### `ImagePlacementEditor`

Standalone drag-and-resize overlay editor. Used internally by `ImageEditor` and `UploadForm`, but can be embedded independently.

| Prop | Type | Description |
|---|---|---|
| `imageUrl` | `string` | Background image URL |
| `boxes` | `ImageTextboxVariable[]` | Current textbox state |
| `onChange` | `(boxes: ImageTextboxVariable[]) => void` | Called on every drag/resize/add/delete |

## Low-level utilities

For server-side rendering or custom integrations, all format handlers are exported individually.

### Token utilities

```ts
import { extractTokens, applySubstitution } from 'laser-template-builder';

const tokens = extractTokens(svgString);
// => ['{{name}}', '{{date}}']

const output = applySubstitution(svgString, template.variables, { '{{name}}': 'Alice' });
```

### Format handlers

```ts
import {
  validateSvg, extractSvgTokens, renderSvgFile,
  validateLightBurnXml, extractLightBurnTokens, renderLightBurnFile,
  validateXcs, readXcsFile, extractXcsTokens, renderXcsFile,
} from 'laser-template-builder';

// SVG
const tokens = extractSvgTokens(svgString);       // string[]
const output = renderSvgFile(svgString, variables, values); // string

// LightBurn
const tokens = extractLightBurnTokens(xmlString);
const output = renderLightBurnFile(xmlString, variables, values);

// XCS
const valid  = validateXcs(arrayBuffer);                      // boolean
const json   = readXcsFile(arrayBuffer);                      // raw JSON string
const tokens = extractXcsTokens(arrayBuffer);                 // string[]
const bytes  = renderXcsFile(arrayBuffer, variables, values); // Uint8Array
```

### Image export

```ts
import { renderImageAsSvg, renderImageAsPng } from 'laser-template-builder';

const svg = await renderImageAsSvg(imageUrl, naturalW, naturalH, boxes, values);
const png = await renderImageAsPng(svg, naturalW, naturalH); // Blob
```

### Font sizing

```ts
import { computeFitFontSize } from 'laser-template-builder';

// Returns the largest font size (px) that fits `text` inside a box of the given pixel dimensions.
const size = computeFitFontSize(text, boxWidthPx, boxHeightPx, 'Arial');
```

## Types

```ts
type SourceFormat = 'SVG' | 'LBRN2' | 'XCS' | 'IMAGE';
type OutputFormat = 'SVG' | 'LBRN2' | 'XCS' | 'IMAGE_SVG' | 'IMAGE_PNG';

interface Template {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  filePath: string;
  thumbnailPath: string | null;
  sourceFormat: SourceFormat;
  variables: TemplateVariable[];
  createdAt: string;
  updatedAt: string;
}

type TemplateVariable = TextTemplateVariable | ImageTextboxVariable;

interface TextTemplateVariable {
  kind?: 'text';
  token: string;       // e.g. '{{customer_name}}'
  label: string;       // human-readable field name
  defaultValue: string;
}

interface ImageTextboxVariable {
  kind: 'textbox';
  token: string;
  label: string;
  defaultValue: string;
  x: number;          // percentage of image width (0–100)
  y: number;          // percentage of image height (0–100)
  width: number;      // percentage of image width (0–100)
  height: number;     // percentage of image height (0–100)
  properties: {
    fontFamily?: string;
    textAlign?: 'left' | 'center' | 'right';
  };
}

interface UploadResult {
  filePath: string;
  sourceFormat: string;
  detectedVariables: TemplateVariable[];
}

interface SaveTemplateData {
  name: string;
  description?: string;
  categoryId?: string;
  filePath: string;
  sourceFormat: string;
  variables: TemplateVariable[];
}

interface ExportRequest {
  templateId: string;
  variableValues: Record<string, string>;
  outputFormat: OutputFormat;
}
```

## License

MIT — see [LICENSE](./LICENSE)
