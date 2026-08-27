import { useProjectLoiRuleSet } from '@/features/loi-rules';
import { useNamingConventions } from '@/features/naming-conventions';
import { t } from '@/shared/lib/i18n';

import { SettingsEntryRow } from './SettingsEntryRow';

interface ProjectSettingsHubProps {
  projectId: string;
  canConfigure: boolean;
}

function NamingIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1.2" />
    </svg>
  );
}

function LoiIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function Stat({ value, label }: Readonly<{ value: number; label: string }>) {
  return (
    <span>
      <strong className="font-semibold text-text">{value}</strong> {label}
    </span>
  );
}

function Dot() {
  return <span className="h-1 w-1 shrink-0 rounded-full bg-card-border" />;
}

export function ProjectSettingsHub({ projectId, canConfigure }: Readonly<ProjectSettingsHubProps>) {
  const { conventions, loading: namingLoading } = useNamingConventions(projectId);
  const { ruleSet, loading: loiLoading } = useProjectLoiRuleSet(projectId, canConfigure);

  const activeConventions = conventions.filter((c) => c.isActive).length;
  const assignedFolders = conventions.reduce((total, c) => total + c.assignedFolders.length, 0);

  const renderNamingDetail = () => {
    if (namingLoading) return <span>{t('common.loading')}</span>;
    if (conventions.length === 0) return <span>{t('settingsHub.naming.empty')}</span>;
    return (
      <>
        <Stat value={conventions.length} label={t('settingsHub.naming.setCount')} />
        <Dot />
        <Stat value={activeConventions} label={t('settingsHub.naming.activeCount')} />
        <Dot />
        <Stat value={assignedFolders} label={t('settingsHub.naming.folderCount')} />
      </>
    );
  };

  const renderLoiDetail = () => {
    if (loiLoading) return <span>{t('common.loading')}</span>;
    if (!ruleSet) return <span>{t('loiRule.project.hint')}</span>;
    return (
      <>
        <span className="font-semibold text-text">{ruleSet.name}</span>
        <Dot />
        <Stat value={ruleSet.componentCount} label={t('loiRule.ruleSet.statComponents')} />
        <Dot />
        <Stat value={ruleSet.requirementCount} label={t('loiRule.ruleSet.statRequirements')} />
        <Dot />
        <Stat value={ruleSet.parameterCount} label={t('loiRule.ruleSet.statParameters')} />
      </>
    );
  };

  return (
    <div className="space-y-5">
      <h2 className="heading-tab">{t('projectDetail.tab.settings')}</h2>

      <div className="divide-y divide-card-border/60 overflow-hidden rounded-[var(--radius-card-lg)] border border-card-border bg-card shadow-card">
        <SettingsEntryRow
          icon={<NamingIcon />}
          title={t('naming.title')}
          to={`/projects/${projectId}/naming-conventions`}
          detail={renderNamingDetail()}
          status={
            conventions.length > 0
              ? { label: t('settingsHub.status.configured'), tone: 'ready' }
              : { label: t('settingsHub.status.notConfigured'), tone: 'missing' }
          }
        />

        {canConfigure && (
          <SettingsEntryRow
            icon={<LoiIcon />}
            title={t('loiRule.project.title')}
            to={`/projects/${projectId}/loi-rules`}
            detail={renderLoiDetail()}
            status={
              ruleSet
                ? { label: t('settingsHub.status.configured'), tone: 'ready' }
                : { label: t('settingsHub.status.notConfigured'), tone: 'missing' }
            }
          />
        )}
      </div>
    </div>
  );
}
