import { useMemo, useState } from 'react';

import type { MatrixArea } from '@/entities/permission-matrix';
import { t } from '@/shared/lib/i18n';
import { areaLabel } from '../model/permissionMatrixFormat';
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
  mode?: 'multi' | 'single';
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
export function MatrixMultiSelect({ label, options, selected, onChange, allLabel, title, mode = 'multi' }: Readonly<MatrixMultiSelectProps>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const single = mode === 'single';
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const count = selected.length;
  const disabled = options.length === 0;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || (o.path ?? '').toLowerCase().includes(q),
    );
  }, [options, query]);

  const sections = useMemo<{ area: MatrixArea | undefined; items: MatrixFilterOption[] }[]>(() => {
    if (!visible.some((o) => o.area !== undefined)) return [{ area: undefined, items: visible }];
    const byArea = new Map<MatrixArea | undefined, MatrixFilterOption[]>();
    for (const o of visible) {
      const bucket = byArea.get(o.area);
      if (bucket) bucket.push(o);
      else byArea.set(o.area, [o]);
    }
    return [...byArea.entries()].map(([area, items]) => ({ area, items }));
  }, [visible]);

  const selectedLabel = single
    ? options.find((o) => o.value === selected[0])?.label ?? ''
    : '';

  const openPanel = () => {
    setQuery('');
    setOpen(true);
  };

  const toggle = (value: string) => {
    if (single) {
      onChange([value]);
      setOpen(false);
      return;
    }
    const next = new Set(selectedSet);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    // Giữ thứ tự theo options để ổn định giữa các lần refetch.
    onChange(options.filter((o) => next.has(o.value)).map((o) => o.value));
  };

  const clear = () => onChange([]);

  const renderTriggerValue = () => {
    if (count === 0) return <span className="whitespace-nowrap text-text-muted">{allLabel}</span>;
    if (single) return <span className="max-w-40 truncate font-semibold">{selectedLabel}</span>;
    return (
      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">
        {count}
      </span>
    );
  };

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
        {renderTriggerValue()}
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
                <>
                  {single && (
                    <button
                      type="button"
                      onClick={() => { onChange([]); setOpen(false); }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-content-bg"
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          count === 0 ? 'border-primary bg-primary text-white' : 'border-card-border bg-card text-transparent'
                        }`}
                      >
                        <CheckIcon />
                      </span>
                      <span className="flex-1 leading-5 text-text">{allLabel}</span>
                    </button>
                  )}

                  {sections.map((section) => (
                    <div key={section.area ?? 'all'}>
                      {section.area !== undefined && (
                        <p className="sticky top-0 z-10 bg-content-bg px-3 py-1.5 text-2xs font-bold uppercase tracking-[1px] text-text-secondary">
                          {areaLabel(section.area)}
                        </p>
                      )}
                      {section.items.map((o) => {
                        const on = selectedSet.has(o.value);
                        return (
                          <button
                            key={o.value}
                            type="button"
                            onClick={() => toggle(o.value)}
                            className="flex w-full items-start gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-content-bg"
                          >
                            <span
                              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border ${single ? 'rounded-full' : 'rounded'} ${
                                on ? 'border-primary bg-primary text-white' : 'border-card-border bg-card text-transparent'
                              }`}
                            >
                              <CheckIcon />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="cell-wrap block leading-5 text-text" title={o.label}>{o.label}</span>
                              {o.path && (
                                <span className="cell-wrap block text-xs leading-4 text-text-muted" title={o.path}>
                                  {o.path}
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </>
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
