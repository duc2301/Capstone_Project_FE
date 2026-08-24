import { useMemo, useState } from 'react';

import { t } from '@/shared/lib/i18n';
import type { MatrixFilterOption } from '../model/usePermissionMatrix';

interface MatrixMultiSelectProps {
  /** Nhãn nút + aria-label (vd "Nhóm"). */
  label: string;
  options: MatrixFilterOption[];
  /** Danh sách value đang chọn. */
  selected: string[];
  onChange: (next: string[]) => void;
  /** Text khi chưa chọn gì (vd "Tất cả nhóm"). */
  allLabel: string;
  /** Tooltip mô tả tác dụng của bộ lọc này. */
  title?: string;
}

/* Số tuỳ chọn tối thiểu để hiện ô tìm kiếm trong dropdown. */
const SEARCH_THRESHOLD = 6;

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* Bộ lọc đa chọn dạng dropdown checkbox. Đổi ô tick => onChange ngay. */
export function MatrixMultiSelect({ label, options, selected, onChange, allLabel, title }: MatrixMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const count = selected.length;
  const disabled = options.length === 0;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const openPanel = () => {
    setQuery('');
    setOpen(true);
  };

  const toggle = (value: string) => {
    const next = new Set(selectedSet);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    // Giữ thứ tự theo options để ổn định giữa các lần refetch.
    onChange(options.filter((o) => next.has(o.value)).map((o) => o.value));
  };

  const clear = () => onChange([]);

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-expanded={open}
        title={title}
        className={`flex items-center gap-2 rounded-[var(--radius-input)] border bg-card px-3.5 py-2.5 text-sm transition-colors hover:bg-content-bg disabled:cursor-not-allowed disabled:opacity-50 ${
          count > 0 ? 'border-primary font-semibold text-primary' : 'border-card-border text-text-secondary'
        }`}
      >
        <span className="whitespace-nowrap">{label}</span>
        {count > 0 ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">
            {count}
          </span>
        ) : (
          <span className="whitespace-nowrap text-text-muted">{allLabel}</span>
        )}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute left-0 z-50 mt-2 flex w-64 animate-scale-in flex-col overflow-hidden rounded-[var(--radius-card)] border border-card-border bg-card shadow-dropdown">
            {options.length > SEARCH_THRESHOLD && (
              <div className="border-b border-card-border p-2">
                <input
                  type="text"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('matrix.filter.searchPlaceholder')}
                  className="field-input w-full py-1.5 text-sm"
                />
              </div>
            )}

            <div className="admin-scrollbar max-h-64 overflow-y-auto py-1">
              {visible.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-text-muted">{t('matrix.filter.noOptions')}</p>
              ) : (
                visible.map((o) => {
                  const on = selectedSet.has(o.value);
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => toggle(o.value)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-content-bg"
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          on ? 'border-primary bg-primary text-white' : 'border-card-border bg-card text-transparent'
                        }`}
                      >
                        <CheckIcon />
                      </span>
                      <span className="cell-wrap flex-1 leading-5 text-text" title={o.label}>{o.label}</span>
                    </button>
                  );
                })
              )}
            </div>

            {count > 0 && (
              <div className="border-t border-card-border p-2">
                <button
                  type="button"
                  onClick={clear}
                  className="w-full rounded-[var(--radius-input)] px-3 py-1.5 text-center text-xs font-semibold text-text-secondary transition-colors hover:bg-content-bg"
                >
                  {t('matrix.filter.clearOne').replace('{n}', String(count))}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
