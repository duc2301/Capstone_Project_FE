import { useState } from 'react';

import type { LoiInstance, LoiRuleResult } from '@/entities/loi-check';
import { t } from '@/shared/lib/i18n';

import { isNoiseRule, ruleDescription, ruleLabel, severityLabel, severityTone } from './loiReportMeta';

function InstanceRow({ instance }: { instance: LoiInstance }) {
  return (
    <li className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-b border-card-border/40 py-2 last:border-0">
      <span className="text-sm font-medium text-text">
        {instance.name || t('loi.report.unnamed')}
      </span>
      {instance.entityType && (
        <span className="font-mono text-[11px] uppercase text-text-muted">{instance.entityType}</span>
      )}
      {instance.globalId && (
        <span className="font-mono text-[11px] text-text-muted">{instance.globalId}</span>
      )}
      {instance.details.length > 0 && (
        <span className="w-full text-xs leading-relaxed text-text-secondary">
          {instance.details.join(' · ')}
        </span>
      )}
    </li>
  );
}

export function LoiRuleBlock({ rule }: { rule: LoiRuleResult }) {
  const [open, setOpen] = useState(false);
  const tone = severityTone(rule.severity);
  const expandable = rule.instances.length > 0;
  // Chỉ giải thích khi có chuyện, quy tắc đã đạt mà kèm mô tả thì rối.
  const description = isNoiseRule(rule.severity) ? null : ruleDescription(rule.code);

  return (
    <li className={`rounded-xl border ${tone.block}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!expandable}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left disabled:cursor-default"
      >
        {expandable && (
          <span className={`shrink-0 text-xs transition-transform ${open ? 'rotate-90' : ''}`}>›</span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-text">{ruleLabel(rule.code)}</span>
          <span className="mt-0.5 block font-mono text-[11px] text-text-muted">
            {rule.code}
            {rule.occurrenceCount > 0 && (
              <> · {t('loi.report.occurred')} {rule.occurrenceCount} {t('loi.report.times')}</>
            )}
          </span>
        </span>
        <span className={`shrink-0 text-[11px] font-bold uppercase tracking-wide ${tone.text}`}>
          {severityLabel(rule.severity)}
        </span>
      </button>

      {description && (
        <p className="px-3 pb-2.5 text-xs leading-relaxed text-text-secondary">{description}</p>
      )}

      {open && expandable && (
        <div className="border-t border-card-border/40 px-3 pb-2">
          <ul>
            {rule.instances.map((instance, index) => (
              <InstanceRow key={`${instance.globalId ?? instance.name ?? ''}-${index}`} instance={instance} />
            ))}
          </ul>
          {rule.truncated && (
            <p className="pt-2 text-[11px] italic text-text-muted">
              {t('loi.report.truncated')} {rule.occurrenceCount}.
            </p>
          )}
        </div>
      )}
    </li>
  );
}
