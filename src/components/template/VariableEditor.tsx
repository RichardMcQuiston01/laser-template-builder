import { useState, useCallback } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { downloadBlob, sanitizeFilename } from '../../lib/utils/download';
import type { Template, OutputFormat, ExportRequest } from '../../types';

interface ExportResult {
  blob: Blob;
  /** If omitted the component derives a name from template.name + outputFormat. */
  filename?: string;
}

interface VariableEditorProps {
  template: Template;
  /** Called when the user clicks Download. Return the file blob (and optionally a filename). Throw to surface an error. */
  onExport: (request: ExportRequest) => Promise<ExportResult>;
  /**
   * Output formats offered in the format select. Defaults to SVG, LightBurn,
   * and xTool; pass a subset when the host can only produce some of them for
   * this template.
   */
  outputFormats?: OutputFormat[];
}

const OUTPUT_FORMAT_OPTIONS: { value: OutputFormat; label: string; extension: string }[] = [
  { value: 'SVG',  label: 'SVG', extension: '.svg' },
  { value: 'LBRN2', label: 'LightBurn (.lbrn2)', extension: '.lbrn2' },
  { value: 'XCS',  label: 'xTool Creative Suite (.xcs)', extension: '.xcs' },
];

const DEFAULT_OUTPUT_FORMATS: OutputFormat[] = ['SVG', 'LBRN2', 'XCS'];

function getInitialValues(template: Template): Record<string, string> {
  return Object.fromEntries(template.variables.map((v) => [v.token, v.defaultValue]));
}

/** The source format when it can be exported as-is, otherwise the first available format. */
function getInitialFormat(template: Template, available: OutputFormat[]): OutputFormat {
  const source = template.sourceFormat as OutputFormat;
  return available.includes(source) ? source : available[0] ?? 'SVG';
}

export function VariableEditor({
  template,
  onExport,
  outputFormats = DEFAULT_OUTPUT_FORMATS,
}: VariableEditorProps) {
  const formatOptions = OUTPUT_FORMAT_OPTIONS.filter((option) => outputFormats.includes(option.value));
  const [values, setValues] = useState<Record<string, string>>(() => getInitialValues(template));
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(() =>
    getInitialFormat(template, outputFormats),
  );

  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Reset when the host swaps in a different template without remounting.
  const [trackedTemplateId, setTrackedTemplateId] = useState(template.id);
  if (trackedTemplateId !== template.id) {
    setTrackedTemplateId(template.id);
    setValues(getInitialValues(template));
    setOutputFormat(getInitialFormat(template, outputFormats));
    setExportError(null);
  }

  const handleValueChange = useCallback((token: string, value: string) => {
    setValues((prev) => ({ ...prev, [token]: value }));
  }, []);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      const { blob, filename } = await onExport({
        templateId: template.id,
        variableValues: values,
        outputFormat,
      });
      const extension = OUTPUT_FORMAT_OPTIONS.find((o) => o.value === outputFormat)?.extension ?? '';
      downloadBlob(blob, sanitizeFilename(filename ?? template.name, extension));
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [onExport, template.id, template.name, values, outputFormat]);

  return (
    <div className="space-y-6">
      {template.variables.length === 0 ? (
        <p className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
          No variables detected in this template. Add{' '}
          <code className="font-mono">{'{{token}}'}</code> placeholders to your
          file to enable substitution.
        </p>
      ) : (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Variables
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {template.variables.map((variable) => (
              <Input
                key={variable.token}
                label={variable.label}
                hint={`Token: ${variable.token}`}
                value={values[variable.token] ?? ''}
                onChange={(e) => handleValueChange(variable.token, e.target.value)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Export
        </h2>
        <Select
          label="Output format"
          options={formatOptions}
          value={outputFormat}
          onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
        />

        {exportError && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700" role="alert">
            {exportError}
          </p>
        )}

        <Button
          onClick={handleExport}
          loading={isExporting}
          disabled={isExporting}
          size="lg"
          className="self-start"
        >
          Download File
        </Button>
      </section>
    </div>
  );
}
