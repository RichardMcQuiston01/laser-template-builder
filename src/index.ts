// Types
export type {
  TemplateVariable,
  TextTemplateVariable,
  ImageTextboxVariable,
  TextboxProperties,
  Template,
  Category,
  SourceFormat,
  OutputFormat,
  ExportRequest,
  ExportResponse,
  ApiResponse,
} from './types';

// Substitution engine
export { applySubstitution, extractTokens } from './lib/utils/substitution';

// Font sizing
export { computeFitFontSize } from './lib/utils/fitText';

// Format handlers
export { extractSvgTokens, renderSvgFile, validateSvg } from './lib/formats/svg';
export { extractLightBurnTokens, renderLightBurnFile, validateLightBurnXml } from './lib/formats/lightburn';
export { readXcsArchive, extractXcsTokens, renderXcsFile } from './lib/formats/xcs';
export { renderImageAsSvg, renderImageAsPng } from './lib/formats/imageExport';
