import { useState, useCallback, useRef } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { ImagePlacementEditor } from '../editor/ImagePlacementEditor';
import type { Category, TemplateVariable, ImageTextboxVariable, UploadResult, SaveTemplateData } from '../../types';

interface UploadFormProps {
  categories: Category[];
  /**
   * Called when the user selects a file. Should POST the file to your upload
   * endpoint and return the result. Throw to surface an error.
   */
  onUpload: (file: File) => Promise<UploadResult>;
  /**
   * Called when the user saves the template. Should POST to your template
   * endpoint and handle navigation on success. Throw to surface an error.
   */
  onSave: (data: SaveTemplateData) => Promise<void>;
  /**
   * Base URL prepended to the image filename for the placement editor preview.
   * e.g. "/api/images"
   */
  imageBaseUrl?: string;
}

type Step = 'upload' | 'details' | 'placement';

export function UploadForm({ categories, onUpload, onSave, imageBaseUrl = '' }: UploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [variables, setVariables] = useState<TemplateVariable[]>([]);

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const isImageFormat = uploadResult?.sourceFormat === 'IMAGE';
  const imageFilename = uploadResult
    ? uploadResult.filePath.replace(/\\/g, '/').split('/').pop() ?? ''
    : '';
  const imagePreviewUrl = imageBaseUrl ? `${imageBaseUrl}/${imageFilename}` : `/${imageFilename}`;

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const result = await onUpload(file);
      setUploadResult(result);
      setVariables(result.detectedVariables);
      setName(file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '));
      setStep('details');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [onUpload]);

  const handleVariableLabelChange = useCallback((index: number, label: string) => {
    setVariables((prev) => prev.map((v, i) => (i === index ? { ...v, label } : v)));
  }, []);

  const handleVariableDefaultChange = useCallback((index: number, defaultValue: string) => {
    setVariables((prev) => prev.map((v, i) => (i === index ? { ...v, defaultValue } : v)));
  }, []);

  const handleSave = useCallback(async () => {
    if (!uploadResult) return;
    if (!name.trim()) {
      setSaveError('Template name is required');
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        categoryId: categoryId || undefined,
        filePath: uploadResult.filePath,
        sourceFormat: uploadResult.sourceFormat,
        variables,
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setIsSaving(false);
    }
  }, [onSave, uploadResult, name, description, categoryId, variables]);

  // ── Step: upload ──────────────────────────────────────────────────────────
  if (step === 'upload') {
    return (
      <div className="flex flex-col items-center gap-4">
        <div
          className="flex w-full cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-8 py-16 text-center transition hover:border-brand-400 hover:bg-brand-50"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Click to select a template file"
        >
          <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-sm font-medium text-gray-700">
            Click to upload a template file
          </p>
          <p className="text-xs text-gray-500">SVG, .lbrn2, .xcs, or image (PNG/JPG/WebP)</p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".svg,.lbrn2,.xcs,.png,.jpg,.jpeg,.webp"
            className="sr-only"
            onChange={handleFileChange}
          />
        </div>

        {isUploading && (
          <p className="text-sm text-gray-500">Uploading and scanning for variables…</p>
        )}

        {uploadError && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
            {uploadError}
          </p>
        )}
      </div>
    );
  }

  // ── Step: placement (image templates only) ────────────────────────────────
  if (step === 'placement') {
    return (
      <div className="space-y-8">
        <section>
          <h2 className="mb-1 text-base font-semibold text-gray-800">Place Text Areas</h2>
          <p className="text-sm text-gray-500">
            Draw boxes on the image to mark where personalised text will appear.
          </p>
        </section>

        <ImagePlacementEditor
          imageUrl={imagePreviewUrl}
          boxes={variables.filter((v): v is ImageTextboxVariable => v.kind === 'textbox')}
          onChange={(boxes) => setVariables(boxes)}
        />

        {saveError && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
            {saveError}
          </p>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setStep('details')}>
            Back
          </Button>
          <Button onClick={handleSave} loading={isSaving}>
            Save Template
          </Button>
        </div>
      </div>
    );
  }

  // ── Step: details ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-gray-800">Template Details</h2>
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {categoryOptions.length > 0 && (
          <Select
            label="Category"
            options={categoryOptions}
            placeholder="No category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          />
        )}
        <p className="text-xs text-gray-500">
          Detected format:{' '}
          <span className="font-medium">{uploadResult?.sourceFormat}</span>
        </p>
      </section>

      {!isImageFormat && variables.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-gray-800">
            Detected Variables
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({variables.length} found)
            </span>
          </h2>
          <p className="text-sm text-gray-500">
            Customise the label and default value for each token.
          </p>
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {variables.map((variable, index) => (
              <div key={variable.token} className="grid grid-cols-3 gap-3 p-4">
                <p className="col-span-3 font-mono text-xs text-gray-400">
                  {variable.token}
                </p>
                <div className="col-span-2">
                  <Input
                    label="Label"
                    value={variable.label}
                    onChange={(e) => handleVariableLabelChange(index, e.target.value)}
                  />
                </div>
                <Input
                  label="Default"
                  value={variable.defaultValue}
                  onChange={(e) => handleVariableDefaultChange(index, e.target.value)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {saveError && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
          {saveError}
        </p>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => setStep('upload')}>
          Back
        </Button>
        {isImageFormat ? (
          <Button onClick={() => setStep('placement')}>
            Next: Place Text Areas
          </Button>
        ) : (
          <Button onClick={handleSave} loading={isSaving}>
            Save Template
          </Button>
        )}
      </div>
    </div>
  );
}
