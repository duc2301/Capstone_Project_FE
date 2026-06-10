import { useMemo, useState } from 'react';

import type { Account } from '@/entities/account';
import type { AssignManagerPayload } from '@/entities/project';
import { t } from '@/shared/lib/i18n';

interface Props {
  accounts: Account[];
  currentManagerId?: string | null;
  onSubmit: (payload: AssignManagerPayload) => Promise<void>;
}

export function AssignManagerForm({ accounts, currentManagerId, onSubmit }: Props) {
  const [accountId, setAccountId] = useState(currentManagerId ?? '');
  const [query, setQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) => a.userName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q),
    );
  }, [accounts, query]);

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

      {/* Search */}
      <div className="flex items-center gap-2 rounded-[var(--radius-input)] border border-input-border bg-input-bg px-3 py-2.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-text-muted">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('projects.assignManager.search')}
          className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-placeholder"
        />
      </div>

      {/* Radio list */}
      <div className="max-h-72 space-y-1 overflow-y-auto rounded-[var(--radius-input)] border border-card-border p-1.5">
        {filtered.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-text-muted">{t('projects.assignManager.empty')}</p>
        ) : (
          filtered.map((a) => {
            const selected = accountId === a.id;
            const isCurrent = currentManagerId === a.id;
            return (
              <label
                key={a.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${selected ? 'bg-primary-ghost ring-1 ring-primary/30' : 'hover:bg-content-bg'}`}
              >
                <input
                  type="radio"
                  name="assign-manager"
                  checked={selected}
                  onChange={() => setAccountId(a.id)}
                  className="h-4 w-4 shrink-0 accent-primary"
                />
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                  {a.userName.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-text">{a.userName}</span>
                    {isCurrent && (
                      <span className="shrink-0 rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                        {t('projects.assignManager.current')}
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-xs text-text-muted">{a.email}</span>
                </span>
              </label>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-text-muted">
          {unchanged ? t('projects.assignManager.unchanged') : ' '}
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
