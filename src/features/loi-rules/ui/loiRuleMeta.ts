import type { LoiDiscipline, LoiParamGroup, LoiStage } from '@/entities/loi-check';
import { LOI_DISCIPLINE_LABEL_KEY, LoiParamGroup as ParamGroup } from '@/entities/loi-check';
import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';

const DISCIPLINE_KEY = LOI_DISCIPLINE_LABEL_KEY;

const PARAM_GROUP_KEY: Record<LoiParamGroup, TranslationKey> = {
  1: 'loi.group.dinhDanh',
  2: 'loi.group.dinhVi',
  3: 'loi.group.hinhHoc',
  4: 'loi.group.quyCach',
  5: 'loi.group.vatLieu',
};

const PARAM_GROUP_SHORT_KEY: Record<LoiParamGroup, TranslationKey> = {
  1: 'loiRule.group.short.dinhDanh',
  2: 'loiRule.group.short.dinhVi',
  3: 'loiRule.group.short.hinhHoc',
  4: 'loiRule.group.short.quyCach',
  5: 'loiRule.group.short.vatLieu',
};

const STAGE_KEY: Record<LoiStage, TranslationKey> = {
  2: 'loi.stage.2',
  3: 'loi.stage.3',
  4: 'loi.stage.4',
  5: 'loi.stage.5',
};

const GROUP_TONE: Record<LoiParamGroup, string> = {
  1: 'bg-primary-tint text-primary-deep',
  2: 'bg-info-light text-info',
  3: 'bg-accent-amber-tint text-accent-amber',
  4: 'bg-surface-sand-alt text-text-secondary',
  5: 'bg-success-light text-success',
};

const STAGE_TONE: Record<LoiStage, string> = {
  2: 'bg-primary text-white',
  3: 'bg-info text-white',
  4: 'bg-accent-amber text-white',
  5: 'bg-danger text-white',
};

export const disciplineLabel = (discipline: LoiDiscipline) => t(DISCIPLINE_KEY[discipline]);

export const paramGroupLabel = (group: LoiParamGroup) => t(PARAM_GROUP_KEY[group]);

export const paramGroupShortLabel = (group: LoiParamGroup) => t(PARAM_GROUP_SHORT_KEY[group]);

export const paramGroupTone = (group: LoiParamGroup) => GROUP_TONE[group];

export const stageLabel = (stage: LoiStage) => t(STAGE_KEY[stage]);

export const stageTone = (stage: LoiStage) => STAGE_TONE[stage];

export const PARAM_GROUP_ORDER: readonly LoiParamGroup[] = [
  ParamGroup.DinhDanh,
  ParamGroup.DinhVi,
  ParamGroup.HinhHoc,
  ParamGroup.QuyCach,
  ParamGroup.VatLieu,
];

export const EMPTY_VARIANT_LABEL = () => t('loiRule.variant.default');

export const variantLabel = (variant: string | null) => variant ?? EMPTY_VARIANT_LABEL();
