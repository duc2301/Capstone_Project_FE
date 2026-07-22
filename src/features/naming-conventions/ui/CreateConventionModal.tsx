import { useRef, useState } from 'react';

import type { ImportedNamingField, NamingConvention } from '@/entities/naming-convention';
import { NAMING_DELIMITERS, namingConventionApi } from '@/entities/naming-convention';
import { getApiErrorMessage } from '@/shared/api';
import { Modal } from '@/shared/components/modal';
import { t } from '@/shared/lib/i18n';

import { ImportPreviewEditor } from './ImportPreviewEditor';

interface CreateConventionModalProps {
  projectId: string;
  onClose: () => void;
  onCreated: (convention: NamingConvention) => void;
}

const inputClass =
  'w-full rounded-(--radius-input) border border-input-border bg-input-bg px-3.5 py-2.5 text-sm text-text outline-none focus:border-input-focus';
const labelClass = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-muted';

/* Modal tạo bộ quy tắc 2 bước:
 * B1 — tên + delimiter + (tùy chọn) import file xlsx theo template → preview.
 * B2 — chỉnh sửa fields/values (client-state) rồi lưu 1 lần qua POST create. */
export function CreateConventionModal({ projectId, onClose, onCreated }: CreateConventionModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [delimiter, setDelimiter] = useState<string>('-');
  const [fields, setFields] = useState<ImportedNamingField[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const busy = importing || saving;

  const handleImport = async (file: File | null) => {
    if (!file) return;
    setError(null);
    if (!file.name.toLowerCase().endsWith('.xlsx') || file.size > 2 * 1024 * 1024) {
      setError(t('naming.createModal.importHint'));
      return;
    }
    setImporting(true);
    try {
      const { data } = await namingConventionApi.importPreview(file);
      setFields(data.result?.fields ?? []);
      setWarnings(data.result?.warnings ?? []);
      setStep(2);
    } catch (err) {
      setError(getApiErrorMessage(err, t('common.error')));
    } finally {
      setImporting(false);
    }
  };

  const handleNext = () => {
    setError(null);
    if (!name.trim()) {
      setError(t('naming.createModal.nameRequired'));
      return;
    }
    setStep(2);
  };

  const handleSave = async () => {
    setError(null);
    // Chỉ giữ dòng có mã; tên hiển thị trống thì lấy chính mã.
    const cleaned = fields
      .map((f) => ({ ...f, code: f.code.trim(), values: f.values.filter((v) => v.code.trim()) }))
      .filter((f) => f.code);
    if (cleaned.length === 0 || cleaned.some((f) => f.values.length === 0)) {
      setError(t('naming.createModal.fieldsRequired'));
      return;
    }
    setSaving(true);
    try {
      const { data } = await namingConventionApi.create({
        projectId,
        name: name.trim(),
        delimiter,
        fields: cleaned.map((f, i) => ({
          code: f.code,
          displayName: f.displayName.trim() || f.code,
          description: f.description,
          orderIndex: i,
          isRequired: true, // mặc định bắt buộc — admin nới lỏng ở màn chi tiết
          isLocked: false,
          allowedValues: f.values.map((v, j) => ({
            code: v.code.trim(),
            displayName: v.displayName.trim() || v.code.trim(),
            description: v.description,
            orderIndex: j,
          })),
        })),
      });
      if (data.result) onCreated(data.result);
    } catch (err) {
      setError(getApiErrorMessage(err, t('common.error')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={t('naming.createModal.title')} onClose={busy ? () => undefined : onClose} maxWidth="max-w-3xl">
      <div className="space-y-5">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          {step === 1 ? t('naming.createModal.step1') : t('naming.createModal.step2')}
        </p>

        {step === 1 ? (
          <>
            <div>
              <label className={labelClass}>{t('naming.createModal.name')}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('naming.createModal.namePlaceholder')}
                className={inputClass}
                autoFocus
              />
            </div>

            <div>
              <label className={labelClass}>{t('naming.createModal.delimiter')}</label>
              <div className="flex gap-2">
                {NAMING_DELIMITERS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDelimiter(d)}
                    className={`flex h-11 w-14 items-center justify-center rounded-xl border font-mono text-lg font-bold transition-colors ${
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

            {/* Import xlsx (tùy chọn) */}
            <div>
              <label className={labelClass}>{t('naming.createModal.import')}</label>
              <div className="flex flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed border-card-border bg-input-bg/30 px-6 py-8 text-center">
                <span className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                    <line x1="9" y1="15" x2="15" y2="15" /><line x1="9" y1="18" x2="13" y2="18" />
                  </svg>
                </span>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={importing}
                  className="font-semibold text-primary hover:underline disabled:opacity-50"
                >
                  {importing ? t('naming.createModal.importing') : t('naming.createModal.importChoose')}
                </button>
                <p className="text-xs text-text-placeholder">{t('naming.createModal.importHint')}</p>
                <p className="text-xs text-text-muted">{t('naming.createModal.orManual')}</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(e) => { void handleImport(e.target.files?.[0] ?? null); e.target.value = ''; }}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {warnings.length > 0 && (
              <div className="space-y-1 rounded-xl border border-warning/30 bg-warning-light px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-warning">{t('naming.createModal.warnings')}</p>
                <ul className="list-inside list-disc space-y-0.5">
                  {warnings.map((w, i) => (
                    <li key={i} className="text-xs text-text-secondary">{w}</li>
                  ))}
                </ul>
              </div>
            )}
            <ImportPreviewEditor fields={fields} delimiter={delimiter} onChange={setFields} />
          </>
        )}

        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-card-border pt-4">
          {step === 2 && (
            <button
              type="button"
              onClick={() => { setStep(1); setError(null); }}
              disabled={busy}
              className="mr-auto rounded-xl px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg disabled:opacity-40"
            >
              ← {t('naming.createModal.backStep')}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg disabled:opacity-40"
          >
            {t('naming.cancel')}
          </button>
          {step === 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={busy}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('naming.createModal.next')} →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={busy}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? t('common.loading') : t('naming.createModal.save')}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
