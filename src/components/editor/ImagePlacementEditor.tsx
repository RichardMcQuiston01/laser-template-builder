import { useState, useRef, useCallback } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { ImageTextboxVariable } from '../../types';

type ResizeHandle = 'tl' | 'tm' | 'tr' | 'ml' | 'mr' | 'bl' | 'bm' | 'br';

type DragMode =
  | { kind: 'move'; token: string; startMouseX: number; startMouseY: number; startBox: ImageTextboxVariable }
  | { kind: 'resize'; token: string; handle: ResizeHandle; startMouseX: number; startMouseY: number; startBox: ImageTextboxVariable };

const HANDLE_CURSORS: Record<ResizeHandle, string> = {
  tl: 'nw-resize', tm: 'n-resize',  tr: 'ne-resize',
  ml: 'w-resize',                    mr: 'e-resize',
  bl: 'sw-resize', bm: 's-resize',  br: 'se-resize',
};

const HANDLE_POSITIONS: Record<ResizeHandle, { left: string; top: string; transform: string }> = {
  tl: { left: '0%',   top: '0%',   transform: 'translate(-50%,-50%)' },
  tm: { left: '50%',  top: '0%',   transform: 'translate(-50%,-50%)' },
  tr: { left: '100%', top: '0%',   transform: 'translate(-50%,-50%)' },
  ml: { left: '0%',   top: '50%',  transform: 'translate(-50%,-50%)' },
  mr: { left: '100%', top: '50%',  transform: 'translate(-50%,-50%)' },
  bl: { left: '0%',   top: '100%', transform: 'translate(-50%,-50%)' },
  bm: { left: '50%',  top: '100%', transform: 'translate(-50%,-50%)' },
  br: { left: '100%', top: '100%', transform: 'translate(-50%,-50%)' },
};

const BOX_COLORS = [
  'border-blue-500',
  'border-emerald-500',
  'border-purple-500',
  'border-orange-500',
  'border-pink-500',
];

const MIN_SIZE = 5; // percent

interface ImagePlacementEditorProps {
  imageUrl: string;
  boxes: ImageTextboxVariable[];
  onChange: (boxes: ImageTextboxVariable[]) => void;
}

