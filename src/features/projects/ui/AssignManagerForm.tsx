import { useState } from 'react';

import type { Account } from '@/entities/account';
import type { AssignManagerPayload } from '@/entities/project';
import { t } from '@/shared/lib/i18n';

interface Props {
  accounts: Account[];
  currentManagerId?: string | null;
  onSubmit: (payload: AssignManagerPayload) => Promise<void>;
}

const selectClass =
  'w-full rounded-[var(--radius-input)] border border-input-border bg-input-bg px-4 py-3 text-sm text-text outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20';

export function AssignManagerForm({ accounts, currentManagerId, onSubmit }: Props) {
  const [accountId, setAccountId] = useState(currentManagerId ?? '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) return;
    setSubmitting(true);
    try {
      await onSubmit({ accountId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="assign-manager" className="block text-sm font-medium text-text-secondary">
          {t('projects.assignManager.account')}
        </label>
        <select
          id="assign-manager"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          required
          className={selectClass}
        >
          <option value="" disabled>
            {t('projects.assignManager.placeholder')}
          </option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.userName} ({a.email})
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting || !accountId}
          className="rounded-[var(--radius-button)] bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-hover disabled:opacity-50"
        >
          {submitting ? t('common.loading') : t('projects.assignManager.submit')}
        </button>
      </div>
    </form>
  );
}
