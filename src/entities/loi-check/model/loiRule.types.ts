import type { TranslationKey } from '@/shared/lib/i18n';

import type { LoiParamGroup, LoiStage } from './loiCheck.types';

export const LoiDiscipline = {
  KienTrucKetCau: 0,
  Mep: 1,
} as const;
export type LoiDiscipline = (typeof LoiDiscipline)[keyof typeof LoiDiscipline];

export const LOI_DISCIPLINE_LABEL_KEY: Record<LoiDiscipline, TranslationKey> = {
  0: 'loiRule.discipline.kienTrucKetCau',
  1: 'loiRule.discipline.mep',
};

export const LOI_DISCIPLINE_OPTIONS: readonly LoiDiscipline[] = [
  LoiDiscipline.KienTrucKetCau,
  LoiDiscipline.Mep,
];

export const LOI_PARAM_GROUP_OPTIONS: readonly LoiParamGroup[] = [1, 2, 3, 4, 5];

export interface LoiRuleSet {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  componentCount: number;
  requirementCount: number;
  parameterCount: number;
  projectCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface LoiRuleComponent {
  id: string;
  code: string;
  name: string;
  discipline: LoiDiscipline;
  variantCount: number;
  requirementCount: number;
}

export interface LoiRuleParameter {
  id: string;
  discipline: LoiDiscipline;
  name: string;
  paramGroup: LoiParamGroup;
  orderIndex: number;
  usageCount: number;
}

export interface LoiMatrixCell {
  paramName: string;
  stage: LoiStage;
}

export interface LoiMatrixRow {
  fieldName: string;
  cells: LoiMatrixCell[];
}

export interface LoiMatrixVariant {
  variant: string | null;
  rows: LoiMatrixRow[];
}

export interface LoiMatrix {
  ruleSetId: string;
  componentId: string;
  componentCode: string;
  componentName: string;
  discipline: LoiDiscipline;
  parameters: LoiRuleParameter[];
  variants: LoiMatrixVariant[];
}

export interface UpdateLoiRuleSetPayload {
  name?: string;
  description?: string | null;
}

export interface CreateLoiComponentPayload {
  code: string;
  name: string;
  discipline: LoiDiscipline;
}

export interface UpdateLoiComponentPayload {
  code?: string;
  name?: string;
  discipline?: LoiDiscipline;
}

export interface CreateLoiParameterPayload {
  name: string;
  discipline: LoiDiscipline;
  paramGroup: LoiParamGroup;
  orderIndex: number;
}

export interface UpdateLoiParameterPayload {
  name?: string;
  paramGroup?: LoiParamGroup;
  orderIndex?: number;
}

export interface SaveLoiMatrixPayload {
  variant: string | null;
  rows: LoiMatrixRow[];
}

export interface RenameLoiVariantPayload {
  currentVariant: string | null;
  newVariant: string | null;
}

export const LoiImportMode = {
  CreateNew: 0,
  ReplaceAll: 1,
  Merge: 2,
} as const;
export type LoiImportMode = (typeof LoiImportMode)[keyof typeof LoiImportMode];

export const LoiImportStatus = {
  Added: 0,
  Updated: 1,
  Unchanged: 2,
  MissingInFile: 3,
} as const;
export type LoiImportStatus = (typeof LoiImportStatus)[keyof typeof LoiImportStatus];

export interface LoiImportParameter {
  discipline: LoiDiscipline;
  name: string;
  paramGroup: LoiParamGroup;
  orderIndex: number;
}

export interface LoiImportComponent {
  discipline: LoiDiscipline;
  code: string;
  name: string;
}

export interface LoiImportCell {
  paramName: string;
  stage: LoiStage;
}

export interface LoiImportRow {
  discipline: LoiDiscipline;
  componentCode: string;
  componentName: string;
  variant: string | null;
  fieldOrder: number;
  fieldName: string;
  cells: LoiImportCell[];
}

export interface LoiImportComponentDiff {
  discipline: LoiDiscipline;
  code: string;
  name: string;
  status: LoiImportStatus;
  variantCount: number;
  requirementCount: number;
  currentRequirementCount: number;
}

export interface LoiImportPreview {
  parameters: LoiImportParameter[];
  components: LoiImportComponent[];
  rows: LoiImportRow[];
  diffs: LoiImportComponentDiff[];
  addedCount: number;
  updatedCount: number;
  unchangedCount: number;
  missingCount: number;
  totalCellCount: number;
  taxonomyOnlyCount: number;
  warnings: string[];
}

export interface LoiImportCommitPayload {
  mode: LoiImportMode;
  targetRuleSetId?: string | null;
  newRuleSetName?: string | null;
  newRuleSetDescription?: string | null;
  selectedComponentCodes: string[];
  deleteMissing: boolean;
  parameters: LoiImportParameter[];
  components: LoiImportComponent[];
  rows: LoiImportRow[];
}
