import { useEffect, useRef, useState } from 'react';

import { t } from '@/shared/lib/i18n';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';

interface Props {
  file: File | null;
  onChange: (file: File | null) => void;
  currentUrl?: string | null;
}

export function AvatarDropzone({ file, onChange, currentUrl }: Props) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const previewUrlRef = useRef<string | null>(null);

  const setPickedFile = (picked: File | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = picked ? URL.createObjectURL(picked) : null;
    setPreview(previewUrlRef.current);
    onChange(picked);
  };

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  const accept = (picked: File | undefined) => {
    if (!picked) return;
    if (!picked.type.startsWith('image/')) {
      setError(t('account.avatar.invalidType'));
      return;
    }
    if (picked.size > MAX_BYTES) {
      setError(t('account.avatar.tooLarge'));
      return;
    }
    setError(null);
    setPickedFile(picked);
  };

  const clear = () => {
    setError(null);
    setPickedFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const shown = preview ?? currentUrl ?? null;

  return (
    <div className="space-y-1.5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          accept(e.dataTransfer.files?.[0]);
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed px-8 py-5 transition-colors ${
          dragging ? 'border-primary bg-primary-ghost' : 'border-card-border bg-input-bg'
        }`}
      >
        {shown ? (
          <div className="flex items-center gap-4">
            <img src={shown} alt="" className="h-16 w-16 shrink-0 rounded-[var(--radius-card)] object-cover" />
            <div className="min-w-0">
              <p className="truncate text-sm text-text">{file ? file.name : t('account.avatar.current')}</p>
              {/* Chỉ huỷ được ảnh vừa chọn — BE chưa có API xoá ảnh đã lưu. */}
              {file ? (
                <button
                  type="button"
                  onClick={clear}
                  className="text-xs font-semibold text-danger transition-colors hover:underline"
                >
                  {t('account.avatar.remove')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="text-xs font-semibold text-primary transition-colors hover:underline"
                >
                  {t('account.avatar.replace')}
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-card">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.9A5 5 0 0 1 7 6a6 6 0 0 1 11.3 1.8A4 4 0 0 1 18 15.7" />
                <polyline points="8 14 12 10 16 14" />
                <line x1="12" y1="10" x2="12" y2="21" />
              </svg>
            </span>
            <p className="text-center text-sm text-text">
              {t('account.avatar.dropHint')}{' '}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="font-semibold text-primary underline transition-colors hover:text-primary-hover"
              >
                {t('account.avatar.browse')}
              </button>
            </p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => accept(e.target.files?.[0])}
        />
      </div>

      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
