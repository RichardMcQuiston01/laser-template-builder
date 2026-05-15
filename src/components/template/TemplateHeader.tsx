import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import type { Template } from '../../types';

interface TemplateHeaderProps {
  template: Template;
  /** href for the breadcrumb back-link. Defaults to "#". */
  backHref?: string;
  /** Called with the new name when the user saves a rename. Throw to keep rename mode open. */
  onRename: (name: string) => Promise<void>;
  /** Called when the user confirms deletion. Should handle navigation away. Throw to show retry. */
  onDelete: () => Promise<void>;
  /** Called when the user converts an SVG template to IMAGE format. Throw to allow retry. */
  onConvertToImage: () => Promise<void>;
}

export function TemplateHeader({
  template,
  backHref = '#',
  onRename,
  onDelete,
  onConvertToImage,
}: TemplateHeaderProps) {
  const [name, setName] = useState(template.name);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(template.name);
  const [isSavingName, setIsSavingName] = useState(false);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false);

  const [currentFormat, setCurrentFormat] = useState(template.sourceFormat);
  const [isConverting, setIsConverting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  const startRename = useCallback(() => {
    setRenameValue(name);
    setIsRenaming(true);
  }, [name]);

  const cancelRename = useCallback(() => {
    setIsRenaming(false);
    setRenameValue(name);
  }, [name]);

  const saveRename = useCallback(async () => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === name) {
      cancelRename();
      return;
    }
    setIsSavingName(true);
    try {
      await onRename(trimmed);
      setName(trimmed);
      setIsRenaming(false);
    } catch {
      // leave rename mode open so user can retry
    } finally {
      setIsSavingName(false);
    }
  }, [onRename, renameValue, name, cancelRename]);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') saveRename();
      if (e.key === 'Escape') cancelRename();
    },
    [saveRename, cancelRename],
  );

  const handleConvertToImage = useCallback(async () => {
    setIsConverting(true);
    try {
      await onConvertToImage();
      setCurrentFormat('IMAGE');
    } catch {
      // button stays visible for retry
    } finally {
      setIsConverting(false);
    }
  }, [onConvertToImage]);

  const handleDelete = useCallback(async () => {
    setIsDeletingTemplate(true);
    try {
      await onDelete();
      // caller is responsible for navigation after this resolves
    } catch {
      setIsDeletingTemplate(false);
      setConfirmingDelete(false);
    }
  }, [onDelete]);

  return (
    <header className="mb-8">
      <nav className="mb-6 text-sm text-gray-500">
        <a href={backHref} className="hover:text-brand-600">
          Templates
        </a>{' '}
        / {name}
      </nav>

      {/* Name row */}
      <div className="flex items-center gap-2">
        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            className="flex-1 rounded-lg border border-brand-400 px-3 py-1.5 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={saveRename}
            disabled={isSavingName}
          />
        ) : (
          <h1 className="text-2xl font-bold">{name}</h1>
        )}
        {!isRenaming && (
          <button
            type="button"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            onClick={startRename}
            aria-label="Rename template"
            title="Rename"
          >
            ✎
          </button>
        )}
      </div>

      {/* Description + badge + actions */}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {template.description && (
          <p className="text-gray-500">{template.description}</p>
        )}
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
          {currentFormat}
        </span>

        {currentFormat === 'SVG' && (
          <Button
            variant="ghost"
            size="sm"
            loading={isConverting}
            onClick={handleConvertToImage}
            title="Switch to visual image editing with textbox placement"
          >
            Convert to Image Template
          </Button>
        )}

        <div className="ml-auto flex items-center gap-2">
          {confirmingDelete ? (
            <>
              <span className="text-sm text-gray-600">Delete template?</span>
              <Button
                variant="danger"
                size="sm"
                loading={isDeletingTemplate}
                onClick={handleDelete}
              >
                Confirm
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={isDeletingTemplate}
                onClick={() => setConfirmingDelete(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
