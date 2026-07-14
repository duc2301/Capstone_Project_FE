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

export interface LoiMissingField {
  fieldName: string;
  group: LoiParamGroup;
  stage: number;
  missingCount: number;
}

export interface LoiCheckResult {
  status: LoiCheckStatus;
  verdict: LoiVerdict;
  coveragePercent: number;
  totalElements: number;
  conformantElements: number;
  elementsWithUnknownType: number;
  schemaName: string | null;
  error: string | null;
  checkedAt: string | null;
  missing: LoiMissingField[];
}
