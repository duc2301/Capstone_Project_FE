import { useMemo, useState } from 'react';

import { t } from '@/shared/lib/i18n';
import type { TranslationKey } from '@/shared/lib/i18n';
import { fromDateKey, toDateKey } from './dateRange';

const WEEKDAY_KEYS: TranslationKey[] = [
  'dateRange.weekday.mon',
  'dateRange.weekday.tue',
  'dateRange.weekday.wed',
  'dateRange.weekday.thu',
  'dateRange.weekday.fri',
  'dateRange.weekday.sat',
  'dateRange.weekday.sun',
];

const WEEKS_SHOWN = 6;
const DAYS_IN_WEEK = 7;

interface Props {
  from?: string;
  to?: string;
  onPickDay: (dateKey: string) => void;
  maxDate?: Date;
}

export function DateRangeCalendar({ from, to, onPickDay, maxDate }: Props) {
  const anchor = fromDateKey(from ?? '') ?? new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(anchor.getFullYear(), anchor.getMonth(), 1),
  );

  const limit = maxDate ?? new Date();
  const limitKey = toDateKey(limit);
  const todayKey = toDateKey(new Date());

  const days = useMemo(() => buildGrid(visibleMonth), [visibleMonth]);

  const shiftMonth = (delta: number) =>
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));

  const monthLabel = visibleMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  return (
    <div className="w-[264px]">
      <div className="flex items-center justify-between">
        <NavButton label={t('dateRange.prevMonth')} onClick={() => shiftMonth(-1)} direction="prev" />
        <span className="text-sm font-semibold capitalize text-text">{monthLabel}</span>
        <NavButton label={t('dateRange.nextMonth')} onClick={() => shiftMonth(1)} direction="next" />
      </div>

      <div className="mt-3 grid grid-cols-7 gap-y-1">
        {WEEKDAY_KEYS.map((key) => (
          <span key={key} className="text-center text-2xs font-bold uppercase text-text-muted">
            {t(key)}
          </span>
        ))}

        {days.map((day) => {
          const key = toDateKey(day);
          const outside = day.getMonth() !== visibleMonth.getMonth();
          const disabled = key > limitKey;
          const isFrom = Boolean(from) && key === from;
          const isTo = Boolean(to) && key === to;
          const inRange = Boolean(from && to) && key > from! && key < to!;
          const isEdge = isFrom || isTo;

          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onPickDay(key)}
              className={`h-8 text-xs font-medium transition-colors ${edgeShape(isFrom, isTo)} ${
                isEdge
                  ? 'bg-primary text-white'
                  : inRange
                    ? 'bg-primary-ghost text-primary'
                    : disabled
                      ? 'cursor-not-allowed text-text-placeholder'
                      : outside
                        ? 'text-text-placeholder hover:bg-content-bg'
                        : 'text-text hover:bg-content-bg'
              } ${!isEdge && key === todayKey ? 'font-bold text-primary' : ''}`}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function edgeShape(isFrom: boolean, isTo: boolean): string {
  if (isFrom && isTo) return 'rounded-full';
  if (isFrom) return 'rounded-l-full';
  if (isTo) return 'rounded-r-full';
  return 'rounded-md';
}

function buildGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);

  return Array.from({ length: WEEKS_SHOWN * DAYS_IN_WEEK }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return day;
  });
}

function NavButton({
  label,
  onClick,
  direction,
}: {
  label: string;
  onClick: () => void;
  direction: 'prev' | 'next';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-content-bg hover:text-text"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points={direction === 'prev' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
      </svg>
    </button>
  );
}
