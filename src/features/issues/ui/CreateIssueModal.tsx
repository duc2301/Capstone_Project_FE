import { useEffect, useState } from 'react';

import type { IssueItem, IssuePriority, IssueType } from '@/entities/issue';
import { ISSUE_DESCRIPTION_MIN, ISSUE_TITLE_MIN, issueApi, issueErrorMessage } from '@/entities/issue';
import { t } from '@/shared/lib/i18n';

import { useAssignableMembers } from '../model/useAssignableMembers';
import { useAssignableOrganizations } from '../model/useAssignableOrganizations';

interface CreateIssueModalProps {
  projectId: string;
  fileItemId: string;
  onClose: () => void;
  onCreated: (issue: IssueItem) => void;
  onToast: (message: string, type?: 'success' | 'error') => void;
}

export function CreateIssueModal({ projectId, fileItemId, onClose, onCreated, onToast }: CreateIssueModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<IssueType>('Issue');
  const [priority, setPriority] = useState<IssuePriority>('Medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [assigneeOrgId, setAssigneeOrgId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { members: assignableMembers, loading: membersLoading, error: membersError } = useAssignableMembers(fileItemId);
  const { organizations: assignableOrganizations } = useAssignableOrganizations(fileItemId);

  useEffect(() => {
    if (membersError) onToast(membersError, 'error');
  }, [membersError]);

  const titleTooShort = title.trim().length > 0 && title.trim().length < ISSUE_TITLE_MIN;
  const descriptionTooShort = description.trim().length > 0 && description.trim().length < ISSUE_DESCRIPTION_MIN;
  const canSubmit =
    title.trim().length >= ISSUE_TITLE_MIN
    && description.trim().length >= ISSUE_DESCRIPTION_MIN
    && !busy;

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await issueApi.create({
        projectId,
        linkedFileItemId: fileItemId,
        title: title.trim(),
        description: description.trim(),
        type,
        priority,
        dueDate: dueDate || undefined,
        assignedToAccountId: assigneeId || undefined,
        assignedToOrganizationId: assigneeId ? undefined : assigneeOrgId || undefined,
      });

      onToast(t('issues.toast.created'));
      onCreated(created);
    } catch (err) {
      setError(issueErrorMessage(err, t('issues.error.create')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={busy ? undefined : onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg animate-scale-in flex-col overflow-hidden rounded-[var(--radius-card-lg)] bg-card shadow-modal">
        <div className="flex items-center justify-between border-b border-card-border px-6 py-4">
          <h2 className="heading-entity">{t('issues.create.title')}</h2>
          <button type="button" onClick={onClose} disabled={busy} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-content-bg hover:text-text disabled:opacity-40">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <label className="flex flex-col gap-1.5">
            <span className="field-label">{t('issues.create.titleLabel')}</span>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={busy}
              placeholder={t('issues.create.titlePlaceholder')}
              className="field-input"
            />
            {titleTooShort && <span className="field-hint text-danger">{t('issues.create.titleTooShort')}</span>}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="field-label">{t('issues.create.typeLabel')}</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as IssueType)}
                disabled={busy}
                className="field-input"
              >
                <option value="Issue">{t('issues.type.issue')}</option>
                <option value="Rfi">{t('issues.type.rfi')}</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="field-label">{t('issues.create.priorityLabel')}</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as IssuePriority)}
                disabled={busy}
                className="field-input"
              >
                <option value="Low">{t('issues.priority.low')}</option>
                <option value="Medium">{t('issues.priority.medium')}</option>
                <option value="High">{t('issues.priority.high')}</option>
                <option value="Critical">{t('issues.priority.critical')}</option>
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="field-label">{t('issues.create.dueDateLabel')}</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={busy}
              className="field-input"
            />
            <span className="field-hint">{t('issues.create.dueDateHint')}</span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="field-label">{t('issues.create.assigneeLabel')}</span>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              disabled={busy || membersLoading}
              className="field-input"
            >
              <option value="">{t('issues.create.assigneePlaceholder')}</option>
              {assignableMembers.map((m) => (
                <option key={`${m.accountId}-${m.groupId}`} value={m.accountId}>{m.name} — {m.groupName}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="field-label">{t('issues.create.assigneeOrgLabel')}</span>
            <select
              value={assigneeOrgId}
              onChange={(e) => setAssigneeOrgId(e.target.value)}
              disabled={busy || !!assigneeId}
              className="field-input"
            >
              <option value="">{t('issues.create.assigneeOrgPlaceholder')}</option>
              {assignableOrganizations.map((o) => (
                <option key={o.organizationId} value={o.organizationId}>
                  {o.groupNames.length > 0
                    ? `${o.organizationName} — ${o.groupNames.join(', ')}`
                    : o.organizationName}
                </option>
              ))}
            </select>
            <span className="field-hint">
              {assigneeId ? t('issues.create.assigneeOrgDisabled') : t('issues.create.assigneeOrgHint')}
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="field-label">{t('issues.create.descriptionLabel')}</span>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={busy}
              placeholder={t('issues.create.descriptionPlaceholder')}
              className="field-input resize-none"
            />
            {descriptionTooShort
              ? <span className="field-hint text-danger">{t('issues.create.descriptionTooShort')}</span>
              : <span className="field-hint">{t('issues.create.descriptionRequired')}</span>}
          </label>

          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger-light px-4 py-3">
              <p className="text-sm font-medium text-danger">{error}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-card-border px-6 py-4">
          <button type="button" onClick={onClose} disabled={busy} className="btn-modal-ghost">
            {t('issues.create.cancel')}
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="btn-modal-primary"
          >
            {busy ? t('common.loading') : t('issues.create.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
