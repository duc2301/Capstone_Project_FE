import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';

export const WORK_TYPE_CODES = ['XDT', 'STR', 'ARC', 'MEP', 'FIN', 'RCC', 'INF', 'PCCC'] as const;
export type WorkTypeCode = (typeof WORK_TYPE_CODES)[number];

const LABEL_KEY: Record<WorkTypeCode, TranslationKey> = {
  XDT: 'packages.workType.XDT',
  STR: 'packages.workType.STR',
  ARC: 'packages.workType.ARC',
  MEP: 'packages.workType.MEP',
  FIN: 'packages.workType.FIN',
  RCC: 'packages.workType.RCC',
  INF: 'packages.workType.INF',
  PCCC: 'packages.workType.PCCC',
};

export function workTypeLabel(code: string): string {
  const key = LABEL_KEY[code as WorkTypeCode];
  return key ? t(key) : code;
}

export function parseWorkTypes(raw: string | undefined | null): string[] {
  if (!raw) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

export function serializeWorkTypes(codes: string[]): string {
  return codes.join(',');
}
