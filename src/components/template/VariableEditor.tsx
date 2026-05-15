import { useState, useCallback } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
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
}

const OUTPUT_FORMAT_OPTIONS = [
  { value: 'SVG',  label: 'SVG' },
  { value: 'LBRN2', label: 'LightBurn (.lbrn2)' },
  { value: 'XCS',  label: 'xTool Creative Suite (.xcs)' },
];

export function VariableEditor({ template, onExport }: VariableEditorProps) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(template.variables.map((v) => [v.token, v.defaultValue])),
  );
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(
    template.sourceFormat as OutputFormat,
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

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
      const derivedFilename = filename ?? `${template.name}.${outputFormat.toLowerCase()}`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = derivedFilename;
      anchor.click();
      URL.revokeObjectURL(url);
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
          options={OUTPUT_FORMAT_OPTIONS}
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
