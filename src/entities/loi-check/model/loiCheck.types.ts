export const LoiCheckStatus = {
  None: 0,
  Pending: 1,
  Processing: 2,
  Done: 3,
  Failed: 4,
} as const;
export type LoiCheckStatus = (typeof LoiCheckStatus)[keyof typeof LoiCheckStatus];

export const LoiVerdict = {
  None: 0,
  Conformant: 1,
  Warning: 2,
  Unknown: 3,
  Critical: 4,
} as const;
export type LoiVerdict = (typeof LoiVerdict)[keyof typeof LoiVerdict];

export const LoiParamGroup = {
  DinhDanh: 1,
  DinhVi: 2,
  HinhHoc: 3,
  QuyCach: 4,
  VatLieu: 5,
} as const;
export type LoiParamGroup = (typeof LoiParamGroup)[keyof typeof LoiParamGroup];

export const LoiStage = {
  SchematicDesign: 2,
  DetailedDesign: 3,
  ConstructionDrawing: 4,
  Construction: 5,
} as const;
export type LoiStage = (typeof LoiStage)[keyof typeof LoiStage];

export const LOI_STAGE_OPTIONS: readonly LoiStage[] = [
  LoiStage.SchematicDesign,
  LoiStage.DetailedDesign,
  LoiStage.ConstructionDrawing,
  LoiStage.Construction,
];

export const DEFAULT_LOI_STAGE: LoiStage = LoiStage.SchematicDesign;

export const LoiSeverity = {
  NotApplicable: 0,
  Applicable: 1,
  Passed: 2,
  Warning: 3,
  Error: 4,
} as const;
export type LoiSeverity = (typeof LoiSeverity)[keyof typeof LoiSeverity];

export const LoiCheckSection = {
  Syntax: 1,
  Schema: 2,
  Classification: 3,
  RequiredFields: 4,
  GoodPractice: 5,
} as const;
export type LoiCheckSection = (typeof LoiCheckSection)[keyof typeof LoiCheckSection];

export interface LoiInstance {
  globalId: string | null;
  name: string | null;
  entityType: string;
  details: string[];
}

export interface LoiRuleResult {
  code: string;
  severity: LoiSeverity;
  occurrenceCount: number;
  truncated: boolean;
  instances: LoiInstance[];
}

export interface LoiSection {
  section: LoiCheckSection;
  severity: LoiSeverity;
  rules: LoiRuleResult[];
}

export interface LoiMissingField {
  fieldName: string;
  variant: string | null;
  group: LoiParamGroup;
  stage: number;
  missingCount: number;
}

export interface LoiUnmappedParam {
  paramNameInModel: string;
  suggestedParamName: string;
  suggestedParamNameNormalized: string;
  confidence: number;
  elementCount: number;
}

export interface LoiUncoveredComponent {
  componentCode: string;
  componentName: string;
  elementCount: number;
}

export interface LoiAlias {
  id: string;
  paramNameInModel: string;
  standardParamName: string;
  isSystemWide: boolean;
  createdAt: string | null;
}

export interface CreateLoiAliasPayload {
  paramNameInModel: string;
  standardParamName: string;
}

export interface LoiCheckResult {
  status: LoiCheckStatus;
  verdict: LoiVerdict;
  targetStage: number;
  coveragePercent: number;
  totalElements: number;
  conformantElements: number;
  elementsWithUnknownType: number;
  elementsNotCoveredByStandard: number;
  schemaName: string | null;
  error: string | null;
  checkedAt: string | null;
  missing: LoiMissingField[];
  unmapped: LoiUnmappedParam[];
  notCovered: LoiUncoveredComponent[];
  sections: LoiSection[];
}
