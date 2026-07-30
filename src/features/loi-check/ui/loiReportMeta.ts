import type { LoiCheckSection, LoiSeverity } from '@/entities/loi-check';
import { LoiCheckSection as Section, LoiSeverity as Severity } from '@/entities/loi-check';
import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';

/** Đúng thứ tự chạy: lớp trước hỏng thì lớp sau không có gì để chấm. */
export const LOI_SECTION_ORDER: readonly LoiCheckSection[] = [
  Section.Syntax,
  Section.Schema,
  Section.Classification,
  Section.RequiredFields,
  Section.GoodPractice,
];

const SECTION_LABEL_KEY: Record<LoiCheckSection, TranslationKey> = {
  [Section.Syntax]: 'loi.section.syntax',
  [Section.Schema]: 'loi.section.schema',
  [Section.Classification]: 'loi.section.classification',
  [Section.RequiredFields]: 'loi.section.requiredFields',
  [Section.GoodPractice]: 'loi.section.goodPractice',
};

export function sectionLabel(section: LoiCheckSection): string {
  const key = SECTION_LABEL_KEY[section];
  return key ? t(key) : String(section);
}

const SEVERITY_LABEL_KEY: Record<LoiSeverity, TranslationKey> = {
  [Severity.NotApplicable]: 'loi.severity.notApplicable',
  [Severity.Applicable]: 'loi.severity.applicable',
  [Severity.Passed]: 'loi.severity.passed',
  [Severity.Warning]: 'loi.severity.warning',
  [Severity.Error]: 'loi.severity.error',
};

export function severityLabel(severity: LoiSeverity): string {
  const key = SEVERITY_LABEL_KEY[severity];
  return key ? t(key) : String(severity);
}

interface SeverityTone {
  block: string;
  text: string;
  dot: string;
}

const SEVERITY_TONE: Record<LoiSeverity, SeverityTone> = {
  [Severity.NotApplicable]: {
    block: 'border-card-border bg-content-bg/50', text: 'text-text-muted', dot: 'bg-text-muted/40',
  },
  [Severity.Applicable]: {
    block: 'border-card-border bg-white/60', text: 'text-text-secondary', dot: 'bg-text-muted',
  },
  [Severity.Passed]: {
    block: 'border-success/20 bg-success-light/50', text: 'text-success', dot: 'bg-success',
  },
  [Severity.Warning]: {
    block: 'border-warning/25 bg-warning-light/60', text: 'text-warning', dot: 'bg-warning',
  },
  [Severity.Error]: {
    block: 'border-danger/25 bg-danger-light/60', text: 'text-danger', dot: 'bg-danger',
  },
};

export function severityTone(severity: LoiSeverity): SeverityTone {
  return SEVERITY_TONE[severity] ?? SEVERITY_TONE[Severity.NotApplicable];
}

// Mã quy tắc do BE sinh; tên hiển thị nằm ở FE để còn dịch được.
const RULE_LABEL_KEY: Record<string, TranslationKey> = {
  STP001: 'loi.rule.STP001',
  SCH001: 'loi.rule.SCH001',
  CLS001: 'loi.rule.CLS001',
  CLS002: 'loi.rule.CLS002',
  CLS003: 'loi.rule.CLS003',
  LOI001: 'loi.rule.LOI001',
  LOI002: 'loi.rule.LOI002',
  LOI003: 'loi.rule.LOI003',
  LOI004: 'loi.rule.LOI004',
  LOI005: 'loi.rule.LOI005',
  PRC001: 'loi.rule.PRC001',
  PRC002: 'loi.rule.PRC002',
};

export function ruleLabel(code: string): string {
  const key = RULE_LABEL_KEY[code];
  return key ? t(key) : code;
}

// Quy tắc phải tự giải thích được kể cả khi không có cấu kiện nào để liệt kê
// (vd SCH001 lỗi vì file không khai schema).
const RULE_DESC_KEY: Record<string, TranslationKey> = {
  STP001: 'loi.ruleDesc.STP001',
  SCH001: 'loi.ruleDesc.SCH001',
  CLS001: 'loi.ruleDesc.CLS001',
  CLS002: 'loi.ruleDesc.CLS002',
  CLS003: 'loi.ruleDesc.CLS003',
  LOI001: 'loi.ruleDesc.LOI',
  LOI002: 'loi.ruleDesc.LOI',
  LOI003: 'loi.ruleDesc.LOI',
  LOI004: 'loi.ruleDesc.LOI',
  LOI005: 'loi.ruleDesc.LOI',
  PRC001: 'loi.ruleDesc.PRC001',
  PRC002: 'loi.ruleDesc.PRC002',
};

export function ruleDescription(code: string): string | null {
  const key = RULE_DESC_KEY[code];
  return key ? t(key) : null;
}

/** Đã đạt / không áp dụng thì giấu mặc định, để chỉ còn thấy vấn đề. */
export function isNoiseRule(severity: LoiSeverity): boolean {
  return severity === Severity.Passed || severity === Severity.NotApplicable;
}
