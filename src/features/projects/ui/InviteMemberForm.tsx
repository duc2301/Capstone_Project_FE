import { useMemo, useState } from 'react';

import type { Account } from '@/entities/account';
import type { Group } from '@/entities/group';
import { t } from '@/shared/lib/i18n';
import type { InviteManyInput, InviteManyResult } from '../model/useProjectInvite';

interface Props {
  projectId: string;
  accounts: Account[];
  groups: Group[];
  loadingGroups: boolean;
  onSubmit: (input: InviteManyInput) => Promise<InviteManyResult>;
}

const fieldClass =
  'w-full rounded-[var(--radius-input)] border border-input-border bg-input-bg px-4 py-3 text-sm text-text outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20';

export function InviteMemberForm({ projectId, accounts, groups, loadingGroups, onSubmit }: Props) {
  const [groupId, setGroupId] = useState('');
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [leaderId, setLeaderId] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredAccounts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) => a.userName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q),
    );
  }, [accounts, query]);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      const next = selectedIds.filter((x) => x !== id);
      setSelectedIds(next);
      if (leaderId === id) setLeaderId(next[0] ?? '');
    } else {
      setSelectedIds([...selectedIds, id]);
      if (!leaderId) setLeaderId(id);
    }
  };

  const resetSelection = () => {
    setSelectedIds([]);
    setLeaderId('');
    setNote('');
    setQuery('');
  };

  const canSubmit =
    Boolean(groupId) && selectedIds.length > 0 && selectedIds.includes(leaderId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const result = await onSubmit({ projectId, groupId, accountIds: selectedIds, leaderId, note: note.trim() || undefined });
      if (result.sent > 0) resetSelection();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ── Chọn nhóm thuộc dự án ───────────────────── */}
      <div className="space-y-1.5">
        <label htmlFor="invite-group" className="block text-sm font-medium text-text-secondary">
          {t('projects.invite.group')}
        </label>
        <select
          id="invite-group"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          required
          disabled={loadingGroups || groups.length === 0}
          className={fieldClass}
        >
          <option value="" disabled>
            {t('projects.invite.placeholder.group')}
          </option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        {!loadingGroups && groups.length === 0 && (
          <p className="text-xs text-text-muted">{t('projects.invite.noGroups')}</p>
        )}
      </div>

      {/* ── Chọn nhiều thành viên + tìm kiếm ────────── */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-text-secondary">
          {t('projects.invite.members')}
        </label>
        <div className="flex items-center gap-2 rounded-[var(--radius-input)] border border-input-border bg-input-bg px-3 py-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-text-muted">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('projects.invite.searchUser')}
            className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-placeholder"
          />
        </div>

        <div className="max-h-64 space-y-1 overflow-y-auto rounded-[var(--radius-input)] border border-card-border p-1">
          {filteredAccounts.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-text-muted">
              {t('projects.invite.noUsers')}
            </p>
          ) : (
            filteredAccounts.map((a) => {
              const selected = selectedIds.includes(a.id);
              const isLeader = selected && leaderId === a.id;
              return (
                <div
                  key={a.id}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${selected ? 'bg-primary-ghost' : 'hover:bg-content-bg'}`}
                >
                  <label className="flex flex-1 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleSelect(a.id)}
                      className="h-4 w-4 shrink-0 accent-primary"
                    />
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                      {a.userName.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-text">{a.userName}</span>
                      <span className="block truncate text-xs text-text-muted">{a.email}</span>
                    </span>
                  </label>

                  {selected && (
                    <button
                      type="button"
                      onClick={() => setLeaderId(a.id)}
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${isLeader ? 'bg-primary text-white' : 'border border-card-border text-text-secondary hover:border-primary hover:text-primary'}`}
                    >
                      {t('projects.invite.leaderBadge')}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {selectedIds.length > 0 && (
          <p className="text-xs text-text-muted">
            {t('projects.invite.selectedPrefix')} {selectedIds.length} {t('projects.invite.peopleSuffix')} · {t('projects.invite.leaderHint')}
          </p>
        )}
      </div>

      {/* ── Ghi chú ─────────────────────────────────── */}
      <div className="space-y-1.5">
        <label htmlFor="invite-note" className="block text-sm font-medium text-text-secondary">
          {t('projects.invite.note')}
        </label>
        <input
          id="invite-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('projects.invite.note')}
          className={fieldClass}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting || !canSubmit}
          className="rounded-[var(--radius-button)] bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-hover disabled:opacity-50"
        >
          {submitting ? t('common.loading') : t('projects.invite.submit')}
        </button>
      </div>
    </form>
  );
}
