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
  UploadResult,
  SaveTemplateData,
} from './types';

// Substitution engine
export { applySubstitution, extractTokens } from './lib/utils/substitution';

// Font sizing
export { computeFitFontSize } from './lib/utils/fitText';

// Variable type guards
export { isTextboxVariable, isTextVariable } from './lib/utils/variables';

// Format handlers
export { extractSvgTokens, renderSvgFile, validateSvg } from './lib/formats/svg';
export { extractLightBurnTokens, renderLightBurnFile, validateLightBurnXml } from './lib/formats/lightburn';
export { validateXcs, readXcsFile, extractXcsTokens, renderXcsFile } from './lib/formats/xcs';
export { renderImageAsSvg, renderImageAsPng } from './lib/formats/imageExport';

// UI primitives
export { Input } from './components/ui/Input';
export { Button } from './components/ui/Button';
export { Select } from './components/ui/Select';

// Editor components
export { ImagePlacementEditor } from './components/editor/ImagePlacementEditor';
export { ImageEditor } from './components/editor/ImageEditor';

// Template components
export { VariableEditor } from './components/template/VariableEditor';
export { UploadForm } from './components/template/UploadForm';
export { TemplateHeader } from './components/template/TemplateHeader';
