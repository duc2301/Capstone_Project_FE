import type { LoiRuleSet } from '@/entities/loi-check';
import { ToolbarIconButton } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

const IconPencil = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </svg>
);

const IconUpload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

interface LoiRuleSetToolbarProps {
  ruleSet: LoiRuleSet | null;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onImport: () => void;
}

export function LoiRuleSetToolbar({ ruleSet, busy, onEdit, onDelete, onImport }: LoiRuleSetToolbarProps) {
  return (
    <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-2">
      <p className="mr-auto min-w-0 truncate text-sm font-semibold text-text-secondary">
        {ruleSet ? ruleSet.name : t('loiRule.project.noRuleSet')}
      </p>

      <ToolbarIconButton
        showLabel
        size="sm"
        variant="outline"
        icon={<IconUpload />}
        label={ruleSet ? t('loiRule.import.action') : t('loiRule.import.actionCreate')}
        disabled={busy}
        onClick={onImport}
      />
      <ToolbarIconButton
        showLabel
        size="sm"
        variant="ghost"
        icon={<IconPencil />}
        label={t('loiRule.ruleSet.edit')}
        disabled={busy || ruleSet === null}
        onClick={onEdit}
      />
      <ToolbarIconButton
        showLabel
        size="sm"
        variant="danger"
        icon={<IconTrash />}
        label={t('loiRule.ruleSet.delete')}
        disabled={busy || ruleSet === null}
        onClick={onDelete}
      />
    </div>
  );
}

interface LoiRuleSetStatsProps {
  ruleSet: LoiRuleSet;
}

export function LoiRuleSetStats({ ruleSet }: LoiRuleSetStatsProps) {
  const items: { label: string; value: number }[] = [
    { label: t('loiRule.ruleSet.statComponents'), value: ruleSet.componentCount },
    { label: t('loiRule.ruleSet.statRequirements'), value: ruleSet.requirementCount },
    { label: t('loiRule.ruleSet.statParameters'), value: ruleSet.parameterCount },
  ];

  return (
    <div className="flex shrink-0 flex-wrap items-baseline gap-x-3 gap-y-1">
      {items.map((item) => (
        <span key={item.label} className="whitespace-nowrap text-2xs text-text-muted">
          <span className="font-bold text-text-secondary">{item.value.toLocaleString('vi-VN')}</span>{' '}
          {item.label}
        </span>
      ))}
    </div>
  );
}