export function ImagePlacementEditor({ imageUrl, boxes, onChange }: ImagePlacementEditorProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [dragMode, setDragMode] = useState<DragMode | null>(null);

  const toPercent = useCallback((clientX: number, clientY: number): { px: number; py: number } => {
    const el = overlayRef.current;
    if (!el) return { px: 0, py: 0 };
    const rect = el.getBoundingClientRect();
    return {
      px: ((clientX - rect.left) / rect.width) * 100,
      py: ((clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const handleAddTextbox = useCallback(() => {
    const offset = boxes.length * 5;
    const newBox: ImageTextboxVariable = {
      kind: 'textbox',
      token: crypto.randomUUID().slice(0, 8),
      label: `Field ${boxes.length + 1}`,
      defaultValue: '',
      x: 25 + (offset % 30),
      y: 25 + (offset % 30),
      width: 50,
      height: 20,
      properties: {},
    };
    onChange([...boxes, newBox]);
  }, [boxes, onChange]);

  const handleDelete = useCallback(
    (token: string) => onChange(boxes.filter((b) => b.token !== token)),
    [boxes, onChange],
  );

  const handleBoxMouseDown = useCallback(
    (e: React.MouseEvent, token: string) => {
      e.preventDefault();
      e.stopPropagation();
      const box = boxes.find((b) => b.token === token);
      if (!box) return;
      const { px, py } = toPercent(e.clientX, e.clientY);
      setDragMode({ kind: 'move', token, startMouseX: px, startMouseY: py, startBox: { ...box } });
    },
    [boxes, toPercent],
  );

  const handleHandleMouseDown = useCallback(
    (e: React.MouseEvent, token: string, handle: ResizeHandle) => {
      e.preventDefault();
      e.stopPropagation();
      const box = boxes.find((b) => b.token === token);
      if (!box) return;
      const { px, py } = toPercent(e.clientX, e.clientY);
      setDragMode({ kind: 'resize', token, handle, startMouseX: px, startMouseY: py, startBox: { ...box } });
    },
    [boxes, toPercent],
  );

  const handleOverlayMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragMode) return;
      const { px, py } = toPercent(e.clientX, e.clientY);
      const dx = px - dragMode.startMouseX;
      const dy = py - dragMode.startMouseY;
      const sb = dragMode.startBox;

      onChange(
        boxes.map((b) => {
          if (b.token !== dragMode.token) return b;

          if (dragMode.kind === 'move') {
            return {
              ...b,
              x: Math.min(100 - sb.width,  Math.max(0, sb.x + dx)),
              y: Math.min(100 - sb.height, Math.max(0, sb.y + dy)),
            };
          }

          // Resize
          let { x, y, width, height } = sb;
          const h = dragMode.handle;

          if (h === 'tl' || h === 'ml' || h === 'bl') { x = sb.x + dx; width = sb.width - dx; }
          if (h === 'tr' || h === 'mr' || h === 'br') { width = sb.width + dx; }
          if (h === 'tl' || h === 'tm' || h === 'tr') { y = sb.y + dy; height = sb.height - dy; }
          if (h === 'bl' || h === 'bm' || h === 'br') { height = sb.height + dy; }

          if (width < MIN_SIZE) {
            if (h === 'tl' || h === 'ml' || h === 'bl') x = sb.x + sb.width - MIN_SIZE;
            width = MIN_SIZE;
          }
          if (height < MIN_SIZE) {
            if (h === 'tl' || h === 'tm' || h === 'tr') y = sb.y + sb.height - MIN_SIZE;
            height = MIN_SIZE;
          }

          x = Math.max(0, Math.min(100 - width, x));
          y = Math.max(0, Math.min(100 - height, y));

          return { ...b, x, y, width, height };
        }),
      );
    },
    [dragMode, boxes, onChange, toPercent],
  );

  const handleOverlayMouseUp = useCallback(() => setDragMode(null), []);

  const handleLabelChange = useCallback(
    (token: string, label: string) =>
      onChange(boxes.map((b) => (b.token === token ? { ...b, label } : b))),
    [boxes, onChange],
  );

  const handleFontChange = useCallback(
    (token: string, fontFamily: string) =>
      onChange(
        boxes.map((b) =>
          b.token === token ? { ...b, properties: { ...b.properties, fontFamily } } : b,
        ),
      ),
    [boxes, onChange],
  );

  const handleAlignChange = useCallback(
    (token: string, textAlign: 'left' | 'center' | 'right') =>
      onChange(
        boxes.map((b) =>
          b.token === token
            ? { ...b, properties: { ...b.properties, textAlign } }
            : b,
        ),
      ),
    [boxes, onChange],
  );

  const isDragging = dragMode !== null;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Button type="button" onClick={handleAddTextbox} size="sm">
          + Add Textbox
        </Button>
        <p className="text-sm text-gray-500">
          Click to add textboxes, then drag to move or resize using the handles.
        </p>
      </div>

      {/* Image + overlay */}
      <div className="relative select-none overflow-hidden rounded-xl border border-gray-200">
        <img
          src={imageUrl}
          alt="Template background"
          className="block max-w-full"
          draggable={false}
        />
        <div
          ref={overlayRef}
          className="absolute inset-0"
          style={{ cursor: isDragging ? 'grabbing' : 'default' }}
          onMouseMove={handleOverlayMouseMove}
          onMouseUp={handleOverlayMouseUp}
          onMouseLeave={handleOverlayMouseUp}
        >
          {boxes.map((box, idx) => (
            <div
              key={box.token}
              className={`absolute border-2 bg-white/20 ${BOX_COLORS[idx % BOX_COLORS.length]}`}
              style={{
                left: `${box.x}%`,
                top: `${box.y}%`,
                width: `${box.width}%`,
                height: `${box.height}%`,
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
              onMouseDown={(e) => handleBoxMouseDown(e, box.token)}
            >
              <span className="pointer-events-none absolute left-1 top-0.5 text-[10px] font-semibold text-white drop-shadow">
                {box.label || `Box ${idx + 1}`}
              </span>

              {(Object.keys(HANDLE_POSITIONS) as ResizeHandle[]).map((handle) => (
                <div
                  key={handle}
                  className="absolute h-[10px] w-[10px] rounded-sm border border-white bg-blue-500 shadow"
                  style={{
                    ...HANDLE_POSITIONS[handle],
                    cursor: HANDLE_CURSORS[handle],
                  }}
                  onMouseDown={(e) => handleHandleMouseDown(e, box.token, handle)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Per-box property panel */}
      {boxes.length > 0 && (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {boxes.map((box, idx) => (
            <div key={box.token} className="flex items-end gap-3 p-4">
              <div
                className={`mt-0.5 h-3 w-3 flex-none rounded-full border-2 ${BOX_COLORS[idx % BOX_COLORS.length]}`}
              />
              <div className="flex-1">
                <Input
                  label="Field Name"
                  value={box.label}
                  onChange={(e) => handleLabelChange(box.token, e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Input
                  label="Font"
                  placeholder="e.g. Arial, Georgia"
                  value={box.properties?.fontFamily ?? ''}
                  onChange={(e) => handleFontChange(box.token, e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500">Align</span>
                <div className="flex gap-1">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      type="button"
                      className={`flex h-8 w-8 items-center justify-center rounded text-xs font-bold ${
                        (box.properties?.textAlign ?? 'left') === align
                          ? 'bg-brand-600 text-white'
                          : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                      onClick={() => handleAlignChange(box.token, align)}
                      aria-label={`Align ${align}`}
                    >
                      {align === 'left' ? 'L' : align === 'center' ? 'C' : 'R'}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="mb-1 flex h-8 w-8 flex-none items-center justify-center rounded bg-red-100 text-red-600 hover:bg-red-200"
                onClick={() => handleDelete(box.token)}
                aria-label={`Remove ${box.label}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {boxes.length === 0 && (
        <p className="text-center text-sm text-gray-400">
          No textboxes yet — click &quot;Add Textbox&quot; above to add one.
        </p>
      )}
    </div>
  );
}
