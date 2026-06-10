import { useState } from 'react';

import type { Account } from '@/entities/account';
import type { Group } from '@/entities/group';
import type { AssignManagerPayload } from '@/entities/project';
import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';
import type { InviteManyInput, InviteManyResult } from '../model/useProjectInvite';
import { AssignManagerForm } from './AssignManagerForm';
import { InviteMemberForm } from './InviteMemberForm';

interface Props {
  projectId: string;
  accounts: Account[];
  groups: Group[];
  loadingGroups: boolean;
  currentManagerId?: string | null;
  onAssign: (payload: AssignManagerPayload) => Promise<void>;
  onInvite: (input: InviteManyInput) => Promise<InviteManyResult>;
}

type ManageTab = 'manager' | 'invite';

const TABS: { id: ManageTab; key: TranslationKey }[] = [
  { id: 'manager', key: 'projects.manage.tab.manager' },
  { id: 'invite', key: 'projects.manage.tab.invite' },
];

export function ManageProjectPanel({
  projectId,
  accounts,
  groups,
  loadingGroups,
  currentManagerId,
  onAssign,
  onInvite,
}: Props) {
  const [tab, setTab] = useState<ManageTab>('manager');

  return (
    <div className="space-y-5">
      {/* Segmented control */}
      <div className="flex gap-1 rounded-[var(--radius-input)] bg-content-bg p-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex-1 rounded-[10px] px-4 py-2 text-sm font-semibold transition-colors ${tab === item.id ? 'bg-card text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'}`}
          >
            {t(item.key)}
          </button>
        ))}
      </div>

      {tab === 'manager' ? (
        <AssignManagerForm
          accounts={accounts}
          currentManagerId={currentManagerId}
          onSubmit={onAssign}
        />
      ) : (
        <InviteMemberForm
          projectId={projectId}
          accounts={accounts}
          groups={groups}
          loadingGroups={loadingGroups}
          onSubmit={onInvite}
        />
      )}
    </div>
  );
}
