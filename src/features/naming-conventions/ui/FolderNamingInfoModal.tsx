import { useEffect, useState } from 'react';

import type { FolderTreeNode } from '@/entities/folder';
import type { FolderFieldSelection, FolderNamingConvention } from '@/entities/naming-convention';
import { namingConventionApi } from '@/entities/naming-convention';
import { getApiErrorMessage } from '@/shared/api';
import { Modal } from '@/shared/components/modal';
import { t } from '@/shared/lib/i18n';

interface FolderNamingInfoModalProps {
  folder: FolderTreeNode;
  /** Admin hoặc Leader — false thì chỉ xem, các hành động bị khóa. */
  canManage: boolean;
  onClose: () => void;
  /** Gọi sau khi kế thừa thành công — cha refetch/toast. */
  onInherited: () => void;
  /** Gọi sau khi lưu tùy chỉnh field thành công. */
  onCustomized: () => void;
}

/* Tóm tắt 1 convention của folder: badge + delimiter + danh sách trường ĐANG áp dụng. */
function ConventionSummary({ info }: { info: FolderNamingConvention | null }) {
  if (!info?.hasNamingConvention || !info.fields) {
    return <p className="text-sm text-text-muted">{t('naming.folder.none')}</p>;
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-light px-2.5 py-1 text-xs font-semibold text-success">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          {t('naming.folder.applied')}
        </span>
        <span className="rounded-full bg-content-bg px-2.5 py-1 font-mono text-xs font-bold text-text-secondary">{info.delimiter}</span>
        <span className="text-xs text-text-muted">{info.fields.length} {t('naming.folder.fieldsCount')}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {[...info.fields]
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((f) => (
            <span key={f.id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              {f.locked && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              )}
              {f.displayName}
              {f.required && <span className="text-danger">*</span>}
            </span>
          ))}
      </div>
    </div>
  );
}

/* Xem quy tắc đặt tên của thư mục + 2 hành động cho Leader:
 * - "Kế thừa từ thư mục cha": gán convention của cha cho folder này.
 * - "Tùy chỉnh": bật/tắt các field KHÔNG bắt buộc áp dụng thêm cho folder
 *   (không tạo bộ quy tắc mới — field bắt buộc/khóa luôn theo bộ chung). */
