import { useState } from 'react';

import type { AssignedFolder, NamingConvention, NamingField } from '@/entities/naming-convention';
import { NAMING_DELIMITERS, namingConventionApi } from '@/entities/naming-convention';
import { getApiErrorMessage } from '@/shared/api';
import { Modal } from '@/shared/components/modal';
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

const inputClass =
  'w-full rounded-(--radius-input) border border-input-border bg-input-bg px-3.5 py-2.5 text-sm text-text outline-none focus:border-input-focus';
const labelClass = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-muted';
const cardClass = 'rounded-[24px] border border-card-border/60 bg-card/70 p-6 shadow-card backdrop-blur-sm';

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
          <button type="button" onClick={onClose} disabled={busy} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg disabled:opacity-40">
            {t('naming.cancel')}
          </button>
          <button
            type="button"
            onClick={() => onSave(name.trim(), delimiter)}
            disabled={busy || !name.trim()}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="w-28 shrink-0 rounded-(--radius-input) border border-input-border bg-input-bg px-2.5 py-1.5 font-mono text-sm font-semibold uppercase text-text outline-none focus:border-input-focus"
                  />
                  <input
                    value={row.displayName}
                    onChange={(e) => patchRow(i, { displayName: e.target.value })}
                    placeholder={t('naming.editor.valueName')}
                    className="min-w-0 flex-1 rounded-(--radius-input) border border-input-border bg-input-bg px-2.5 py-1.5 text-sm text-text outline-none focus:border-input-focus"
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
            className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary-ghost"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            {t('naming.editor.addValue')}
          </button>
        </div>

        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        <div className="flex justify-end gap-3 border-t border-card-border pt-4">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg disabled:opacity-40">
            {t('naming.cancel')}
          </button>
          <button type="button" onClick={submit} disabled={busy} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
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
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);
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
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-content-bg hover:text-primary"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
            </button>
            <div className="min-w-0">
              <h2 className="truncate font-display text-2xl font-semibold text-primary">{convention.name}</h2>
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

      {/* Các trường */}
      <div className={cardClass}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="7" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="21" y1="18" x2="7" y2="18" /></svg>
            </span>
            <h3 className="font-display text-base font-medium text-primary">{t('naming.detail.fields')}</h3>
          </div>
          {canConfigure && (
            <button
              type="button"
              onClick={() => setFieldForm({ field: null })}
              disabled={busy}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              {t('naming.editor.addField')}
            </button>
          )}
        </div>

        {sortedFields.length === 0 ? (
          <p className="rounded-xl border border-dashed border-card-border bg-input-bg/30 p-6 text-center text-sm text-text-muted">
            {t('naming.editor.noFields')}
          </p>
        ) : (
          <ul className="space-y-2">
            {sortedFields.map((field, idx) => {
              const open = expandedFieldId === field.id;
              const activeValues = field.allowedValues.filter((v) => v.isActive);
              return (
                <li key={field.id} className="rounded-2xl border border-card-border bg-card">
                  <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 sm:flex-nowrap">
                    <button
                      type="button"
                      onClick={() => setExpandedFieldId(open ? null : field.id)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-content-bg hover:text-text"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
                    </button>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs font-bold text-primary">{idx + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">
                        <span className="font-mono font-bold text-text">{field.code}</span>
                        <span className="text-text-secondary"> · {field.displayName}</span>
                      </p>
                      <p className="text-xs text-text-muted">
                        {field.allowedValues.length} {t('naming.editor.values').toLowerCase()}
                        {field.description ? ` · ${field.description}` : ''}
                      </p>
                    </div>

                    {canConfigure ? (
                      <>
                        {/* Bắt buộc */}
                        <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs font-semibold text-text-secondary">
                          <input
                            type="checkbox"
                            checked={field.isRequired}
                            disabled={busy}
                            onChange={() => void run(
                              () => namingConventionApi.updateField(field.id, { isRequired: !field.isRequired }),
                              t('naming.toast.updated'),
                            )}
                            className="h-4 w-4 accent-primary"
                          />
                          {t('naming.detail.required')}
                        </label>

                        {/* Khóa giá trị */}
                        <div className="flex shrink-0 items-center gap-1.5" title={t('naming.detail.lockHint')}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={field.lockedValue ? 'text-warning' : 'text-text-placeholder'}>
                            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          <select
                            value={field.lockedValue?.id ?? ''}
                            disabled={busy || (activeValues.length === 0 && !field.lockedValue)}
                            onChange={(e) => {
                              const valueId = e.target.value;
                              void run(
                                () => (valueId
                                  ? namingConventionApi.setLockedValue(field.id, valueId)
                                  : namingConventionApi.removeLockedValue(field.id)),
                                t('naming.toast.updated'),
                              );
                            }}
                            className="w-40 rounded-(--radius-input) border border-input-border bg-input-bg px-2.5 py-1.5 text-xs text-text outline-none focus:border-input-focus disabled:opacity-50"
                          >
                            <option value="">{t('naming.detail.noLock')}</option>
                            {activeValues.map((v) => (
                              <option key={v.id} value={v.id}>{v.code} — {v.displayName}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex shrink-0 items-center">
                          <button type="button" title={t('naming.detail.editFieldValues')} onClick={() => setFieldForm({ field })} disabled={busy} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-content-bg hover:text-primary disabled:opacity-40">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </button>
                          <button type="button" title={t('naming.editor.removeField')} onClick={() => setConfirm({ kind: 'field', field })} disabled={busy} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-danger-light hover:text-danger disabled:opacity-40">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                          </button>
                        </div>
                      </>
                    ) : (
                      /* Leader: chỉ xem — badge thay control */
                      <div className="flex shrink-0 items-center gap-1.5">
                        {field.isRequired && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{t('naming.detail.required')}</span>
                        )}
                        {field.lockedValue && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning-light px-2 py-0.5 text-xs font-semibold text-warning" title={t('naming.detail.lockHint')}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                            {field.lockedValue.code}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expand: chip gọn, chỉ xem — sửa/thêm value qua modal (nút bút chì) */}
                  {open && (
                    <div className="border-t border-card-border bg-input-bg/30 px-4 py-3">
                      {field.allowedValues.length === 0 ? (
                        <p className="py-1 text-center text-xs text-text-muted">{t('naming.editor.noValues')}</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {[...field.allowedValues]
                            .sort((a, b) => a.orderIndex - b.orderIndex)
                            .map((value) => {
                              const isLockedValue = field.lockedValue?.id === value.id;
                              return (
                                <span
                                  key={value.id}
                                  className={`inline-flex items-center gap-1.5 rounded-full border border-card-border bg-card px-2.5 py-1 text-xs ${value.isActive ? '' : 'opacity-50'}`}
                                  title={value.isActive ? value.displayName : `${value.displayName} (${t('naming.detail.valueInactive')})`}
                                >
                                  <span className="font-mono font-bold text-primary">{value.code}</span>
                                  <span className="max-w-40 truncate text-text-secondary">{value.displayName}</span>
                                  {isLockedValue && (
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                  )}
                                </span>
                              );
                            })}
                        </div>
                      )}
                      {canConfigure && (
                        <button
                          type="button"
                          onClick={() => setFieldForm({ field })}
                          disabled={busy}
                          className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary-ghost disabled:opacity-50"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          {t('naming.detail.editFieldValues')}
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Thư mục áp dụng */}
      <div className={cardClass}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
            </span>
            <div>
              <h3 className="font-display text-base font-medium text-primary">{t('naming.detail.assignedFolders')}</h3>
              <p className="text-xs text-text-muted">
                {t('naming.appliedFor')} {folderCount} {t('naming.foldersUnit')}
              </p>
            </div>
          </div>
          {canConfigure && (
            <button
              type="button"
              onClick={() => setApplyOpen(true)}
              disabled={busy}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              {t('naming.detail.applyBtn')}
            </button>
          )}
        </div>

        {folderCount === 0 ? (
          <p className="rounded-xl border border-warning/30 bg-warning-light px-4 py-3 text-sm font-medium text-warning">
            {t('naming.detail.noFolders')}
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {convention.assignedFolders.map((folder) => (
              <li key={folder.id} className="flex items-center gap-2.5 rounded-xl border border-card-border bg-card px-3.5 py-2.5">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-text">{folder.name}</span>
                <button
                  type="button"
                  onClick={() => setCustomizeFolder(folder)}
                  disabled={busy}
                  className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary-ghost disabled:opacity-50"
                >
                  {t('naming.leader.customizeFolder')}
                </button>
                {canConfigure && (
                  <button
                    type="button"
                    title={t('naming.detail.unassign')}
                    disabled={busy}
                    onClick={() => void runVoid(() => namingConventionApi.unassignFolder(folder.id), t('naming.toast.unassigned'))}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-danger-light hover:text-danger disabled:opacity-40"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
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
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg"
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
