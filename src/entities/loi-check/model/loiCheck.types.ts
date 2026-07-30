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

/** Thứ tự tăng dần có chủ đích: trạng thái một lớp = mức cao nhất của các quy tắc con. */
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
  /** Trường còn thiếu, mã phân loại lạ… của riêng cấu kiện này. */
  details: string[];
}

export interface LoiRuleResult {
  /** Mã 3 chữ + 3 số: STP001, CLS002, LOI003… */
  code: string;
  severity: LoiSeverity;
  occurrenceCount: number;
  /** Danh sách instances đã bị cắt bớt (model lớn). */
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
  /** Đã chuẩn hoá — cũng là khoá dùng khi tạo ánh xạ. */
  paramNameInModel: string;
  suggestedParamName: string;
  suggestedParamNameNormalized: string;
  confidence: number;
  elementCount: number;
}

/** Mã hợp lệ nhưng chuẩn không quy định trường nào (Phụ lục 02 chỉ phủ 71/222 cấu kiện). */
export interface LoiUncoveredComponent {
  componentCode: string;
  componentName: string;
  elementCount: number;
}

export interface LoiAlias {
  id: string;
  paramNameInModel: string;
  standardParamName: string;
  /** Ánh xạ dùng chung toàn hệ thống, dự án không xoá được. */
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
  /** Không khai mã, hoặc mã không có trong Phụ lục 02. */
  elementsWithUnknownType: number;
  /** Mã hợp lệ nhưng chuẩn không quy định trường nào — không phải lỗi model. */
  elementsNotCoveredByStandard: number;
  schemaName: string | null;
  error: string | null;
  checkedAt: string | null;
  missing: LoiMissingField[];
  unmapped: LoiUnmappedParam[];
  notCovered: LoiUncoveredComponent[];
  sections: LoiSection[];
}