export function FolderNamingInfoModal({ folder, canManage, onClose, onInherited, onCustomized }: FolderNamingInfoModalProps) {
  const [view, setView] = useState<'info' | 'customize'>('info');
  const [current, setCurrent] = useState<FolderNamingConvention | null>(null);
  const [parent, setParent] = useState<FolderNamingConvention | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trạng thái tùy chỉnh field (view customize).
  const [selection, setSelection] = useState<FolderFieldSelection | null>(null);
  const [selectionLoading, setSelectionLoading] = useState(false);
  const [enabledIds, setEnabledIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cur, par] = await Promise.all([
          namingConventionApi.getByFolder(folder.id),
          folder.parentFolderId
            ? namingConventionApi.getByFolder(folder.parentFolderId)
            : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setCurrent(cur.data.result);
        setParent(par?.data.result ?? null);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, t('common.error')));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [folder.id, folder.parentFolderId]);

  const sameAsParent =
    !!current?.hasNamingConvention &&
    !!parent?.hasNamingConvention &&
    current.namingConventionId === parent.namingConventionId;

  const canInherit =
    !!parent?.hasNamingConvention && !!parent.namingConventionId && !sameAsParent;

  const handleInherit = async () => {
    if (!parent?.namingConventionId) return;
    setBusy(true);
    setError(null);
    try {
      await namingConventionApi.assignFolders(parent.namingConventionId, {
        folderIds: [folder.id],
        applyToSubfolders: false,
      });
      onInherited();
    } catch (err) {
      setError(getApiErrorMessage(err, t('common.error')));
      setBusy(false);
    }
  };

  const openCustomize = async () => {
    setError(null);
    setView('customize');
    setSelectionLoading(true);
    try {
      const { data } = await namingConventionApi.getFolderFieldSelection(folder.id);
      setSelection(data.result);
      setEnabledIds(new Set(
        (data.result?.fields ?? [])
          .filter((f) => !f.isRequired && !f.isLocked && f.enabled)
          .map((f) => f.id),
      ));
    } catch (err) {
      setError(getApiErrorMessage(err, t('common.error')));
      setView('info');
    } finally {
      setSelectionLoading(false);
    }
  };

  const toggleField = (fieldId: string) =>
    setEnabledIds((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) next.delete(fieldId);
      else next.add(fieldId);
      return next;
    });

  const handleSaveSelection = async () => {
    setBusy(true);
    setError(null);
    try {
      await namingConventionApi.setFolderFieldSelection(folder.id, [...enabledIds]);
      onCustomized();
    } catch (err) {
      setError(getApiErrorMessage(err, t('common.error')));
      setBusy(false);
    }
  };

  const sortedOptions = [...(selection?.fields ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <Modal title={t('naming.folder.title')} onClose={busy ? () => undefined : onClose} maxWidth="max-w-lg">
      {loading ? (
        <p className="py-8 text-center text-sm text-text-muted">{t('common.loading')}</p>
      ) : view === 'customize' ? (
        /* ── View tùy chỉnh field áp dụng ── */
        <div className="space-y-4">
          <p className="text-sm text-text-muted">{t('naming.customize.desc')}</p>

          {selectionLoading ? (
            <p className="py-6 text-center text-sm text-text-muted">{t('common.loading')}</p>
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
            <button
              type="button"
              onClick={() => { setView('info'); setError(null); }}
              disabled={busy}
              className="mr-auto rounded-xl px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg disabled:opacity-40"
            >
              ← {t('naming.customize.back')}
            </button>
            <button
              type="button"
              onClick={() => void handleSaveSelection()}
              disabled={busy || selectionLoading || !canManage}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? t('common.loading') : t('naming.customize.save')}
            </button>
          </div>
        </div>
      ) : (
        /* ── View thông tin ── */
        <div className="space-y-5">
          {/* Thư mục đang xem */}
          <div className="space-y-2 rounded-2xl border border-card-border bg-input-bg/30 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
              {t('naming.folder.current')} · <span className="normal-case">{folder.name}</span>
            </p>
            <ConventionSummary info={current} />
          </div>

          {/* Thư mục cha (nếu có) */}
          {folder.parentFolderId && (
            <div className="space-y-2 rounded-2xl border border-card-border bg-input-bg/30 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted">{t('naming.folder.parent')}</p>
              <ConventionSummary info={parent} />
              {sameAsParent && <p className="text-xs font-medium text-success">{t('naming.folder.sameAsParent')}</p>}
            </div>
          )}

          {error && <p className="text-sm font-medium text-danger">{error}</p>}

          {!canManage && (
            <p className="rounded-xl border border-card-border bg-input-bg/50 px-3.5 py-2.5 text-xs font-medium text-text-muted">
              {t('naming.folder.leaderOnly')}
            </p>
          )}
          {canManage && !current?.hasNamingConvention && (
            <p className="rounded-xl border border-card-border bg-input-bg/50 px-3.5 py-2.5 text-xs font-medium text-text-muted">
              {t('naming.customize.needConvention')}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-3 border-t border-card-border pt-4">
            <button
              type="button"
              onClick={() => void openCustomize()}
              disabled={busy || !canManage || !current?.hasNamingConvention}
              className="flex items-center gap-2 rounded-xl border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-ghost disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
              {t('naming.folder.customize')}
            </button>
            <button
              type="button"
              onClick={() => void handleInherit()}
              disabled={busy || !canInherit || !canManage}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 11 21 7 17 3" /><path d="M21 7H9a4 4 0 0 0-4 4v10" /></svg>
              {busy ? t('common.loading') : t('naming.folder.inherit')}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
