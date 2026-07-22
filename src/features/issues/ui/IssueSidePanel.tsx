import { useEffect, useMemo, useState, type ReactNode } from 'react';

import type { IssueItem } from '@/entities/issue';
import { issueApi, issueErrorMessage } from '@/entities/issue';
import { useSession } from '@/entities/session';
import { zoneTransferApi, zoneTransferErrorMessage } from '@/entities/zone-transfer';
import { t } from '@/shared/lib/i18n';

import { formatIssueDateTime, issuePriorityBadge, issueStatusBadge } from '../model/issueFormat';
import { useAssignableMembers } from '../model/useAssignableMembers';
import { IssueDiscussionPanel } from './IssueDiscussionPanel';

type SideTab = 'discussion' | 'markup';

interface IssueSidePanelProps {
  issueId: string;
  fileItemId: string;
  onToast: (message: string, type?: 'success' | 'error') => void;
  onIssueChanged?: () => void;
  markupSlot: ReactNode;
}

export function IssueSidePanel({ issueId, fileItemId, onToast, onIssueChanged, markupSlot }: IssueSidePanelProps) {
  const [issue, setIssue] = useState<IssueItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<SideTab>('discussion');

  const [participantQuery, setParticipantQuery] = useState('');
  const [showParticipantPicker, setShowParticipantPicker] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState('');

  const { members: assignableMembers, loading: membersLoading, error: membersError } = useAssignableMembers(issue?.linkedFileItemId);
  const { currentUser } = useSession();

  useEffect(() => {
    if (membersError) onToast(membersError, 'error');
  }, [membersError]);

  const loadIssue = async () => {
    setLoading(true);
    setError(null);
    try {
      setIssue(await issueApi.getById(issueId));
    } catch (err) {
      setError(issueErrorMessage(err, t('issues.error')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadIssue();
  }, [issueId]);

  const runIssueAction = async (
    action: () => Promise<void>,
    errorMessageKey: Parameters<typeof t>[0],
    successMessage?: string,
  ) => {
    setBusy(true);
    try {
      await action();
      if (successMessage) onToast(successMessage);
      await loadIssue();
      onIssueChanged?.();
    } catch (err) {
      onToast(issueErrorMessage(err, t(errorMessageKey)), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleResolve = () =>
    runIssueAction(() => issueApi.resolve(issueId).then(() => undefined), 'issues.error.resolve', t('issues.toast.resolved'));

  const handleAddParticipant = (accountId: string) => {
    setShowParticipantPicker(false);
    setParticipantQuery('');
    return runIssueAction(() => issueApi.addParticipant(issueId, accountId), 'issues.error.addParticipant');
  };

  const handleRemoveParticipant = (accountId: string) =>
    runIssueAction(() => issueApi.removeParticipant(issueId, accountId), 'issues.error.removeParticipant');

  const handleSubmitReturnRequest = async () => {
    const reason = returnReason.trim();
    if (!reason || !issue?.linkedFileItemId) return;

    setBusy(true);
    try {
      await zoneTransferApi.createReturnRequest(issue.linkedFileItemId, reason, issue.id);
      onToast(t('issues.toast.returnRequestCreated'));
      setShowReturnForm(false);
      setReturnReason('');
      await loadIssue();
      onIssueChanged?.();
    } catch (err) {
      onToast(zoneTransferErrorMessage(err, t('issues.error.returnRequest')), 'error');
    } finally {
      setBusy(false);
    }
  };

  const isResolved = issue?.status === 'Closed';
  const canDiscuss = Boolean(
    issue
    && currentUser
    && (issue.raisedByAccountId === currentUser.accountId
      || issue.assignedToAccountId === currentUser.accountId
      || issue.participants.some((p) => p.accountId === currentUser.accountId)),
  );
  const isCreator = Boolean(issue && currentUser && issue.raisedByAccountId === currentUser.accountId);

  const participantCandidates = useMemo(() => {
    const existingIds = new Set((issue?.participants ?? []).map((p) => p.accountId));
    const query = participantQuery.trim().toLowerCase();
    const filtered = assignableMembers.filter((m) =>
      !existingIds.has(m.accountId)
      && (!query || m.name.toLowerCase().includes(query) || m.email?.toLowerCase().includes(query)),
    );

    const byAccount = new Map<string, { userName: string; email?: string | null; groupNames: string[] }>();
    for (const m of filtered) {
      const existing = byAccount.get(m.accountId);
      if (existing) existing.groupNames.push(m.groupName);
      else byAccount.set(m.accountId, { userName: m.name, email: m.email, groupNames: [m.groupName] });
    }
    return Array.from(byAccount.entries());
  }, [issue?.participants, assignableMembers, participantQuery]);

  if (loading) {
    return <p className="py-10 text-center text-sm text-text-muted">{t('common.loading')}</p>;
  }
  if (error || !issue) {
    return <p className="py-10 text-center text-sm text-danger">{error ?? t('issues.error')}</p>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Thông tin issue + thao tác (không cuộn cùng chat) */}
      <div className="max-h-[45%] shrink-0 space-y-4 overflow-y-auto border-b border-card-border px-5 py-4">
        <section className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${issueStatusBadge(issue.status).className}`}>
              {issueStatusBadge(issue.status).label}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${issuePriorityBadge(issue.priority).className}`}>
              {issuePriorityBadge(issue.priority).label}
            </span>
            {issue.linkedReturnRequestStatus && (
              <span className="rounded-full bg-warning-light px-2.5 py-0.5 text-xs font-semibold text-warning">
                {t('issues.detail.returnRequestStatus')}: {issue.linkedReturnRequestStatus}
              </span>
            )}
          </div>
          <h2 className="font-heading text-lg font-bold text-text">{issue.title}</h2>
          {issue.description && <p className="text-sm text-text-secondary">{issue.description}</p>}
          <p className="text-xs text-text-muted">
            {t('issues.detail.raisedBy')}: {issue.raisedByName ?? issue.raisedByAccountId} · {formatIssueDateTime(issue.createdAt)}
          </p>
          {issue.assignedToAccountId && (
            <p className="text-xs text-text-muted">
              {t('issues.detail.assignee')}: <span className="font-semibold text-text">{issue.assignedToName ?? issue.assignedToAccountId}</span>
            </p>
          )}
        </section>

        {!isResolved && isCreator && (
          <section className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={handleResolve}
              className="rounded-lg bg-success px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('issues.detail.markResolved')}
            </button>
            <button
              type="button"
              disabled={busy || !!issue.linkedReturnRequestStatus}
              onClick={() => setShowReturnForm((v) => !v)}
              className="rounded-lg border border-card-border px-3 py-1.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('issues.detail.requestReturnToWip')}
            </button>
          </section>
        )}
        {!isResolved && !isCreator && (
          <p className="rounded-xl border border-card-border bg-content-bg/40 px-3 py-2 text-xs text-text-muted">
            {t('issues.detail.onlyCreatorCanResolve')}
          </p>
        )}

        {showReturnForm && (
          <section className="space-y-2 rounded-xl border border-card-border bg-content-bg/40 p-3">
            <textarea
              rows={3}
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder={t('returnRequests.modal.reasonPlaceholder')}
              className="w-full resize-none rounded-(--radius-input) border border-input-border bg-input-bg px-3 py-2 text-sm text-text outline-none focus:border-input-focus"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowReturnForm(false)} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-text-secondary hover:bg-content-bg">
                {t('returnRequests.modal.cancel')}
              </button>
              <button
                type="button"
                disabled={busy || !returnReason.trim()}
                onClick={handleSubmitReturnRequest}
                className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('returnRequests.modal.submit')}
              </button>
            </div>
          </section>
        )}

        <section className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted">{t('issues.detail.participants')}</p>
          <div className="flex flex-wrap gap-2">
            {issue.participants.length === 0 && (
              <span className="text-sm text-text-muted">{t('issues.detail.noParticipants')}</span>
            )}
            {issue.participants.map((p) => (
              <span key={p.accountId} className="flex items-center gap-1.5 rounded-full border border-card-border bg-content-bg/60 px-3 py-1 text-xs font-medium text-text">
                {p.name ?? p.accountId}
                {isCreator && (
                  <button type="button" onClick={() => handleRemoveParticipant(p.accountId)} className="text-text-muted hover:text-danger">×</button>
                )}
              </span>
            ))}
          </div>
          {!isResolved && isCreator && (
            <div className="relative">
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowParticipantPicker((v) => !v)}
                className="rounded-lg border border-card-border px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-content-bg disabled:cursor-not-allowed disabled:opacity-50"
              >
                + {t('issues.detail.addParticipant')}
              </button>

              {showParticipantPicker && (
                <div className="absolute z-10 mt-2 w-72 rounded-xl border border-card-border bg-card p-2 shadow-dropdown">
                  <input
                    autoFocus
                    value={participantQuery}
                    onChange={(e) => setParticipantQuery(e.target.value)}
                    placeholder={t('issues.detail.addParticipantPlaceholder')}
                    className="mb-2 w-full rounded-(--radius-input) border border-input-border bg-input-bg px-3 py-2 text-sm text-text outline-none focus:border-input-focus"
                  />
                  <div className="max-h-56 overflow-y-auto">
                    {membersLoading ? (
                      <p className="px-2 py-3 text-center text-xs text-text-muted">{t('common.loading')}</p>
                    ) : participantCandidates.length === 0 ? (
                      <p className="px-2 py-3 text-center text-xs text-text-muted">{t('issues.detail.noMemberFound')}</p>
                    ) : (
                      <ul className="space-y-0.5">
                        {participantCandidates.map(([accountId, m]) => (
                          <li key={accountId}>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleAddParticipant(accountId)}
                              className="w-full rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-content-bg disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <span className="block font-medium text-text">{m.userName} — {m.groupNames.join(', ')}</span>
                              {m.email && <span className="block text-xs text-text-muted">{m.email}</span>}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Tabs: Thảo luận | Ghi chú */}
      <div className="grid shrink-0 grid-cols-2 border-b border-card-border">
        <SideTabButton active={tab === 'discussion'} label={t('issues.tab.discussion')} onClick={() => setTab('discussion')} />
        <SideTabButton active={tab === 'markup'} label={t('issues.tab.markup')} onClick={() => setTab('markup')} />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === 'discussion' ? (
          <IssueDiscussionPanel
            discussionId={issue.discussionId}
            fileItemId={fileItemId}
            currentAccountId={currentUser?.accountId ?? null}
            canDiscuss={canDiscuss}
            resolved={isResolved}
          />
        ) : (
          <div className="h-full overflow-y-auto px-4 py-4">{markupSlot}</div>
        )}
      </div>
    </div>
  );
}

function SideTabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex h-12 items-center justify-center text-xs font-bold uppercase tracking-wider transition-colors ${active ? 'text-primary' : 'text-text-muted hover:bg-content-bg hover:text-text'
        }`}
    >
      {label}
      {active && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />}
    </button>
  );
}
