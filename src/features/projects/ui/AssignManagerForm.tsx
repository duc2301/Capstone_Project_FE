import { useState } from 'react';

import type { Account } from '@/entities/account';
import type { AssignManagerPayload } from '@/entities/project';
import { t } from '@/shared/lib/i18n';
import { ManagerAccountPicker } from './ManagerAccountPicker';

interface Props {
  accounts: Account[];
  currentManagerId?: string | null;
  onSubmit: (payload: AssignManagerPayload) => Promise<void>;
}

export function AssignManagerForm({ accounts, currentManagerId, onSubmit }: Props) {
  const [accountId, setAccountId] = useState(currentManagerId ?? '');
  const [submitting, setSubmitting] = useState(false);

  const unchanged = Boolean(accountId) && accountId === currentManagerId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || unchanged) return;
    setSubmitting(true);
    try {
      await onSubmit({ accountId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-text-muted">{t('projects.manage.manager.desc')}</p>

      <ManagerAccountPicker
        accounts={accounts}
        value={accountId}
        onChange={setAccountId}
        currentManagerId={currentManagerId}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-text-muted">
          {unchanged ? t('projects.assignManager.unchanged') : ' '}
        </p>
        <button
          type="submit"
          disabled={submitting || !accountId || unchanged}
          className="rounded-[var(--radius-button)] bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-hover disabled:opacity-50"
        >
          {submitting ? t('common.loading') : t('projects.assignManager.submit')}
        </button>
      </div>
    </form>
  );
}
