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

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === groupId),
    [groups, groupId],
  );

  /* Tài khoản đã thuộc nhóm được chọn → không cho mời lại */
  const existingIds = useMemo(
    () => new Set((selectedGroup?.members ?? []).map((m) => m.accountId)),
    [selectedGroup],
  );

  const invitableAccounts = useMemo(
    () => accounts.filter((a) => !existingIds.has(a.id)),
    [accounts, existingIds],
  );

  const filteredAccounts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return invitableAccounts;
    return invitableAccounts.filter(
      (a) => a.userName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q),
    );
  }, [invitableAccounts, query]);

  const selectGroup = (id: string) => {
    setGroupId(id);
    setSelectedIds([]);
    setLeaderId('');
    setQuery('');
  };

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
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-text-muted">{t('projects.manage.invite.desc')}</p>

      {/* ── Chọn nhóm (pills) ───────────────────────── */}
      <div className="space-y-2">
        <span className="block text-sm font-medium text-text-secondary">{t('projects.invite.group')}</span>
        {loadingGroups ? (
          <p className="text-sm text-text-muted">{t('common.loading')}</p>
        ) : groups.length === 0 ? (
          <p className="rounded-xl border border-dashed border-card-border bg-input-bg px-4 py-3 text-sm text-text-muted">
            {t('projects.invite.noGroups')}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => {
              const active = g.id === groupId;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => selectGroup(g.id)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${active ? 'border-primary bg-primary text-white' : 'border-card-border bg-card text-text-secondary hover:border-primary hover:text-primary'}`}
                >
                  {g.name}
                  <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold ${active ? 'bg-white/25 text-white' : 'bg-content-bg text-text-muted'}`}>
                    {g.members.length}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Chưa chọn nhóm ──────────────────────────── */}
      {!groupId && !loadingGroups && groups.length > 0 && (
        <p className="rounded-xl border border-dashed border-card-border bg-input-bg px-4 py-8 text-center text-sm text-text-muted">
          {t('projects.invite.selectGroupFirst')}
        </p>
      )}

      {/* ── Đã chọn nhóm → danh sách có thể mời ──────── */}
      {groupId && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
            <span>
              <strong className="text-text-secondary">{existingIds.size}</strong> {t('projects.invite.inGroupSuffix')}
            </span>
            <span className="h-1 w-1 rounded-full bg-card-border" />
            <span>
              <strong className="text-text-secondary">{invitableAccounts.length}</strong> {t('projects.invite.invitableSuffix')}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-[var(--radius-input)] border border-input-border bg-input-bg px-3 py-2.5">
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

          <div className="max-h-72 space-y-1 overflow-y-auto rounded-[var(--radius-input)] border border-card-border p-1.5">
            {invitableAccounts.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-text-muted">{t('projects.invite.allInGroup')}</p>
            ) : filteredAccounts.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-text-muted">{t('projects.invite.noUsers')}</p>
            ) : (
              filteredAccounts.map((a) => {
                const selected = selectedIds.includes(a.id);
                const isLeader = selected && leaderId === a.id;
                return (
                  <div
                    key={a.id}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${selected ? 'bg-primary-ghost ring-1 ring-primary/30' : 'hover:bg-content-bg'}`}
                  >
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelect(a.id)}
                        className="h-4 w-4 shrink-0 accent-primary"
                      />
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                        {a.userName.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-text">{a.userName}</span>
                        <span className="block truncate text-xs text-text-muted">{a.email}</span>
                      </span>
                    </label>

                    {selected && (
                      <select
                        value={isLeader ? 'leader' : 'member'}
                        onChange={(e) => {
                          if (e.target.value === 'leader') {
                            setLeaderId(a.id);
                          } else if (isLeader) {
                            // If they change the leader back to member, we remove leaderId
                            setLeaderId('');
                          }
                        }}
                        className={`shrink-0 rounded-lg border px-2 py-1.5 text-xs font-semibold outline-none transition-colors ${isLeader ? 'border-primary bg-primary-light text-primary' : 'border-input-border bg-input-bg text-text-secondary'
                          }`}
                      >
                        <option value="member">{t('projectDetail.teams.role.member') || 'Thành viên'}</option>
                        <option value="leader">{t('projectDetail.teams.role.leader') || 'Trưởng nhóm'}</option>
                      </select>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-primary-ghost px-4 py-2.5">
              <span className="text-xs text-text-secondary">
                {t('projects.invite.selectedPrefix')} <strong className="text-primary">{selectedIds.length}</strong> {t('projects.invite.peopleSuffix')} · {t('projects.invite.leaderHint')}
              </span>
              <button
                type="button"
                onClick={resetSelection}
                className="shrink-0 text-xs font-semibold text-text-muted transition-colors hover:text-danger"
              >
                {t('projects.invite.clear')}
              </button>
            </div>
          )}

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
        </div>
      )}
    </form>
  );
}
