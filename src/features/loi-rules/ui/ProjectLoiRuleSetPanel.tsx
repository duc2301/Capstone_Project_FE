import { Link } from 'react-router-dom';

import { ListErrorCard } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

import { useProjectLoiRuleSet } from '../model/useProjectLoiRuleSet';

interface ProjectLoiRuleSetPanelProps {
  projectId: string;
  canConfigure: boolean;
}

export function ProjectLoiRuleSetPanel({ projectId, canConfigure }: ProjectLoiRuleSetPanelProps) {
  const { ruleSet, loading, error } = useProjectLoiRuleSet(projectId, canConfigure);

  return (
    <div className="space-y-4">
      <h2 className="heading-tab">{t('loiRule.project.title')}</h2>

      <div className="rounded-[var(--radius-card-lg)] border border-card-border/60 bg-card/70 p-6 shadow-card backdrop-blur-sm">
        {loading && <p className="text-sm text-text-muted">{t('common.loading')}</p>}
        {!loading && error && <ListErrorCard message={error} />}

        {!loading && !error && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              {ruleSet ? (
                <>
                  <p className="heading-entity truncate">{ruleSet.name}</p>
                  <p className="field-hint">
                    {ruleSet.componentCount} {t('loiRule.ruleSet.statComponents')} ·{' '}
                    {ruleSet.requirementCount} {t('loiRule.ruleSet.statRequirements')} ·{' '}
                    {ruleSet.parameterCount} {t('loiRule.ruleSet.statParameters')}
                  </p>
                </>
              ) : (
                <>
                  <p className="heading-entity text-warning">{t('loiRule.project.noRuleSet')}</p>
                  <p className="field-hint">{t('loiRule.project.hint')}</p>
                </>
              )}
            </div>

            {canConfigure ? (
              <Link
                to={`/projects/${projectId}/loi-rules`}
                className="btn-modal-primary shrink-0 text-center"
              >
                {ruleSet ? t('loiRule.project.manage') : t('loiRule.project.setUp')}
              </Link>
            ) : (
              <p className="field-hint shrink-0">{t('loiRule.project.readOnly')}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
