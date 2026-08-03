import { useState } from 'react';

import type { AssignedFolder, NamingConvention, NamingField } from '@/entities/naming-convention';
import { NAMING_DELIMITERS, namingConventionApi } from '@/entities/naming-convention';
import { getApiErrorMessage } from '@/shared/api';
import { Modal } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

import { ApplyConventionModal } from './ApplyConventionModal';
import { ConfirmModal } from './ConfirmModal';
import { FolderFieldSelectionEditor } from './FolderFieldSelectionEditor';

interface ConventionDetailProps {
  convention: NamingConvention;
  projectId: string;
  /** Admin/PM = true (toàn quyền). Leader = false (chỉ xem + tùy chỉnh trường theo folder). */
  canConfigure: boolean;
  onBack: () => void;
  /** Nhận bản convention mới từ response của các API ghi (đỡ refetch). */
  onMutated: (convention: NamingConvention) => void;
  onDeleted: () => void;
  /** Cho các API xóa không trả convention (deleteField/deleteValue/unassign). */
  refetch: () => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const inputClass = 'field-input';
const labelClass = 'field-label mb-1.5';
const cardClass = 'rounded-[24px] border border-card-border/60 bg-card/70 p-6 shadow-card backdrop-blur-sm';
const nameThClass = 'pb-3 pr-4 text-xs font-bold uppercase tracking-wider text-text-muted';

/* ── Modal sửa tên/delimiter ───────────────────────────── */
function EditConventionModal({
  convention, busy, onClose, onSave,
}: {
  convention: NamingConvention;
  busy: boolean;
  onClose: () => void;
  onSave: (name: string, delimiter: string) => void;
}) {
  const [name, setName] = useState(convention.name);
  const [delimiter, setDelimiter] = useState(convention.delimiter);
  return (
    <Modal title={t('naming.detail.editTitle')} onClose={busy ? () => undefined : onClose} maxWidth="max-w-md">
      <div className="space-y-5">
        <div>
          <label className={labelClass}>{t('naming.createModal.name')}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoFocus />
        </div>
        <div>
          <label className={labelClass}>{t('naming.createModal.delimiter')}</label>
          <div className="flex gap-2">
            {NAMING_DELIMITERS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDelimiter(d)}
                className={`flex h-10 w-12 items-center justify-center rounded-xl border font-mono text-lg font-bold transition-colors ${
                  delimiter === d
                    ? 'border-primary bg-primary text-white'
                    : 'border-input-border bg-input-bg text-text-secondary hover:border-primary hover:text-primary'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-card-border pt-4">
          <button type="button" onClick={onClose} disabled={busy} className="btn-modal-ghost">
            {t('naming.cancel')}
          </button>
          <button
            type="button"
            onClick={() => onSave(name.trim(), delimiter)}
            disabled={busy || !name.trim()}
            className="btn-modal-primary"
          >
            {busy ? t('common.loading') : t('common.saveChanges')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Modal thêm/sửa trường KÈM giá trị (1 chỗ quản lý trọn 1 field) ── */
export interface FieldValueRow {
  id?: string; // có id = value đã tồn tại; không id = thêm mới
  code: string;
  displayName: string;
  isActive: boolean;
}

function FieldFormModal({
  field, busy, onClose, onSave,
}: {
  field: NamingField | null; // null = thêm mới
  busy: boolean;
  onClose: () => void;
  onSave: (form: { code: string; displayName: string; description: string | null }, rows: FieldValueRow[]) => void;
}) {
  const [code, setCode] = useState(field?.code ?? '');
  const [displayName, setDisplayName] = useState(field?.displayName ?? '');
  const [description, setDescription] = useState(field?.description ?? '');
  const [rows, setRows] = useState<FieldValueRow[]>(() =>
    field
      ? [...field.allowedValues]
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((v) => ({ id: v.id, code: v.code, displayName: v.displayName, isActive: v.isActive }))
      : [{ code: '', displayName: '', isActive: true }],
  );
  const [error, setError] = useState<string | null>(null);
  const lockedValueId = field?.lockedValue?.id ?? null;

  const patchRow = (i: number, patch: Partial<FieldValueRow>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i));
  const addRow = () => setRows((prev) => [...prev, { code: '', displayName: '', isActive: true }]);

  const submit = () => {
    if (!code.trim() || !displayName.trim()) {
      setError(t('naming.field.codeRequired'));
      return;
    }
    const cleaned = rows.filter((r) => r.code.trim());
    if (cleaned.length === 0) {
      setError(t('naming.field.valuesRequired'));
      return;
    }
    onSave({ code: code.trim(), displayName: displayName.trim(), description: description.trim() || null }, cleaned);
  };

  return (
    <Modal title={field ? t('naming.detail.editFieldValues') : t('naming.editor.addField')} onClose={busy ? () => undefined : onClose} maxWidth="max-w-2xl">
      <div className="space-y-5">
        {/* Thông tin trường */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[10rem_1fr]">
          <div>
            <label className={labelClass}>{t('naming.editor.fieldCode')}</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={t('naming.field.codePlaceholder')}
              className={`${inputClass} font-mono font-semibold uppercase`}
              autoFocus={!field}
            />
          </div>
          <div>
            <label className={labelClass}>{t('naming.editor.fieldName')}</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t('naming.field.namePlaceholder')} className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>{t('naming.detail.description')}</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('naming.field.descPlaceholder')} className={inputClass} />
        </div>

        {/* Giá trị của trường — khung cuộn, không kéo dài modal */}
        <div>
          <label className={labelClass}>
            {t('naming.editor.values')} ({rows.filter((r) => r.code.trim()).length})
          </label>
          <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
            {rows.map((row, i) => {
              const isLockedRow = !!row.id && row.id === lockedValueId;
              return (
                <div key={row.id ?? `new-${i}`} className="flex items-center gap-2">
                  <input
                    value={row.code}
                    onChange={(e) => patchRow(i, { code: e.target.value.toUpperCase() })}
                    placeholder={t('naming.editor.valueCode')}
                    className="w-28 shrink-0 rounded-[var(--radius-input)] border border-input-border bg-input-bg px-2.5 py-1.5 font-mono text-sm font-semibold uppercase text-text outline-none focus:border-input-focus"
                  />
                  <input
                    value={row.displayName}
                    onChange={(e) => patchRow(i, { displayName: e.target.value })}
                    placeholder={t('naming.editor.valueName')}
                    className="min-w-0 flex-1 rounded-[var(--radius-input)] border border-input-border bg-input-bg px-2.5 py-1.5 text-sm text-text outline-none focus:border-input-focus"
                  />
                  {isLockedRow && (
                    <span className="shrink-0 text-warning" title={t('naming.detail.lockHint')}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    </span>
                  )}
                  {row.id && (
                    <label className="flex shrink-0 items-center gap-1 text-xs text-text-muted" title={t('naming.status.active')}>
                      <input
                        type="checkbox"
                        checked={row.isActive}
                        disabled={isLockedRow}
                        onChange={(e) => patchRow(i, { isActive: e.target.checked })}
                        className="h-3.5 w-3.5 accent-primary"
                      />
                    </label>
                  )}
                  <button
                    type="button"
                    title={isLockedRow ? t('naming.detail.lockHint') : t('naming.editor.removeValue')}
                    onClick={() => removeRow(i)}
                    disabled={isLockedRow}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-danger-light hover:text-danger disabled:opacity-30"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={addRow}
            className="mt-2 flex items-center gap-1.5 rounded-[var(--radius-button)] px-2 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary-ghost"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            {t('naming.editor.addValue')}
          </button>
        </div>

        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        <div className="flex justify-end gap-3 border-t border-card-border pt-4">
          <button type="button" onClick={onClose} disabled={busy} className="btn-modal-ghost">
            {t('naming.cancel')}
          </button>
          <button type="button" onClick={submit} disabled={busy} className="btn-modal-primary">
            {busy ? t('common.loading') : t('common.saveChanges')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Màn chi tiết 1 bộ quy tắc ─────────────────────────── */
export function ConventionDetail({
  convention, projectId, canConfigure, onBack, onMutated, onDeleted, refetch, showToast,
}: ConventionDetailProps) {
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [fieldForm, setFieldForm] = useState<{ field: NamingField | null } | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [customizeFolder, setCustomizeFolder] = useState<AssignedFolder | null>(null);
  const [confirm, setConfirm] = useState<
    | { kind: 'convention' }
    | { kind: 'field'; field: NamingField }
    | null
  >(null);

  const sortedFields = [...convention.fields].sort((a, b) => a.orderIndex - b.orderIndex);
  const folderCount = convention.assignedFolders.length;

  /* ── Suy diễn cột ĐỊNH DẠNG / VÍ DỤ (BE không lưu format/example riêng) ── */
  const fieldExample = (f: NamingField): string => {
    if (f.lockedValue) return f.lockedValue.code;
    const active = [...f.allowedValues].filter((v) => v.isActive).sort((a, b) => a.orderIndex - b.orderIndex);
    return active[0]?.code ?? f.allowedValues[0]?.code ?? '';
  };
  const fieldFormat = (f: NamingField): string => {
    const len = f.maxLength ?? (fieldExample(f).length || 2);
    return 'X'.repeat(Math.max(1, len));
  };
  const handleDownloadTemplate = async () => {
    try {
      const res = await namingConventionApi.downloadTemplate();
      const blobUrl = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'naming-convention-template_ISO-19650.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      showToast(t('common.error'), 'error');
    }
  };

  /* API ghi trả về convention mới -> đẩy lên cha. Trả true nếu thành công. */
  const run = async (
    fn: () => Promise<{ data: { result: NamingConvention | null } }>,
    msg: string,
  ): Promise<boolean> => {
    setBusy(true);
    try {
      const { data } = await fn();
      if (data.result) onMutated(data.result);
      showToast(msg);
      return true;
    } catch (err) {
      showToast(getApiErrorMessage(err, t('common.error')), 'error');
      return false;
    } finally {
      setBusy(false);
    }
  };

  /* API xóa không trả convention -> refetch danh sách. */
  const runVoid = async (fn: () => Promise<unknown>, msg: string): Promise<boolean> => {
    setBusy(true);
    try {
      await fn();
      await refetch();
      showToast(msg);
      return true;
    } catch (err) {
      showToast(getApiErrorMessage(err, t('common.error')), 'error');
      return false;
    } finally {
      setBusy(false);
    }
  };

  /* Lưu field + values trong 1 modal: tạo mới = 1 call addField (kèm allowedValues);
   * sửa = diff từng phần (updateField / addValues / updateValue / deleteValue) rồi refetch. */
  const handleFieldSave = async (
    form: { code: string; displayName: string; description: string | null },
    rows: FieldValueRow[],
  ) => {
    if (!fieldForm) return;
    setBusy(true);
    try {
      if (!fieldForm.field) {
        const { data } = await namingConventionApi.addField(convention.id, {
          code: form.code,
          displayName: form.displayName,
          description: form.description,
          orderIndex: convention.fields.length,
          isRequired: true, // mặc định bắt buộc — nới lỏng bằng checkbox ở bảng
          isLocked: false,
          allowedValues: rows.map((r, i) => ({
            code: r.code.trim(),
            displayName: r.displayName.trim() || r.code.trim(),
            orderIndex: i,
          })),
        });
        if (data.result) onMutated(data.result);
      } else {
        const field = fieldForm.field;

        if (form.code !== field.code || form.displayName !== field.displayName
          || (form.description ?? null) !== (field.description ?? null))
          await namingConventionApi.updateField(field.id, form);

        // Xóa: value cũ không còn trong danh sách rows.
        const keptIds = new Set(rows.filter((r) => r.id).map((r) => r.id as string));
        for (const v of field.allowedValues)
          if (!keptIds.has(v.id)) await namingConventionApi.deleteValue(v.id);

        // Sửa: value có id và nội dung thay đổi.
        for (const r of rows) {
          if (!r.id) continue;
          const orig = field.allowedValues.find((v) => v.id === r.id);
          if (orig && (orig.code !== r.code || orig.displayName !== r.displayName || orig.isActive !== r.isActive))
            await namingConventionApi.updateValue(r.id, {
              code: r.code.trim(),
              displayName: r.displayName.trim() || r.code.trim(),
              isActive: r.isActive,
            });
        }

        // Thêm: row không có id.
        const added = rows.filter((r) => !r.id);
        if (added.length > 0)
          await namingConventionApi.addValues(field.id, added.map((r, i) => ({
            code: r.code.trim(),
            displayName: r.displayName.trim() || r.code.trim(),
            orderIndex: field.allowedValues.length + i,
          })));

        await refetch(); // deleteValue không trả convention -> đồng bộ lại 1 lần
      }
      showToast(t('naming.toast.updated'));
      setFieldForm(null);
    } catch (err) {
      showToast(getApiErrorMessage(err, t('common.error')), 'error');
      await refetch(); // có thể đã ghi một phần -> đồng bộ lại UI
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    if (confirm.kind === 'convention') {
      const ok = await runVoid(() => namingConventionApi.remove(convention.id), t('naming.toast.deleted'));
      if (ok) {
        setConfirm(null);
        onDeleted();
      }
      return;
    }
    const ok = await runVoid(() => namingConventionApi.deleteField(confirm.field.id), t('naming.toast.updated'));
    if (ok) setConfirm(null);
  };

  const statusBadge = (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
      convention.isActive ? 'bg-success-light text-success' : 'bg-content-bg text-text-muted'
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${convention.isActive ? 'bg-success' : 'bg-text-placeholder'}`} />
      {convention.isActive ? t('naming.status.active') : t('naming.status.inactive')}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              title={t('naming.back')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-button)] text-text-muted transition-colors hover:bg-content-bg hover:text-primary"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
            </button>
            <div className="min-w-0">
              <h2 className="heading-tab truncate">{convention.name}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-content-bg px-2.5 py-0.5 font-mono text-xs font-bold text-text-secondary" title={t('naming.table.delimiter')}>
                  {convention.delimiter}
                </span>
                <span className="text-xs text-text-muted">
                  {sortedFields.length} {t('naming.table.fields').toLowerCase()}
                </span>
                <span className="truncate font-mono text-xs text-text-muted">
                  {sortedFields.map((f) => f.code).join(convention.delimiter)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {canConfigure ? (
              <>
                {/* Bật/tắt hiệu lực */}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void run(
                    () => namingConventionApi.update(convention.id, { isActive: !convention.isActive }),
                    t('naming.toast.updated'),
                  )}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                    convention.isActive
                      ? 'bg-success-light text-success hover:bg-success/20'
                      : 'bg-content-bg text-text-muted hover:bg-card-border/50'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${convention.isActive ? 'bg-success' : 'bg-text-placeholder'}`} />
                  {convention.isActive ? t('naming.status.active') : t('naming.status.inactive')}
                </button>
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  disabled={busy}
                  className="flex items-center gap-2 rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-ghost disabled:opacity-50"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  {t('naming.detail.edit')}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirm({ kind: 'convention' })}
                  disabled={busy}
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger-light disabled:opacity-50"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                  {t('naming.detail.delete')}
                </button>
              </>
            ) : statusBadge}
          </div>
        </div>
      </div>

      {/* Bảng tham số quy tắc đặt tên */}
      <div className={cardClass}>
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="heading-section">{t('naming.title')}</h3>
            <p className="mt-1 text-sm text-text-muted">{t('naming.detail.paramsSubtitle')}</p>
          </div>
          {canConfigure && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void handleDownloadTemplate()}
                disabled={busy}
                className="flex items-center gap-2 rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-ghost disabled:opacity-50"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                {t('naming.downloadTemplate')}
              </button>
              <button
                type="button"
                onClick={() => setFieldForm({ field: null })}
                disabled={busy}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                {t('naming.detail.addParam')}
              </button>
            </div>
          )}
        </div>

        {sortedFields.length === 0 ? (
          <p className="rounded-xl border border-dashed border-card-border bg-input-bg/30 p-6 text-center text-sm text-text-muted">
            {t('naming.editor.noFields')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left">
              <thead>
                <tr className="border-b border-card-border">
                  <th className={nameThClass}>{t('naming.table.component')}</th>
                  <th className={nameThClass}>{t('naming.detail.description')}</th>
                  <th className={nameThClass}>{t('naming.table.format')}</th>
                  <th className={nameThClass}>{t('naming.table.example')}</th>
                  <th className={`${nameThClass} pr-0 text-right`}>{t('naming.table.status')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedFields.map((field) => {
                  const activeValues = field.allowedValues.filter((v) => v.isActive);
                  const locked = !!field.lockedValue;
                  return (
                    <tr key={field.id} className="border-b border-card-border align-middle last:border-b-0">
                      <td className="py-4 pr-4">
                        <p className="text-sm font-semibold text-primary">{field.displayName}</p>
                        <p className="font-mono text-xs text-text-muted">{field.code}</p>
                      </td>
                      <td className="py-4 pr-4 text-sm text-text-secondary">
                        {field.description || <span className="text-text-placeholder">—</span>}
                      </td>
                      <td className="py-4 pr-4">
                        <span className="inline-block rounded-md bg-input-bg px-2.5 py-1 font-mono text-xs font-semibold tracking-widest text-text-secondary">
                          {fieldFormat(field)}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <span className="font-mono text-sm font-semibold text-text">{fieldExample(field) || '—'}</span>
                      </td>
                      <td className="py-4 pr-0">
                        {canConfigure ? (
                          <div className="flex items-center justify-end gap-2">
                            {locked ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-success-light px-2.5 py-1 text-xs font-semibold text-success">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                {t('naming.detail.locked')}
                              </span>
                            ) : (
                              <button
                                type="button"
                                role="switch"
                                aria-checked={field.isRequired}
                                disabled={busy}
                                title={t('naming.detail.required')}
                                onClick={() => void run(
                                  () => namingConventionApi.updateField(field.id, { isRequired: !field.isRequired }),
                                  t('naming.toast.updated'),
                                )}
                                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50 ${field.isRequired ? 'bg-primary' : 'bg-card-border'}`}
                              >
                                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${field.isRequired ? 'left-4' : 'left-0.5'}`} />
                              </button>
                            )}
                            {/* Khóa / mở khóa giá trị */}
                            <select
                              value={field.lockedValue?.id ?? ''}
                              disabled={busy || (activeValues.length === 0 && !locked)}
                              title={t('naming.detail.lockHint')}
                              onChange={(e) => {
                                const valueId = e.target.value;
                                void run(
                                  () => (valueId
                                    ? namingConventionApi.setLockedValue(field.id, valueId)
                                    : namingConventionApi.removeLockedValue(field.id)),
                                  t('naming.toast.updated'),
                                );
                              }}
                              className="w-24 rounded-[var(--radius-input)] border border-input-border bg-input-bg px-2 py-1.5 text-xs text-text outline-none focus:border-input-focus disabled:opacity-50"
                            >
                              <option value="">{t('naming.detail.noLock')}</option>
                              {activeValues.map((v) => (
                                <option key={v.id} value={v.id}>{v.code}</option>
                              ))}
                            </select>
                            <button type="button" title={t('naming.detail.editFieldValues')} onClick={() => setFieldForm({ field })} disabled={busy} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-content-bg hover:text-primary disabled:opacity-40">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                            </button>
                            <button type="button" title={t('naming.editor.removeField')} onClick={() => setConfirm({ kind: 'field', field })} disabled={busy} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-danger-light hover:text-danger disabled:opacity-40">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {field.isRequired && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{t('naming.detail.required')}</span>
                            )}
                            {locked && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-success-light px-2 py-0.5 text-xs font-semibold text-success" title={t('naming.detail.lockHint')}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                {t('naming.detail.locked')}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Áp dụng trong thư mục */}
      <div className={cardClass}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">{t('naming.detail.applyInFolder')}</p>
            <p className="mt-1 text-xs text-text-muted">
              {t('naming.appliedFor')} {folderCount} {t('naming.foldersUnit')}
            </p>
          </div>
          {canConfigure && (
            <button
              type="button"
              onClick={() => setApplyOpen(true)}
              disabled={busy}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              {t('naming.detail.applyFolderBtn')}
            </button>
          )}
        </div>

        {folderCount === 0 ? (
          <p className="rounded-xl border border-warning/30 bg-warning-light px-4 py-3 text-sm font-medium text-warning">
            {t('naming.detail.noFolders')}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {convention.assignedFolders.map((folder) => (
              <span key={folder.id} className="inline-flex items-center gap-2 rounded-xl border border-card-border bg-input-bg/60 py-1.5 pl-3 pr-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                <button
                  type="button"
                  onClick={() => setCustomizeFolder(folder)}
                  disabled={busy}
                  title={t('naming.leader.customizeFolder')}
                  className="max-w-[12rem] truncate text-sm font-medium text-text transition-colors hover:text-primary disabled:opacity-50"
                >
                  {folder.name}
                </button>
                {canConfigure && (
                  <button
                    type="button"
                    title={t('naming.detail.unassign')}
                    disabled={busy}
                    onClick={() => void runVoid(() => namingConventionApi.unassignFolder(folder.id), t('naming.toast.unassigned'))}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-danger-light hover:text-danger disabled:opacity-40"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Xem trước trực tiếp — tuân thủ ISO */}
      <div className={cardClass}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">{t('naming.preview.title')}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {sortedFields.length === 0 ? (
                <span className="text-sm text-text-muted">—</span>
              ) : (
                sortedFields.map((field, i) => (
                  <span key={field.id} className="flex items-center gap-1.5">
                    {i > 0 && <span className="font-mono text-base text-text-placeholder">{convention.delimiter}</span>}
                    <span className="rounded-lg bg-input-bg px-2.5 py-1.5 font-mono text-sm font-bold text-primary">{fieldExample(field) || '····'}</span>
                  </span>
                ))
              )}
            </div>
          </div>
          {canConfigure && (
            <button
              type="button"
              onClick={onBack}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              {t('naming.preview.save')}
            </button>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {editOpen && (
        <EditConventionModal
          convention={convention}
          busy={busy}
          onClose={() => setEditOpen(false)}
          onSave={(name, delimiter) => {
            void run(() => namingConventionApi.update(convention.id, { name, delimiter }), t('naming.toast.updated'))
              .then((ok) => { if (ok) setEditOpen(false); });
          }}
        />
      )}

      {fieldForm && (
        <FieldFormModal
          field={fieldForm.field}
          busy={busy}
          onClose={() => setFieldForm(null)}
          onSave={(form, rows) => void handleFieldSave(form, rows)}
        />
      )}

      {applyOpen && (
        <ApplyConventionModal
          convention={convention}
          projectId={projectId}
          onClose={() => setApplyOpen(false)}
          onApplied={(next) => {
            onMutated(next);
            setApplyOpen(false);
            showToast(t('naming.toast.assigned'));
          }}
        />
      )}

      {customizeFolder && (
        <Modal
          title={`${t('naming.leader.customizeFolder')} · ${customizeFolder.name}`}
          onClose={() => setCustomizeFolder(null)}
          maxWidth="max-w-lg"
        >
          <FolderFieldSelectionEditor
            folderId={customizeFolder.id}
            canManage
            onSaved={() => {
              setCustomizeFolder(null);
              showToast(t('naming.folder.customized'));
            }}
            footerLeft={
              <button
                type="button"
                onClick={() => setCustomizeFolder(null)}
                className="btn-modal-ghost"
              >
                {t('naming.cancel')}
              </button>
            }
          />
        </Modal>
      )}

      {confirm && (
        <ConfirmModal
          title={confirm.kind === 'convention' ? t('naming.detail.delete') : t('naming.editor.removeField')}
          message={confirm.kind === 'convention' ? t('naming.detail.deleteConfirm') : t('naming.detail.deleteFieldConfirm')}
          confirmLabel={t('naming.detail.delete')}
          busy={busy}
          onConfirm={() => void handleConfirm()}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
