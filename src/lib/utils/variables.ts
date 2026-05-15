import type { TemplateVariable, ImageTextboxVariable, TextTemplateVariable } from '../../types';

export const isTextboxVariable = (v: TemplateVariable): v is ImageTextboxVariable =>
  (v as ImageTextboxVariable).kind === 'textbox';

export const isTextVariable = (v: TemplateVariable): v is TextTemplateVariable =>
  !isTextboxVariable(v);
