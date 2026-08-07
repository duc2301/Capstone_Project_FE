import { useState } from 'react';

import { t } from '@/shared/lib/i18n';
import { DateRangeCalendar } from './DateRangeCalendar';
import type { DateRangePreset, DateRangeValue } from './dateRange';
import { DATE_RANGE_PRESETS, dateRangeLabel, formatDateKey, presetLabel, presetToDateKeys } from './dateRange';

interface Props {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
  presets?: readonly DateRangePreset[];
  className?: string;
}

export function DateRangeFilter({ value, onChange, presets = DATE_RANGE_PRESETS, className }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRangeValue>(value);

  const isDefault = value.preset === 'all';
  const shownKeys = draft.preset === 'custom'
    ? { from: draft.from, to: draft.to }
    : presetToDateKeys(draft.preset);

  const openPanel = () => {
    setDraft(value);
    setOpen(true);
  };

  const choosePreset = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setDraft({ preset: 'custom', from: undefined, to: undefined });
      return;
    }
    const next: DateRangeValue = { preset };
    setDraft(next);
    onChange(next);
    setOpen(false);
  };

  const pickDay = (dateKey: string) => {
    setDraft((prev) => {
      const hasOpenStart = prev.preset === 'custom' && prev.from && !prev.to;
      if (!hasOpenStart) return { preset: 'custom', from: dateKey, to: undefined };
      return dateKey < prev.from!
        ? { preset: 'custom', from: dateKey, to: undefined }
        : { preset: 'custom', from: prev.from, to: dateKey };
    });
  };

  const applyCustom = () => {
    if (!draft.from) return;
    onChange({ preset: 'custom', from: draft.from, to: draft.to ?? draft.from });
    setOpen(false);
  };

  const clear = () => {
    onChange({ preset: 'all' });
    setOpen(false);
  };

  return (
    <div className={`relative ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-expanded={open}
        title={t('dateRange.label')}
        className={`flex items-center gap-2 rounded-[var(--radius-input)] border bg-card px-4 py-2.5 text-sm transition-colors hover:bg-content-bg ${
          isDefault ? 'border-card-border text-text-secondary' : 'border-primary font-semibold text-primary'
        }`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className="whitespace-nowrap">{dateRangeLabel(value)}</span>
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
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 z-20 mt-2 flex animate-scale-in overflow-hidden rounded-[var(--radius-card)] border border-card-border bg-card shadow-dropdown">
            <div className="flex w-40 shrink-0 flex-col border-r border-card-border py-2">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => choosePreset(preset)}
                  className={`flex items-center justify-between gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-content-bg ${
                    draft.preset === preset ? 'font-semibold text-primary' : 'text-text-secondary'
                  }`}
                >
                  {presetLabel(preset)}
                  {draft.preset === preset && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <div className="p-4">
              <DateRangeCalendar from={shownKeys.from} to={shownKeys.to} onPickDay={pickDay} />

              <div className="mt-3 border-t border-card-border pt-3">
                <p className="field-hint">
                  {draft.preset === 'custom' && draft.from && !draft.to
                    ? t('dateRange.hintEnd')
                    : draft.from
                      ? `${formatDateKey(shownKeys.from)} - ${formatDateKey(shownKeys.to)}`
                      : t('dateRange.hintStart')}
                </p>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button type="button" onClick={clear} className="btn-modal-ghost">
                    {t('dateRange.clear')}
                  </button>
                  <button
                    type="button"
                    onClick={applyCustom}
                    disabled={draft.preset !== 'custom' || !draft.from}
                    className="btn-modal-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t('dateRange.apply')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
