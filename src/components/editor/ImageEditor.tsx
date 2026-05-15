import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { ImagePlacementEditor } from './ImagePlacementEditor';
import { isTextboxVariable } from '../../lib/utils/variables';
import { renderImageAsSvg, renderImageAsPng } from '../../lib/formats/imageExport';
import { computeFitFontSize } from '../../lib/utils/fitText';
import type { Template, ImageTextboxVariable } from '../../types';

interface ImageEditorProps {
  template: Template;
  /** URL used to load the background image (e.g. "/api/images/filename.jpg"). */
  imageUrl: string;
  /** Called when the user saves textbox layout changes. Throw to surface an error. */
  onSaveBoxes: (boxes: ImageTextboxVariable[]) => Promise<void>;
}

export function ImageEditor({ template, imageUrl, onSaveBoxes }: ImageEditorProps) {
  const [boxes, setBoxes] = useState<ImageTextboxVariable[]>(
    template.variables.filter(isTextboxVariable) as ImageTextboxVariable[],
  );
  const [isEditingBoxes, setIsEditingBoxes] = useState(false);
  const [isSavingBoxes, setIsSavingBoxes] = useState(false);
  const [saveBoxesError, setSaveBoxesError] = useState<string | null>(null);
  const [savedBoxes, setSavedBoxes] = useState<ImageTextboxVariable[]>(
    template.variables.filter(isTextboxVariable) as ImageTextboxVariable[],
  );

  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(boxes.map((v) => [v.token, v.defaultValue])),
  );
  const [fontSizes, setFontSizes] = useState<Record<string, number>>({});
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [isExportingSvg, setIsExportingSvg] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (img) setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
  }, []);

  useEffect(() => {
    if (!containerRef.current || !imgRef.current) return;
    const containerWidth = containerRef.current.getBoundingClientRect().width;
    if (!containerWidth) return;

    const newSizes: Record<string, number> = {};
    for (const v of boxes) {
      const boxWidthPx = (v.width / 100) * containerWidth;
      const boxHeightPx = (v.height / 100) * containerWidth * (imgRef.current.clientHeight / imgRef.current.clientWidth);
      const text = values[v.token] ?? v.defaultValue;
      newSizes[v.token] = computeFitFontSize(text || ' ', boxWidthPx, boxHeightPx, v.properties?.fontFamily ?? 'sans-serif');
    }
    setFontSizes(newSizes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, naturalSize, boxes]);

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveBoxes = useCallback(async () => {
    setIsSavingBoxes(true);
    setSaveBoxesError(null);
    try {
      await onSaveBoxes(boxes);
      setSavedBoxes(boxes);
      setIsEditingBoxes(false);
    } catch (err) {
      setSaveBoxesError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSavingBoxes(false);
    }
  }, [onSaveBoxes, boxes]);

  const handleExportSvg = useCallback(async () => {
    if (!naturalSize) return;
    setIsExportingSvg(true);
    setExportError(null);
    try {
      const svg = await renderImageAsSvg(imageUrl, naturalSize.w, naturalSize.h, boxes, values);
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      triggerDownload(blob, `${template.name}.svg`);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'SVG export failed');
    } finally {
      setIsExportingSvg(false);
    }
  }, [imageUrl, naturalSize, boxes, values, template.name]);

  const handleExportPng = useCallback(async () => {
    if (!naturalSize) return;
    setIsExportingPng(true);
    setExportError(null);
    try {
      const svg = await renderImageAsSvg(imageUrl, naturalSize.w, naturalSize.h, boxes, values);
      const blob = await renderImageAsPng(svg, naturalSize.w, naturalSize.h);
      triggerDownload(blob, `${template.name}.png`);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'PNG export failed');
    } finally {
      setIsExportingPng(false);
    }
  }, [imageUrl, naturalSize, boxes, values, template.name]);

  if (isEditingBoxes) {
    return (
      <div className="space-y-6">
        <ImagePlacementEditor
          imageUrl={imageUrl}
          boxes={boxes}
          onChange={setBoxes}
        />

        {saveBoxesError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {saveBoxesError}
          </p>
        )}

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setBoxes(savedBoxes);
              setIsEditingBoxes(false);
              setSaveBoxesError(null);
            }}
            disabled={isSavingBoxes}
          >
            Cancel
          </Button>
          <Button onClick={handleSaveBoxes} loading={isSavingBoxes}>
            Save Changes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Preview
        </h2>
        <div ref={containerRef} className="relative overflow-hidden rounded-xl border border-gray-200">
          <img
            ref={imgRef}
            src={imageUrl}
            alt={template.name}
            className="block w-full"
            onLoad={handleImageLoad}
          />
          {boxes.map((v) => (
            <div
              key={v.token}
              className="pointer-events-none absolute flex items-center overflow-hidden"
              style={{
                left: `${v.x}%`,
                top: `${v.y}%`,
                width: `${v.width}%`,
                height: `${v.height}%`,
                fontFamily: v.properties?.fontFamily ?? 'sans-serif',
                fontSize: fontSizes[v.token] ? `${fontSizes[v.token]}px` : undefined,
              }}
            >
              <span
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: v.properties?.textAlign ?? 'left',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {values[v.token] ?? v.defaultValue}
              </span>
            </div>
          ))}
        </div>
      </section>

      {boxes.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Text Fields
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {boxes.map((v) => (
              <Input
                key={v.token}
                label={v.label}
                value={values[v.token] ?? ''}
                onChange={(e) => setValues((prev) => ({ ...prev, [v.token]: e.target.value }))}
              />
            ))}
          </div>
        </section>
      ) : (
        <p className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          No text areas defined for this image template. Edit the template to add text boxes.
        </p>
      )}

      <section>
        <Button
          variant="secondary"
          onClick={() => {
            setSavedBoxes(boxes);
            setIsEditingBoxes(true);
          }}
        >
          Edit Textboxes
        </Button>
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Export</h2>

        {exportError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {exportError}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleExportSvg}
            loading={isExportingSvg}
            disabled={isExportingSvg || isExportingPng || !naturalSize}
            size="lg"
          >
            Download SVG
          </Button>
          <Button
            variant="secondary"
            onClick={handleExportPng}
            loading={isExportingPng}
            disabled={isExportingSvg || isExportingPng || !naturalSize}
            size="lg"
          >
            Download PNG
          </Button>
        </div>
      </section>
    </div>
  );
}
