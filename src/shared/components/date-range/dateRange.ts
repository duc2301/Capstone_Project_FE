import { t } from '@/shared/lib/i18n';
import type { TranslationKey } from '@/shared/lib/i18n';

export const DATE_RANGE_PRESETS = ['all', 'today', '7d', '30d', '90d', 'custom'] as const;
export type DateRangePreset = (typeof DATE_RANGE_PRESETS)[number];

export interface DateRangeValue {
  preset: DateRangePreset;
  from?: string;
  to?: string;
}

export interface DateRangeQuery {
  from?: string;
  to?: string;
}

export const ALL_TIME: DateRangeValue = { preset: 'all' };

const PRESET_LABEL_KEY: Record<DateRangePreset, TranslationKey> = {
  all: 'dateRange.all',
  today: 'dateRange.today',
  '7d': 'dateRange.7d',
  '30d': 'dateRange.30d',
  '90d': 'dateRange.90d',
  custom: 'dateRange.custom',
};

export function presetLabel(preset: DateRangePreset): string {
  return t(PRESET_LABEL_KEY[preset]);
}

export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromDateKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateKey(key: string | undefined): string {
  const date = key ? fromDateKey(key) : null;
  return date ? date.toLocaleDateString('vi-VN') : '';
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysAgo(count: number): Date {
  const date = startOfDay(new Date());
  date.setDate(date.getDate() - count);
  return date;
}

export function presetToDateKeys(preset: DateRangePreset): { from?: string; to?: string } {
  if (preset === 'all' || preset === 'custom') return {};

  const to = toDateKey(new Date());
  if (preset === 'today') return { from: to, to };
  if (preset === '7d') return { from: toDateKey(daysAgo(6)), to };
  if (preset === '30d') return { from: toDateKey(daysAgo(29)), to };
  return { from: toDateKey(daysAgo(89)), to };
}

export function resolveDateRange(value: DateRangeValue): DateRangeQuery {
  const keys = value.preset === 'custom'
    ? { from: value.from, to: value.to }
    : presetToDateKeys(value.preset);

  const fromDate = keys.from ? fromDateKey(keys.from) : null;
  const toDate = keys.to ? fromDateKey(keys.to) : null;
  if (toDate) toDate.setDate(toDate.getDate() + 1);

  return {
    from: fromDate ? fromDate.toISOString() : undefined,
    to: toDate ? toDate.toISOString() : undefined,
  };
}

export function dateRangeLabel(value: DateRangeValue): string {
  if (value.preset !== 'custom') return presetLabel(value.preset);
  if (value.from && value.to) return `${formatDateKey(value.from)} - ${formatDateKey(value.to)}`;
  if (value.from) return `${t('dateRange.fromShort')} ${formatDateKey(value.from)}`;
  if (value.to) return `${t('dateRange.toShort')} ${formatDateKey(value.to)}`;
  return presetLabel('all');
}
