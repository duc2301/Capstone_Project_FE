import { useEffect, useState } from 'react';

import type { FolderFieldSelection } from '@/entities/naming-convention';
import { namingConventionApi } from '@/entities/naming-convention';
import { getApiErrorMessage } from '@/shared/api';
import { t } from '@/shared/lib/i18n';

interface FolderFieldSelectionEditorProps {
  folderId: string;
  /** Admin/PM/Leader — false thì chỉ xem, checkbox + nút Lưu bị khóa. */
  canManage: boolean;
  onSaved: () => void;
  /** Nút phụ (Quay lại / Hủy) đặt bên trái footer. */
  footerLeft?: React.ReactNode;
}

/* Editor bật/tắt các field KHÔNG bắt buộc áp dụng thêm cho 1 folder.
 * Field bắt buộc/khóa = "Luôn áp dụng" (disabled). Tự fetch theo folderId, dùng chung ở
 * FolderNamingInfoModal (context menu thư mục) và tab Cài đặt (Leader). */
export function FolderFieldSelectionEditor({ folderId, canManage, onSaved, footerLeft }: FolderFieldSelectionEditorProps) {
  const [selection, setSelection] = useState<FolderFieldSelection | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enabledIds, setEnabledIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    namingConventionApi
      .getFolderFieldSelection(folderId)
      .then(({ data }) => {
        if (cancelled) return;
        setSelection(data.result);
        setEnabledIds(new Set(
          (data.result?.fields ?? [])
            .filter((f) => !f.isRequired && !f.isLocked && f.enabled)
            .map((f) => f.id),
        ));
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, t('common.error')));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [folderId]);

  const toggleField = (fieldId: string) =>
    setEnabledIds((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) next.delete(fieldId);
      else next.add(fieldId);
      return next;
    });

  const handleSave = async () => {
    setBusy(true);
    setError(null);
    try {
      await namingConventionApi.setFolderFieldSelection(folderId, [...enabledIds]);
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, t('common.error')));
      setBusy(false);
    }
  };

  const sortedOptions = [...(selection?.fields ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">{t('naming.customize.desc')}</p>

      {loading ? (
        <p className="py-6 text-center text-sm text-text-muted">{t('common.loading')}</p>
      ) : !selection?.hasNamingConvention ? (
        <p className="rounded-xl border border-card-border bg-input-bg/50 px-3.5 py-2.5 text-sm text-text-muted">
          {t('naming.customize.needConvention')}
        </p>
      ) : (
        <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
          {sortedOptions.map((field) => {
            const alwaysOn = field.isRequired || field.isLocked;
            const checked = alwaysOn || enabledIds.has(field.id);
            return (
              <label
                key={field.id}
                className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors ${
                  alwaysOn
                    ? 'border-card-border bg-content-bg/60'
                    : checked
                      ? 'cursor-pointer border-primary/40 bg-primary-ghost'
                      : 'cursor-pointer border-card-border bg-card hover:border-primary/30'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={alwaysOn || busy || !canManage}
                  onChange={() => toggleField(field.id)}
                  className="h-4 w-4 shrink-0 accent-primary"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">
                    <span className="font-mono font-bold text-text">{field.code}</span>
                    <span className="text-text-secondary"> · {field.displayName}</span>
                  </span>
                  {field.description && <span className="block truncate text-xs text-text-muted">{field.description}</span>}
                </span>
                {field.isLocked && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-warning"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                )}
                {alwaysOn && (
                  <span className="shrink-0 rounded-full bg-content-bg px-2 py-0.5 text-xs font-semibold text-text-muted">
                    {t('naming.customize.alwaysOn')}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      )}

      {error && <p className="text-sm font-medium text-danger">{error}</p>}

      <div className="flex justify-end gap-3 border-t border-card-border pt-4">
        {footerLeft && <div className="mr-auto">{footerLeft}</div>}
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={busy || loading || !canManage || !selection?.hasNamingConvention}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? t('common.loading') : t('naming.customize.save')}
        </button>
      </div>
    </div>
  );
}
