import type { LoiDiscipline, LoiRuleComponent } from '@/entities/loi-check';
import { LOI_DISCIPLINE_OPTIONS } from '@/entities/loi-check';
import { SearchField } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

import { disciplineLabel } from './loiRuleMeta';

interface LoiComponentPanelProps {
  components: LoiRuleComponent[];
  totalCount: number;
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  search: string;
  disciplineFilter: LoiDiscipline | null;
  onSearchChange: (value: string) => void;
  onDisciplineChange: (value: LoiDiscipline | null) => void;
  onSelect: (component: LoiRuleComponent) => void;
  onCreate: () => void;
}

export function LoiComponentPanel({
  components,
  totalCount,
  selectedId,
  loading,
  error,
  search,
  disciplineFilter,
  onSearchChange,
  onDisciplineChange,
  onSelect,
  onCreate,
}: LoiComponentPanelProps) {
  const filterButton = (value: LoiDiscipline | null, label: string) => {
    const active = disciplineFilter === value;
    return (
      <button
        key={label}
        type="button"
        onClick={() => onDisciplineChange(value)}
        className={`rounded-[var(--radius-button)] px-2.5 py-1.5 text-xs font-semibold transition-colors ${
          active ? 'bg-primary text-white' : 'text-text-secondary hover:bg-content-bg'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex min-h-0 flex-col gap-2 rounded-[var(--radius-card-lg)] border border-card-border bg-card p-3 shadow-card">
      <SearchField
        value={search}
        onChange={onSearchChange}
        placeholder={t('loiRule.component.search')}
        className="shrink-0"
      />

      <div className="flex shrink-0 items-center gap-1 rounded-[var(--radius-button)] bg-content-bg p-1">
        {filterButton(null, t('loiRule.discipline.all'))}
        {LOI_DISCIPLINE_OPTIONS.map((discipline) =>
          filterButton(discipline, disciplineLabel(discipline)),
        )}
        <span className="ml-auto pr-1.5 text-2xs text-text-muted">
          {components.length}/{totalCount}
        </span>
      </div>

      <div className="admin-scrollbar min-h-0 flex-1 overflow-y-auto">
        {loading && <p className="py-8 text-center text-sm text-text-muted">{t('common.loading')}</p>}

        {!loading && error && (
          <p className="rounded-[var(--radius-card)] border border-danger/20 bg-danger-light p-4 text-center text-sm font-medium text-danger">
            {error}
          </p>
        )}

        {!loading && !error && components.length === 0 && (
          <p className="py-8 text-center text-sm text-text-muted">{t('loiRule.component.noResults')}</p>
        )}

        {!loading && !error && (
          <ul className="space-y-1">
            {components.map((component) => {
              const selected = component.id === selectedId;
              const hasRules = component.requirementCount > 0;
              return (
                <li key={component.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(component)}
                    className={`w-full rounded-[var(--radius-button)] px-3 py-2 text-left transition-colors ${
                      selected ? 'bg-primary-ghost ring-1 ring-primary/30' : 'hover:bg-content-bg'
                    }`}
                  >
                    <span className="block font-mono text-2xs font-bold tracking-wide text-text-muted">
                      {component.code}
                    </span>
                    <span
                      className={`cell-wrap mt-0.5 block text-sm font-semibold ${
                        selected ? 'text-primary' : 'text-text'
                      }`}
                    >
                      {component.name}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      {hasRules ? (
                        <>
                          <span className="rounded-full bg-content-bg px-2 py-0.5 text-2xs font-semibold text-text-secondary">
                            {component.requirementCount} {t('loiRule.component.requirementUnit')}
                          </span>
                          {component.variantCount > 1 && (
                            <span className="rounded-full bg-info-light px-2 py-0.5 text-2xs font-semibold text-info">
                              {component.variantCount} {t('loiRule.component.variantUnit')}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="rounded-full bg-surface-sand-alt px-2 py-0.5 text-2xs font-semibold text-text-muted">
                          {t('loiRule.component.emptyByStandard')}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={onCreate}
        className="flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-dashed border-card-border px-4 py-2 text-xs font-semibold text-text-secondary transition-colors hover:border-primary hover:bg-primary-ghost hover:text-primary"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        {t('loiRule.component.add')}
      </button>
    </div>
  );
}
