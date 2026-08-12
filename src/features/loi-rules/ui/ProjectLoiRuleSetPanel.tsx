import { getApiErrorMessage } from '@/shared/api';
import { ListErrorCard, Toast, useToast } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

import { useProjectLoiRuleSet } from '../model/useProjectLoiRuleSet';

const INHERIT_VALUE = '';

interface ProjectLoiRuleSetPanelProps {
  projectId: string;
  canConfigure: boolean;
}

export function ProjectLoiRuleSetPanel({ projectId, canConfigure }: ProjectLoiRuleSetPanelProps) {
  const { ruleSets, current, effective, loading, error, saving, setRuleSet } =
    useProjectLoiRuleSet(projectId);
  const { toast, showToast } = useToast();

  const handleChange = async (value: string) => {
    try {
      await setRuleSet(value === INHERIT_VALUE ? null : value);
      showToast(t('loiRule.project.saved'));
    } catch (err) {
      showToast(getApiErrorMessage(err, t('loiRule.project.saveError')), 'error');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="heading-tab">{t('loiRule.project.title')}</h2>

      <div className="rounded-[var(--radius-card-lg)] border border-card-border/60 bg-card/70 p-6 shadow-card backdrop-blur-sm">
        {loading && <p className="text-sm text-text-muted">{t('common.loading')}</p>}
        {!loading && error && <ListErrorCard message={error} />}

        {!loading && !error && (
          <div className="space-y-3">
            <div>
              <label className="field-label mb-1.5">{t('loiRule.project.selectorLabel')}</label>
              <select
                value={current?.id ?? INHERIT_VALUE}
                disabled={!canConfigure || saving}
                onChange={(e) => void handleChange(e.target.value)}
                className="field-select w-full max-w-lg disabled:opacity-60"
              >
                <option value={INHERIT_VALUE}>{t('loiRule.project.inherit')}</option>
                {ruleSets.map((ruleSet) => (
                  <option key={ruleSet.id} value={ruleSet.id}>
                    {ruleSet.name}
                    {ruleSet.isDefault ? ` · ${t('loiRule.ruleSet.defaultSuffix')}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {effective ? (
              <p className="field-hint">
                {t('loiRule.project.effective')}:{' '}
                <span className="font-semibold text-text-secondary">{effective.name}</span>
                {' — '}
                {effective.componentCount} {t('loiRule.ruleSet.statComponents')} ·{' '}
                {effective.requirementCount} {t('loiRule.ruleSet.statRequirements')}
              </p>
            ) : (
              <p className="field-hint text-warning">{t('loiRule.project.noRuleSet')}</p>
            )}

            <p className="field-hint">{t('loiRule.project.hint')}</p>
            {!canConfigure && <p className="field-hint">{t('loiRule.project.readOnly')}</p>}
          </div>
        )}
      </div>

      <Toast toast={toast} className="z-[80]" />
    </div>
  );
}
