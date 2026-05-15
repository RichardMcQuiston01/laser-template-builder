# laser-template-builder

A framework-agnostic React component library for building laser cutter template editors — supports SVG, LightBurn, and XCS formats with token-based variable substitution and image overlay placement.

## Install

```bash
npm install laser-template-builder
# or
pnpm add laser-template-builder
```

React 18 and react-dom are required as peer dependencies.

## Usage

_Documentation coming soon._

## Configuration

The top-level component accepts an optional `LTBConfig` prop for theming and feature flags:

```ts
interface LTBConfig {
  colorPalette?: { ... }
  allowedFonts?: string[]
  minFontSize?: number
  enableLightBurnExport?: boolean
  enableXcsExport?: boolean
  enableImageConversion?: boolean
}
```

## License

MIT — see [LICENSE](./LICENSE)
