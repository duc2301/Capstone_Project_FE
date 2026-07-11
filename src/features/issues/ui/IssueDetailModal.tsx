import { useEffect, useMemo, useState } from 'react';

import type { FileListItem } from '@/entities/file-item';
import type { IssueItem } from '@/entities/issue';
import { issueApi, issueErrorMessage } from '@/entities/issue';
import type { PostMessageAttachmentPayload } from '@/entities/discussion';
import { useSession } from '@/entities/session';
import { zoneTransferApi, zoneTransferErrorMessage } from '@/entities/zone-transfer';
import { t } from '@/shared/lib/i18n';

import { useIssueDiscussion } from '../model/useIssueDiscussion';
import { useProjectMembers } from '../model/useProjectMembers';
import { formatIssueDateTime, isImageUrl, issuePriorityBadge, issueStatusBadge } from '../model/issueFormat';
import { AttachExistingFilePicker } from './AttachExistingFilePicker';

interface IssueDetailModalProps {
  issueId: string;
  projectId: string;
  onClose: () => void;
  onChanged: () => void;
  onToast: (message: string, type?: 'success' | 'error') => void;
}

interface PendingAttachment extends PostMessageAttachmentPayload {
  label: string;
}

export function IssueDetailModal({ issueId, projectId, onClose, onChanged, onToast }: IssueDetailModalProps) {
  const [issue, setIssue] = useState<IssueItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [messageText, setMessageText] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [showAttachPicker, setShowAttachPicker] = useState(false);

  const [participantQuery, setParticipantQuery] = useState('');
  const [showParticipantPicker, setShowParticipantPicker] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState('');

  const { messages, loading: messagesLoading, posting, postMessage } = useIssueDiscussion(issue?.discussionId);
  const { members: projectMembers, loading: membersLoading } = useProjectMembers(projectId);
  const { currentUser } = useSession();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueId]);

  // Chay 1 thao tac issue voi vong doi busy/error/reload chung — tranh lap lai try/catch/finally
  // giong het nhau o resolve/add-participant/remove-participant.
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
    } catch (err) {
      onToast(issueErrorMessage(err, t(errorMessageKey)), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleResolve = () =>
    runIssueAction(
      () => issueApi.resolve(issueId).then(() => { onChanged(); }),
      'issues.error.resolve',
      t('issues.toast.resolved'),
    );

  const handleAddParticipant = (accountId: string) => {
    setShowParticipantPicker(false);
    setParticipantQuery('');
    return runIssueAction(() => issueApi.addParticipant(issueId, accountId), 'issues.error.addParticipant');
  };

  const handleRemoveParticipant = (accountId: string) =>
    runIssueAction(() => issueApi.removeParticipant(issueId, accountId), 'issues.error.removeParticipant');

  const handlePostMessage = async () => {
    const content = messageText.trim();
    if (!content) return;

    const ok = await postMessage({
      content,
      attachments: pendingAttachments.map((a) => ({ type: a.type, fileVersionId: a.fileVersionId, url: a.url, folderId: a.folderId })),
    });
    if (ok) {
      setMessageText('');
      setPendingAttachments([]);
    }
  };

  const handleAttachFile = (file: FileListItem) => {
    setShowAttachPicker(false);
    if (!file.currentVersionId) {
      onToast(t('issues.attach.noVersion'), 'error');
      return;
    }
    setPendingAttachments((prev) => [
      ...prev,
      { type: 'File', fileVersionId: file.currentVersionId!, label: file.name },
    ]);
  };

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
      onChanged();
    } catch (err) {
      onToast(zoneTransferErrorMessage(err, t('issues.error.returnRequest')), 'error');
    } finally {
      setBusy(false);
    }
  };

  const isResolved = issue?.status === 'Closed';

  // Chi nguoi tao, nguoi thuc hien, hoac nguoi duoc them tham gia issue moi duoc thao luan —
  // khop voi permission check o BE (DiscussionService.RequireIssueMemberAsync).
  const canDiscuss = Boolean(
    issue
    && currentUser
    && (issue.raisedByAccountId === currentUser.accountId
      || issue.assignedToAccountId === currentUser.accountId
      || issue.participants.some((p) => p.accountId === currentUser.accountId)),
  );

  // Chi nguoi tao issue moi duoc giai quyet/dong hoac quan ly participant — khop voi
  // IssueService.RequireCreator o BE ("ai tao issue nguoi do xu ly", ke ca o vung Publish vi nguoi tao
  // da bat buoc la Leader luc tao issue).
  const isCreator = Boolean(issue && currentUser && issue.raisedByAccountId === currentUser.accountId);

  // Ung vien cho picker "them nguoi tham gia": loai nguoi da tham gia, loc theo query, gop cac dong
  // cung 1 nguoi (co the o nhieu nhom) thanh 1 dong duy nhat kem het ten nhom.
  const participantCandidates = useMemo(() => {
    const existingIds = new Set((issue?.participants ?? []).map((p) => p.accountId));
    const query = participantQuery.trim().toLowerCase();
    const filtered = projectMembers.filter((m) =>
      !existingIds.has(m.accountId)
      && (!query || m.userName.toLowerCase().includes(query) || m.email?.toLowerCase().includes(query)),
    );

    const byAccount = new Map<string, { userName: string; email?: string | null; groupNames: string[] }>();
    for (const m of filtered) {
      const existing = byAccount.get(m.accountId);
      if (existing) existing.groupNames.push(m.groupName);
      else byAccount.set(m.accountId, { userName: m.userName, email: m.email, groupNames: [m.groupName] });
    }
    return Array.from(byAccount.entries());
  }, [issue?.participants, projectMembers, participantQuery]);

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl animate-scale-in flex-col overflow-hidden rounded-(--radius-card-lg) bg-card shadow-modal">
        <div className="flex items-center justify-between border-b border-card-border px-6 py-4">
          <h2 className="font-heading text-lg font-bold text-text">{t('issues.detail.title')}</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-content-bg hover:text-text">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {loading ? (
            <p className="py-8 text-center text-sm text-text-muted">{t('common.loading')}</p>
          ) : error || !issue ? (
            <p className="py-8 text-center text-sm text-danger">{error ?? t('issues.error')}</p>
          ) : (
            <>
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
                <h3 className="font-heading text-xl font-bold text-text">{issue.title}</h3>
                {issue.description && <p className="text-sm text-text-secondary">{issue.description}</p>}
                <p className="text-xs text-text-muted">
                  {t('issues.detail.raisedBy')}: {issue.raisedByName ?? issue.raisedByAccountId} · {formatIssueDateTime(issue.createdAt)}
                </p>
                {issue.assignedToAccountId && (
                  <p className="text-xs text-text-muted">
                    {t('issues.detail.assignee')}: <span className="font-semibold text-text">{issue.assignedToName ?? issue.assignedToAccountId}</span>
                  </p>
                )}

                {issue.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {issue.attachments.map((a) =>
                      a.url && isImageUrl(a.url) ? (
                        <a key={a.id} href={a.url} target="_blank" rel="noreferrer">
                          <img src={a.url} alt="" className="h-20 w-20 rounded-lg border border-card-border object-cover" />
                        </a>
                      ) : (
                        <a
                          key={a.id}
                          href={a.url ?? undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-card-border bg-content-bg/60 px-3 py-1.5 text-xs font-medium text-primary hover:underline"
                        >
                          {t('issues.detail.viewAttachment')}
                        </a>
                      ),
                    )}
                  </div>
                )}
              </section>

              {!isResolved && isCreator && (
                <section className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleResolve}
                    className="rounded-xl bg-success px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t('issues.detail.markResolved')}
                  </button>
                  <button
                    type="button"
                    disabled={busy || !!issue.linkedReturnRequestStatus}
                    onClick={() => setShowReturnForm((v) => !v)}
                    className="rounded-xl border border-card-border px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t('issues.detail.requestReturnToWip')}
                  </button>
                </section>
              )}
              {!isResolved && !isCreator && (
                <p className="rounded-xl border border-card-border bg-content-bg/40 px-3 py-2.5 text-xs text-text-muted">
                  {t('issues.detail.onlyCreatorCanResolve')}
                </p>
              )}

              {showReturnForm && (
                <section className="space-y-2 rounded-xl border border-card-border bg-content-bg/40 p-4">
                  <textarea
                    rows={3}
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder={t('returnRequests.modal.reasonPlaceholder')}
                    className="w-full resize-none rounded-(--radius-input) border border-input-border bg-input-bg px-3.5 py-2.5 text-sm text-text outline-none focus:border-input-focus"
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

              <section className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted">{t('issues.detail.discussion')}</p>

                {messagesLoading ? (
                  <p className="text-sm text-text-muted">{t('common.loading')}</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-text-muted">{t('issues.discussion.empty')}</p>
                ) : (
                  <ul className="space-y-3">
                    {messages.map((m) => (
                      <li key={m.id} className="rounded-xl border border-card-border bg-content-bg/40 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-text">{m.authorName ?? m.authorAccountId}</span>
                          <span className="text-xs text-text-muted">{formatIssueDateTime(m.createdAt)}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-text-secondary">{m.content}</p>
                        {m.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {m.attachments.map((a) => (
                              <span key={a.id} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                                {a.type === 'File' ? t('issues.discussion.fileAttachment') : a.type}
                              </span>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {isResolved ? null : !canDiscuss ? (
                  <p className="rounded-xl border border-card-border bg-content-bg/40 px-3 py-2.5 text-xs text-text-muted">
                    {t('issues.discussion.notMember')}
                  </p>
                ) : (
                  <div className="space-y-2 rounded-xl border border-card-border p-3">
                    <textarea
                      rows={3}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={t('issues.discussion.placeholder')}
                      className="w-full resize-none rounded-(--radius-input) border border-input-border bg-input-bg px-3.5 py-2.5 text-sm text-text outline-none focus:border-input-focus"
                    />
                    {pendingAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {pendingAttachments.map((a, idx) => (
                          <span key={`${a.fileVersionId}-${idx}`} className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                            {a.label}
                            <button
                              type="button"
                              onClick={() => setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))}
                              className="text-primary/70 hover:text-danger"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAttachPicker(true)}
                        className="rounded-lg border border-card-border px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-content-bg"
                      >
                        {t('issues.discussion.attachFile')}
                      </button>
                      <button
                        type="button"
                        disabled={posting || !messageText.trim()}
                        onClick={handlePostMessage}
                        className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {posting ? t('common.loading') : t('issues.discussion.send')}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {showAttachPicker && (
        <AttachExistingFilePicker
          projectId={projectId}
          onClose={() => setShowAttachPicker(false)}
          onSelect={handleAttachFile}
        />
      )}
    </div>
  );
}
