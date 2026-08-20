import { useState } from 'react';

import type { AssignableGroup, AssignableMember, AssignIssuePayload, IssueItem } from '@/entities/issue';
import { t } from '@/shared/lib/i18n';

import { formatIssueDateTime, issueAssignmentBadge } from '../model/issueFormat';

const REJECT_REASON_MIN = 5;

interface IssueAssignmentSectionProps {
  issue: IssueItem;
  isCreator: boolean;
  busy: boolean;
  members: AssignableMember[];
  groups: AssignableGroup[];
  onAccept: () => void;
  onReject: (reason: string) => void;
  onAssign: (payload: AssignIssuePayload) => void;
}

export function IssueAssignmentSection({
  issue, isCreator, busy, members, groups, onAccept, onReject, onAssign,
}: IssueAssignmentSectionProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assigneeId, setAssigneeId] = useState('');
  const [assigneeGroupId, setAssigneeGroupId] = useState('');

  const badge = issueAssignmentBadge(issue.assignmentStatus);
  const isResolved = issue.status === 'Closed';
  const canRespond = issue.canRespondToAssignment && !isResolved;
  const canAssign = isCreator && !isResolved;
  const reasonTooShort = rejectReason.trim().length > 0 && rejectReason.trim().length < REJECT_REASON_MIN;

  const uniqueMembers = new Map<string, AssignableMember>();
  for (const member of members) {
    if (!uniqueMembers.has(member.accountId)) uniqueMembers.set(member.accountId, member);
  }

  const submitReject = () => {
    const reason = rejectReason.trim();
    if (reason.length < REJECT_REASON_MIN) return;
    setShowRejectForm(false);
    setRejectReason('');
    onReject(reason);
  };

  const submitAssign = () => {
    if (!assigneeId && !assigneeGroupId) return;
    setShowAssignForm(false);
    onAssign(assigneeId ? { assignedToAccountId: assigneeId } : { assignedToGroupId: assigneeGroupId });
    setAssigneeId('');
    setAssigneeGroupId('');
  };

  return (
    <section className="space-y-3 border-t border-card-border/70 pt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
          {t('issues.assignment.status')}
        </p>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
          {badge.label}
        </span>
      </div>

      {issue.assignmentStatus === 'Rejected' && issue.assignmentRejectReason && (
        <div className="space-y-1.5 rounded-[var(--radius-button)] border border-danger/20 bg-danger-light/50 p-3">
          <p className="field-label text-danger">{t('issues.assignment.rejectReason')}</p>
          <p className="cell-wrap text-sm text-text">{issue.assignmentRejectReason}</p>
          <p className="field-hint">
            {issue.assignmentRespondedByName ?? t('issues.unknownUser')}
            {' · '}
            {formatIssueDateTime(issue.assignmentRespondedAt)}
          </p>
          {canAssign && <p className="field-hint">{t('issues.assignment.rejectedNotice')}</p>}
        </div>
      )}

      {issue.assignmentStatus === 'Accepted' && (
        <p className="field-hint">
          {t('issues.assignment.respondedBy')}: {issue.assignmentRespondedByName ?? t('issues.unknownUser')}
          {' · '}
          {formatIssueDateTime(issue.assignmentRespondedAt)}
        </p>
      )}

      {issue.assignmentStatus === 'Pending' && !canRespond && (
        <p className="field-hint">
          {issue.assignedToGroupId
            ? t('issues.assignment.waitingLeader')
            : t('issues.assignment.waitingAssignee')}
        </p>
      )}

      {canRespond && !showRejectForm && (
        <div className="space-y-2">
          <p className="field-hint">
            {issue.assignedToGroupId
              ? t('issues.assignment.respondHintLeader')
              : t('issues.assignment.respondHintPerson')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={busy} onClick={onAccept} className="btn-modal-primary min-h-11">
              {t('issues.assignment.accept')}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setShowRejectForm(true)}
              className="btn-modal-danger min-h-11"
            >
              {t('issues.assignment.reject')}
            </button>
          </div>
        </div>
      )}

      {canRespond && showRejectForm && (
        <div className="space-y-2 rounded-[var(--radius-button)] border border-card-border bg-content-bg/40 p-3">
          <label className="flex flex-col gap-1.5">
            <span className="field-label">{t('issues.assignment.rejectReason')}</span>
            <textarea
              autoFocus
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t('issues.assignment.rejectReasonPlaceholder')}
              className="field-input resize-none"
            />
          </label>
          {reasonTooShort && (
            <p className="field-hint text-danger">{t('issues.assignment.rejectReasonRequired')}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
              className="btn-modal-ghost"
            >
              {t('issues.assignment.rejectCancel')}
            </button>
            <button
              type="button"
              disabled={busy || rejectReason.trim().length < REJECT_REASON_MIN}
              onClick={submitReject}
              className="btn-modal-danger"
            >
              {t('issues.assignment.rejectSubmit')}
            </button>
          </div>
        </div>
      )}

      {canAssign && !showAssignForm && (
        <button
          type="button"
          disabled={busy}
          onClick={() => setShowAssignForm(true)}
          className="btn-modal-ghost min-h-11 w-full"
        >
          {issue.assignedToAccountId || issue.assignedToGroupId
            ? t('issues.assignment.reassign')
            : t('issues.assignment.assign')}
        </button>
      )}

      {canAssign && showAssignForm && (
        <div className="space-y-3 rounded-[var(--radius-button)] border border-card-border bg-content-bg/40 p-3">
          <label className="flex flex-col gap-1.5">
            <span className="field-label">{t('issues.assignment.assignPersonLabel')}</span>
            <select
              value={assigneeId}
              onChange={(e) => { setAssigneeId(e.target.value); setAssigneeGroupId(''); }}
              disabled={busy}
              className="field-select"
            >
              <option value="">{t('issues.create.assigneePlaceholder')}</option>
              {Array.from(uniqueMembers.values()).map((member) => (
                <option key={member.accountId} value={member.accountId}>
                  {member.name} — {member.groupName}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="field-label">{t('issues.assignment.assignGroupLabel')}</span>
            <select
              value={assigneeGroupId}
              onChange={(e) => { setAssigneeGroupId(e.target.value); setAssigneeId(''); }}
              disabled={busy || Boolean(assigneeId)}
              className="field-select"
            >
              <option value="">{t('issues.create.assigneeGroupPlaceholder')}</option>
              {groups.map((group) => (
                <option key={group.groupId} value={group.groupId} disabled={!group.hasActiveLeader}>
                  {group.groupName}
                  {group.hasActiveLeader ? '' : ` (${t('issues.assignment.groupNoLeader')})`}
                </option>
              ))}
            </select>
          </label>

          <p className="field-hint">{t('issues.assignment.assignHint')}</p>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowAssignForm(false); setAssigneeId(''); setAssigneeGroupId(''); }}
              className="btn-modal-ghost"
            >
              {t('issues.assignment.assignCancel')}
            </button>
            <button
              type="button"
              disabled={busy || (!assigneeId && !assigneeGroupId)}
              onClick={submitAssign}
              className="btn-modal-primary"
            >
              {t('issues.assignment.assignSubmit')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
