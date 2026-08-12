import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { IssueItem } from '@/entities/issue';
import { issueApi, issueErrorMessage } from '@/entities/issue';
import { useSession } from '@/entities/session';
import { zoneTransferApi, zoneTransferErrorMessage } from '@/entities/zone-transfer';
import { UserAvatar } from '@/shared/components';
import { formatDate } from '@/shared/lib/format';
import { t } from '@/shared/lib/i18n';

import { formatIssueDateTime, issuePriorityBadge, issueStatusBadge } from '../model/issueFormat';
import { useAssignableMembers } from '../model/useAssignableMembers';
import { IssueDiscussionPanel } from './IssueDiscussionPanel';

type SideTab = 'info' | 'discussion' | 'markup';

interface IssueSidePanelProps {
  issueId: string;
  fileItemId: string;
  issue: IssueItem | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  onToast: (message: string, type?: 'success' | 'error') => void;
  onIssueChanged?: () => void;
  markupSlot: ReactNode;
}

export function IssueSidePanel({
  issueId, fileItemId, issue, loading, error, reload, onToast, onIssueChanged, markupSlot,
}: IssueSidePanelProps) {
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<SideTab>('info');

  const [participantQuery, setParticipantQuery] = useState('');
  const [showParticipantPicker, setShowParticipantPicker] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState('');

  const loadIssue = useCallback(async () => reload(), [reload]);

  const { members: assignableMembers, loading: membersLoading, error: membersError } = useAssignableMembers(issue?.linkedFileItemId);
  const { currentUser } = useSession();

  useEffect(() => {
    if (membersError) onToast(membersError, 'error');
  }, [membersError, onToast]);

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

  const handleStart = () =>
    runIssueAction(() => issueApi.start(issueId).then(() => undefined), 'issues.error.start', t('issues.toast.started'));

  const handleAnswer = () =>
    runIssueAction(() => issueApi.answer(issueId).then(() => undefined), 'issues.error.answer', t('issues.toast.answered'));

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
  const isHandler = Boolean(
    issue
    && currentUser
    && (issue.assignedToAccountId
      ? issue.assignedToAccountId === currentUser.accountId
      : issue.participants.some((p) => p.accountId === currentUser.accountId)
        || issue.raisedByAccountId === currentUser.accountId),
  );
  const canStart = !isResolved && isHandler && (issue?.status === 'Open' || issue?.status === 'Answered');
  const canAnswer = !isResolved && isHandler && (issue?.status === 'Open' || issue?.status === 'InProgress');

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
      {/* 3 tab đồng nhất với panel trang xem file */}
      <div className="grid shrink-0 grid-cols-3 border-b border-card-border">
        <SideTabButton active={tab === 'info'} label={t('issues.tab.info')} onClick={() => setTab('info')} />
        <SideTabButton active={tab === 'discussion'} label={t('issues.tab.discussion')} onClick={() => setTab('discussion')} />
        <SideTabButton active={tab === 'markup'} label={t('issues.tab.markup')} onClick={() => setTab('markup')} />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
      {tab === 'info' && (
      <div className="admin-scrollbar h-full space-y-5 overflow-y-auto px-5 py-4">
        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InfoField label={t('projectIssues.col.status')}>
              <StatePill meta={issueStatusBadge(issue.status)} />
            </InfoField>
            <InfoField label={t('issues.create.priorityLabel')}>
              <StatePill meta={issuePriorityBadge(issue.priority)} />
            </InfoField>
          </div>

          {issue.linkedReturnRequestStatus && (
            <InfoField label={t('issues.detail.returnRequestStatus')}>
              <StatePill meta={{ label: issue.linkedReturnRequestStatus, className: 'bg-warning-light text-warning' }} />
            </InfoField>
          )}

          <InfoField label={t('issues.detail.titleLabel')}>
            <p className="field-input-readonly cell-wrap">{issue.title}</p>
          </InfoField>

          <InfoField label={t('issues.detail.descriptionLabel')}>
            <p className="field-input-readonly cell-wrap whitespace-pre-line">
              {issue.description?.trim() || t('issues.detail.noDescription')}
            </p>
          </InfoField>

          <div className="grid grid-cols-2 gap-4">
            <InfoField label={t('issues.detail.raisedBy')}>
              <PersonLine name={issue.raisedByName ?? t('issues.unknownUser')} />
            </InfoField>
            <InfoField label={t('issues.detail.createdAt')}>
              <p className="text-sm font-medium text-text">{formatIssueDateTime(issue.createdAt)}</p>
            </InfoField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InfoField label={t('issues.detail.assignee')}>
              {issue.assignedToAccountId ? (
                <PersonLine name={issue.assignedToName ?? t('issues.unknownUser')} />
              ) : (
                <p className="text-sm italic text-text-placeholder">{t('issues.detail.noAssignee')}</p>
              )}
            </InfoField>
            {issue.dueDate && (
              <InfoField label={t('issues.detail.dueDate')}>
                <p className="text-sm font-medium text-text">{formatDate(issue.dueDate)}</p>
              </InfoField>
            )}
          </div>
        </section>

        {(canStart || canAnswer || (!isResolved && isCreator)) && (
          <section className="grid grid-cols-2 gap-2 border-t border-card-border/70 pt-4">
            {!isResolved && isCreator && (
              <button
                type="button"
                disabled={busy}
                onClick={handleResolve}
                className="btn-modal-primary flex min-h-11 items-center justify-center gap-2 px-3 text-center leading-snug"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <circle cx="12" cy="12" r="10" /><polyline points="8 12 11 15 16 9" />
                </svg>
                {t('issues.detail.markResolved')}
              </button>
            )}
            {!isResolved && isCreator && (
              <button
                type="button"
                disabled={busy || !!issue.linkedReturnRequestStatus}
                onClick={() => setShowReturnForm((v) => !v)}
                className="btn-modal-ghost flex min-h-11 items-center justify-center gap-2 px-3 text-center leading-snug"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M9 14 4 9l5-5" /><path d="M20 20v-7a4 4 0 0 0-4-4H4" />
                </svg>
                {t('issues.detail.requestReturnToWip')}
              </button>
            )}
            {canStart && (
              <button
                type="button"
                disabled={busy}
                onClick={handleStart}
                className="btn-modal-ghost flex min-h-11 items-center justify-center px-3 text-center leading-snug"
              >
                {t('issues.action.start')}
              </button>
            )}
            {canAnswer && (
              <button
                type="button"
                disabled={busy}
                onClick={handleAnswer}
                className="btn-modal-ghost flex min-h-11 items-center justify-center px-3 text-center leading-snug"
              >
                {t('issues.action.answer')}
              </button>
            )}
          </section>
        )}
        {!isResolved && !isCreator && (
          <p className="rounded-[var(--radius-button)] border border-card-border bg-content-bg/40 px-3 py-2 text-xs text-text-muted">
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
              className="w-full resize-none rounded-[var(--radius-input)] border border-input-border bg-input-bg px-3 py-2 text-sm text-text outline-none focus:border-input-focus"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowReturnForm(false)} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-text-secondary hover:bg-content-bg">
                {t('returnRequests.modal.cancel')}
              </button>
              <button
                type="button"
                disabled={busy || !returnReason.trim()}
                onClick={handleSubmitReturnRequest}
                className="rounded-[var(--radius-button)] bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('returnRequests.modal.submit')}
              </button>
            </div>
          </section>
        )}

        <section className="space-y-3 border-t border-card-border/70 pt-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
              {t('issues.detail.participants')} ({issue.participants.length})
            </p>
            {!isResolved && isCreator && (
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowParticipantPicker((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-full border border-card-border px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-content-bg disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {showParticipantPicker
                    ? <path d="M18 6 6 18M6 6l12 12" />
                    : <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></>}
                </svg>
                {showParticipantPicker ? t('issues.detail.closePicker') : t('issues.detail.addParticipant')}
              </button>
            )}
          </div>

          {issue.participants.length === 0 ? (
            <p className="text-sm text-text-muted">{t('issues.detail.noParticipants')}</p>
          ) : (
            <ul className="space-y-1.5">
              {issue.participants.map((p) => {
                const name = p.name ?? t('issues.unknownUser');
                return (
                  <li
                    key={p.accountId}
                    className="flex items-center gap-2.5 rounded-[var(--radius-button)] border border-card-border bg-content-bg/40 px-2.5 py-2"
                  >
                    <UserAvatar userName={name} size="sm" rounded="full" />
                    <span className="cell-wrap min-w-0 flex-1 text-sm font-medium text-text">{name}</span>
                    {!isResolved && isCreator && (
                      <button
                        type="button"
                        disabled={busy}
                        title={t('issues.detail.removeParticipant')}
                        onClick={() => handleRemoveParticipant(p.accountId)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-danger-light hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {!isResolved && isCreator && showParticipantPicker && (
            <div className="space-y-2 rounded-[var(--radius-card)] border border-card-border bg-content-bg/40 p-3">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  autoFocus
                  value={participantQuery}
                  onChange={(e) => setParticipantQuery(e.target.value)}
                  placeholder={t('issues.detail.addParticipantPlaceholder')}
                  className="field-input py-2 pl-9"
                />
              </div>

              {membersLoading ? (
                <p className="py-4 text-center text-xs text-text-muted">{t('common.loading')}</p>
              ) : participantCandidates.length === 0 ? (
                <p className="py-4 text-center text-xs text-text-muted">{t('issues.detail.noMemberFound')}</p>
              ) : (
                <ul className="admin-scrollbar max-h-56 space-y-1 overflow-y-auto pr-1">
                  {participantCandidates.map(([accountId, m]) => (
                    <li key={accountId}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleAddParticipant(accountId)}
                        className="group flex w-full items-center gap-2.5 rounded-[var(--radius-button)] border border-card-border bg-card px-2.5 py-2 text-left transition-colors hover:border-primary/50 hover:bg-primary-ghost disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <UserAvatar userName={m.userName} size="sm" rounded="full" />
                        <span className="min-w-0 flex-1">
                          <span className="block cell-wrap text-sm font-medium text-text">{m.userName}</span>
                          {m.email && <span className="block cell-wrap field-hint">{m.email}</span>}
                          <span className="mt-1 flex flex-wrap gap-1">
                            {m.groupNames.map((g) => (
                              <span key={g} className="rounded-full bg-primary-light px-2 py-0.5 text-2xs font-semibold text-primary">{g}</span>
                            ))}
                          </span>
                        </span>
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-content-bg text-text-muted transition-colors group-hover:bg-primary group-hover:text-white">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </div>
      )}

      {tab === 'discussion' && (
        <IssueDiscussionPanel
          discussionId={issue.discussionId}
          fileItemId={fileItemId}
          currentAccountId={currentUser?.accountId ?? null}
          canDiscuss={canDiscuss}
          resolved={isResolved}
        />
      )}

      {tab === 'markup' && (
        <div className="admin-scrollbar h-full overflow-y-auto px-4 py-4">{markupSlot}</div>
      )}
      </div>
    </div>
  );
}

function InfoField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</p>
      {children}
    </div>
  );
}

function StatePill({ meta }: { meta: { label: string; className: string } }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${meta.className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {meta.label}
    </span>
  );
}

function PersonLine({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <UserAvatar userName={name} size="sm" rounded="full" />
      <p className="cell-wrap min-w-0 text-sm font-semibold text-text">{name}</p>
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
