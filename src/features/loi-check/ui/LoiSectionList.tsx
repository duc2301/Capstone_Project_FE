import { useMemo, useState } from 'react';

import type { LoiSection } from '@/entities/loi-check';
import { LoiSeverity } from '@/entities/loi-check';
import { t } from '@/shared/lib/i18n';

import { LoiRuleBlock } from './LoiRuleBlock';
import { isNoiseRule, LOI_SECTION_ORDER, sectionLabel, severityLabel, severityTone } from './loiReportMeta';

export function LoiSectionList({ sections }: { sections: LoiSection[] }) {
  const [showPassed, setShowPassed] = useState(false);

  const ordered = useMemo(() => {
    const byId = new Map(sections.map((s) => [s.section, s]));
    return LOI_SECTION_ORDER.map((id) => byId.get(id)).filter((s): s is LoiSection => s !== undefined);
  }, [sections]);

  if (ordered.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h3 className="heading-card">{t('loi.report.sections')}</h3>
        <label className="flex shrink-0 items-center gap-2 text-xs text-text-muted">
          <input
            type="checkbox"
            checked={showPassed}
            onChange={(e) => setShowPassed(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-card-border"
          />
          {t('loi.report.showPassed')}
        </label>
      </div>

      <div className="mt-4 space-y-5">
        {ordered.map((section) => {
          const visible = showPassed ? section.rules : section.rules.filter((r) => !isNoiseRule(r.severity));
          const tone = severityTone(section.severity);

          return (
            <section key={section.section}>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} />
                <h4 className="heading-label flex-1">{sectionLabel(section.section)}</h4>
                <span className={`text-xs font-bold uppercase tracking-wide ${tone.text}`}>
                  {severityLabel(section.severity)}
                </span>
              </div>

              {visible.length === 0 ? (
                <p className="mt-1.5 pl-4 text-xs text-text-muted">
                  {/* "Không có vấn đề" và "chưa kiểm được gì" là hai chuyện khác nhau. */}
                  {section.severity === LoiSeverity.NotApplicable
                    ? t('loi.report.sectionNotApplicable')
                    : t('loi.report.allClear')}
                </p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {visible.map((rule) => (
                    <LoiRuleBlock key={rule.code} rule={rule} />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
