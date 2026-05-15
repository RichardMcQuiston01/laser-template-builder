/** A text variable slot (legacy or explicit) defined in a template. */
export interface TextTemplateVariable {
  kind?: 'text';         // optional — absent on legacy DB records
  token: string;
  label: string;
  defaultValue: string;
}

export interface TextboxProperties {
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
}

/** A visual textbox drawn over an image template. */
export interface ImageTextboxVariable {
  kind: 'textbox';
  token: string;
  label: string;
  defaultValue: string;
  /** Percentages of image natural dimensions (0–100) */
  x: number;
  y: number;
  width: number;
  height: number;
  properties: TextboxProperties;
}

export type TemplateVariable = TextTemplateVariable | ImageTextboxVariable;

/** The source/output format of a file. */
export type SourceFormat = 'SVG' | 'LBRN2' | 'XCS' | 'IMAGE';
export type OutputFormat = 'SVG' | 'LBRN2' | 'XCS' | 'IMAGE_SVG' | 'IMAGE_PNG';

/** Serialised template as returned by the API. */
export interface Template {
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

/** Serialised category as returned by the API. */
export interface Category {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** Payload sent to the export endpoint. */
export interface ExportRequest {
  templateId: string;
  variableValues: Record<string, string>;
  outputFormat: OutputFormat;
}

/** Response from the export endpoint. */
export interface ExportResponse {
  jobId: string;
  downloadUrl: string;
}

/** Generic JSON API response wrapper. */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Returned by the upload handler after scanning a file for tokens. */
export interface UploadResult {
  filePath: string;
  sourceFormat: string;
  detectedVariables: TemplateVariable[];
}

/** Payload passed to the save handler when creating a new template. */
export interface SaveTemplateData {
  name: string;
  description?: string;
  categoryId?: string;
  filePath: string;
  sourceFormat: string;
  variables: TemplateVariable[];
}
