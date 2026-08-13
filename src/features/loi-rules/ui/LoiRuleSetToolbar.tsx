import type { LoiRuleSet } from '@/entities/loi-check';
import { ToolbarIconButton } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconPencil = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </svg>
);

const IconStar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
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
  ruleSets: LoiRuleSet[];
  selected: LoiRuleSet | null;
  busy: boolean;
  onSelect: (ruleSetId: string) => void;
  onCreate: () => void;
  onEdit: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
  onImport: () => void;
}

export function LoiRuleSetToolbar({
  ruleSets,
  selected,
  busy,
  onSelect,
  onCreate,
  onEdit,
  onSetDefault,
  onDelete,
  onImport,
}: LoiRuleSetToolbarProps) {
  const canDelete =
    selected !== null && !selected.isSystem && !selected.isDefault && selected.projectCount === 0;

  return (
    <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-2">
      <select
        value={selected?.id ?? ''}
        onChange={(e) => onSelect(e.target.value)}
        disabled={ruleSets.length === 0}
        title={selected?.description ?? undefined}
        className="field-select mr-auto w-auto min-w-[240px] max-w-full py-1.5 text-sm"
      >
        {ruleSets.map((ruleSet) => (
          <option key={ruleSet.id} value={ruleSet.id}>
            {ruleSet.name}
            {ruleSet.isDefault ? ` · ${t('loiRule.ruleSet.defaultSuffix')}` : ''}
          </option>
        ))}
      </select>

      <ToolbarIconButton
        showLabel
        size="sm"
        variant="outline"
        icon={<IconUpload />}
        label={t('loiRule.import.action')}
        disabled={busy || selected === null}
        onClick={onImport}
      />
      <ToolbarIconButton
        showLabel
        size="sm"
        variant="ghost"
        icon={<IconPlus />}
        label={t('loiRule.ruleSet.add')}
        disabled={busy}
        onClick={onCreate}
      />
      <ToolbarIconButton
        showLabel
        size="sm"
        variant="ghost"
        icon={<IconPencil />}
        label={t('loiRule.ruleSet.edit')}
        disabled={busy || selected === null}
        onClick={onEdit}
      />
      <ToolbarIconButton
        showLabel
        size="sm"
        variant="ghost"
        icon={<IconStar />}
        label={t('loiRule.ruleSet.setDefault')}
        disabled={busy || selected === null || selected.isDefault}
        onClick={onSetDefault}
      />
      <ToolbarIconButton
        showLabel
        size="sm"
        variant="danger"
        icon={<IconTrash />}
        label={t('loiRule.ruleSet.delete')}
        disabled={busy || !canDelete}
        title={canDelete ? undefined : t('loiRule.ruleSet.deleteBlocked')}
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
    { label: t('loiRule.ruleSet.statProjects'), value: ruleSet.projectCount },
  ];

  return (
    <div className="flex shrink-0 flex-wrap items-baseline gap-x-3 gap-y-1">
      {ruleSet.isSystem && (
        <span className="rounded-[var(--radius-badge)] bg-primary-tint px-2 py-0.5 text-2xs font-bold text-primary-deep">
          {t('loiRule.ruleSet.systemBadge')}
        </span>
      )}
      {items.map((item) => (
        <span key={item.label} className="whitespace-nowrap text-2xs text-text-muted">
          <span className="font-bold text-text-secondary">{item.value.toLocaleString('vi-VN')}</span>{' '}
          {item.label}
        </span>
      ))}
    </div>
  );
}
