import { useState } from 'react';

import type { ImportedNamingField } from '@/entities/naming-convention';
import { t } from '@/shared/lib/i18n';

interface ImportPreviewEditorProps {
  fields: ImportedNamingField[];
  delimiter: string;
  onChange: (fields: ImportedNamingField[]) => void;
}

const inputClass =
  'w-full rounded-(--radius-input) border border-input-border bg-input-bg px-3 py-2 text-sm text-text outline-none focus:border-input-focus';

/* Editor thuần client-state cho bước preview trước khi lưu:
 * sửa/thêm/xóa field + value, đổi thứ tự bằng nút ↑↓. OrderIndex chốt theo vị trí mảng khi lưu. */
export function ImportPreviewEditor({ fields, delimiter, onChange }: ImportPreviewEditorProps) {
  // Accordion: mở 1 field 1 lúc cho gọn (theo index).
  const [expanded, setExpanded] = useState<number | null>(fields.length > 0 ? 0 : null);

  const patchField = (i: number, patch: Partial<ImportedNamingField>) =>
    onChange(fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));

  const moveField = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= fields.length) return;
    const next = [...fields];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    if (expanded === i) setExpanded(j);
    else if (expanded === j) setExpanded(i);
  };

  const removeField = (i: number) => {
    onChange(fields.filter((_, idx) => idx !== i));
    if (expanded === i) setExpanded(null);
    else if (expanded !== null && expanded > i) setExpanded(expanded - 1);
  };

  const addField = () => {
    onChange([...fields, { code: '', displayName: '', description: null, orderIndex: fields.length, values: [] }]);
    setExpanded(fields.length);
  };

  const patchValue = (fi: number, vi: number, patch: { code?: string; displayName?: string }) =>
    patchField(fi, {
      values: fields[fi].values.map((v, idx) => (idx === vi ? { ...v, ...patch } : v)),
    });

  const addValue = (fi: number) =>
    patchField(fi, {
      values: [...fields[fi].values, { code: '', displayName: '', description: null, orderIndex: fields[fi].values.length }],
    });

  const removeValue = (fi: number, vi: number) =>
    patchField(fi, { values: fields[fi].values.filter((_, idx) => idx !== vi) });

  const structurePreview = fields
    .map((f) => f.code.trim() || '?')
    .filter(Boolean)
    .join(delimiter);

  return (
    <div className="space-y-3">
      {/* Xem trước cấu trúc tên: các mã trường nối bằng delimiter */}
      {fields.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-card-border bg-input-bg/50 px-3.5 py-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{t('naming.editor.previewLabel')}</span>
          <span className="truncate font-mono text-sm font-semibold text-primary">{structurePreview}</span>
        </div>
      )}

      {fields.length === 0 ? (
        <p className="rounded-xl border border-dashed border-card-border bg-input-bg/30 p-6 text-center text-sm text-text-muted">
          {t('naming.editor.noFields')}
        </p>
      ) : (
        <ul className="space-y-2">
          {fields.map((field, fi) => {
            const open = expanded === fi;
            return (
              <li key={fi} className="rounded-2xl border border-card-border bg-card">
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : fi)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-content-bg hover:text-text"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs font-bold text-primary">
                    {fi + 1}
                  </span>
                  <input
                    value={field.code}
                    onChange={(e) => patchField(fi, { code: e.target.value.toUpperCase() })}
                    placeholder={t('naming.field.codePlaceholder')}
                    className={`${inputClass} w-32 shrink-0 font-mono font-semibold uppercase`}
                  />
                  <input
                    value={field.displayName}
                    onChange={(e) => patchField(fi, { displayName: e.target.value })}
                    placeholder={t('naming.field.namePlaceholder')}
                    className={`${inputClass} min-w-0 flex-1`}
                  />
                  <span className="shrink-0 rounded-full bg-content-bg px-2.5 py-1 text-xs font-semibold text-text-muted">
                    {field.values.length} {t('naming.editor.values').toLowerCase()}
                  </span>
                  <div className="flex shrink-0 items-center">
                    <button type="button" title={t('naming.editor.moveUp')} onClick={() => moveField(fi, -1)} disabled={fi === 0} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-content-bg hover:text-text disabled:opacity-30">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
                    </button>
                    <button type="button" title={t('naming.editor.moveDown')} onClick={() => moveField(fi, 1)} disabled={fi === fields.length - 1} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-content-bg hover:text-text disabled:opacity-30">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                    </button>
                    <button type="button" title={t('naming.editor.removeField')} onClick={() => removeField(fi)} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-danger-light hover:text-danger">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    </button>
                  </div>
                </div>

                {open && (
                  <div className="space-y-2 border-t border-card-border bg-input-bg/30 px-3 py-3">
                    {field.values.length === 0 ? (
                      <p className="py-2 text-center text-xs text-text-muted">{t('naming.editor.noValues')}</p>
                    ) : (
                      // Lưới 2 cột + khung cuộn: field nhiều giá trị không kéo dài UI.
                      <div className="grid max-h-56 grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
                        {field.values.map((value, vi) => (
                          <div key={vi} className="flex items-center gap-1.5">
                            <input
                              value={value.code}
                              onChange={(e) => patchValue(fi, vi, { code: e.target.value.toUpperCase() })}
                              placeholder={t('naming.editor.valueCode')}
                              className={`${inputClass} w-24 shrink-0 bg-card font-mono font-semibold uppercase`}
                            />
                            <input
                              value={value.displayName}
                              onChange={(e) => patchValue(fi, vi, { displayName: e.target.value })}
                              placeholder={t('naming.editor.valueName')}
                              className={`${inputClass} min-w-0 flex-1 bg-card`}
                            />
                            <button type="button" title={t('naming.editor.removeValue')} onClick={() => removeValue(fi, vi)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-danger-light hover:text-danger">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => addValue(fi)}
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary-ghost"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      {t('naming.editor.addValue')}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={addField}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-card-border px-4 py-3 text-sm font-semibold text-text-secondary transition-colors hover:border-primary hover:bg-primary-ghost hover:text-primary"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        {t('naming.editor.addField')}
      </button>
    </div>
  );
}
