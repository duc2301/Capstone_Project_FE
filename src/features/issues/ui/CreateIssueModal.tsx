import { useEffect, useRef, useState } from 'react';

import type { IssuePriority, IssueType } from '@/entities/issue';
import { issueApi, issueErrorMessage } from '@/entities/issue';
import { t } from '@/shared/lib/i18n';

import { useAssignableMembers } from '../model/useAssignableMembers';

const MAX_ATTACHMENT_SIZE_BYTES = 20 * 1024 * 1024;

interface PendingFile {
  file: File;
  previewUrl: string | null;
}

interface CreateIssueModalProps {
  projectId: string;
  fileItemId: string;
  onClose: () => void;
  onCreated: () => void;
  onToast: (message: string, type?: 'success' | 'error') => void;
}

export function CreateIssueModal({ projectId, fileItemId, onClose, onCreated, onToast }: CreateIssueModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<IssueType>('Issue');
  const [priority, setPriority] = useState<IssuePriority>('Medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { members: assignableMembers, loading: membersLoading, error: membersError } = useAssignableMembers(fileItemId);

  useEffect(() => {
    if (membersError) onToast(membersError, 'error');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membersError]);

  const canSubmit = title.trim().length > 0 && !busy;

  // Thu hoi object URL preview khi component unmount, tranh leak.
  useEffect(() => () => {
    files.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList) return;
    const picked = Array.from(fileList);
    const tooBig = picked.find((f) => f.size > MAX_ATTACHMENT_SIZE_BYTES);
    if (tooBig) {
      onToast(t('issues.create.attachmentTooLarge'), 'error');
      return;
    }
    const withPreview: PendingFile[] = picked.map((file) => ({
      file,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }));
    setFiles((prev) => [...prev, ...withPreview]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (idx: number) => {
    setFiles((prev) => {
      const target = prev[idx];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await issueApi.create({
        projectId,
        linkedFileItemId: fileItemId,
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        status: 'Open',
        priority,
        assignedToAccountId: assigneeId || undefined,
      });

      for (const { file } of files) {
        try {
          await issueApi.uploadAttachment(created.id, file);
        } catch (err) {
          onToast(issueErrorMessage(err, t('issues.error.uploadAttachment')), 'error');
        }
      }

      onToast(t('issues.toast.created'));
      onCreated();
    } catch (err) {
      setError(issueErrorMessage(err, t('issues.error.create')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={busy ? undefined : onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg animate-scale-in flex-col overflow-hidden rounded-(--radius-card-lg) bg-card shadow-modal">
        <div className="flex items-center justify-between border-b border-card-border px-6 py-4">
          <h2 className="font-heading text-lg font-bold text-text">{t('issues.create.title')}</h2>
          <button type="button" onClick={onClose} disabled={busy} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-content-bg hover:text-text disabled:opacity-40">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{t('issues.create.titleLabel')}</span>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={busy}
              placeholder={t('issues.create.titlePlaceholder')}
              className="rounded-(--radius-input) border border-input-border bg-input-bg px-3.5 py-2.5 text-sm text-text outline-none focus:border-input-focus"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{t('issues.create.typeLabel')}</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as IssueType)}
                disabled={busy}
                className="rounded-(--radius-input) border border-input-border bg-input-bg px-3.5 py-2.5 text-sm font-semibold text-text outline-none focus:border-input-focus"
              >
                <option value="Issue">{t('issues.type.issue')}</option>
                <option value="Rfi">{t('issues.type.rfi')}</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{t('issues.create.priorityLabel')}</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as IssuePriority)}
                disabled={busy}
                className="rounded-(--radius-input) border border-input-border bg-input-bg px-3.5 py-2.5 text-sm font-semibold text-text outline-none focus:border-input-focus"
              >
                <option value="Low">{t('issues.priority.low')}</option>
                <option value="Medium">{t('issues.priority.medium')}</option>
                <option value="High">{t('issues.priority.high')}</option>
                <option value="Critical">{t('issues.priority.critical')}</option>
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{t('issues.create.assigneeLabel')}</span>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              disabled={busy || membersLoading}
              className="rounded-(--radius-input) border border-input-border bg-input-bg px-3.5 py-2.5 text-sm font-semibold text-text outline-none focus:border-input-focus"
            >
              <option value="">{t('issues.create.assigneePlaceholder')}</option>
              {assignableMembers.map((m) => (
                <option key={`${m.accountId}-${m.groupId}`} value={m.accountId}>{m.name} — {m.groupName}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{t('issues.create.descriptionLabel')}</span>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={busy}
              placeholder={t('issues.create.descriptionPlaceholder')}
              className="resize-none rounded-(--radius-input) border border-input-border bg-input-bg px-3.5 py-2.5 text-sm text-text outline-none focus:border-input-focus"
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{t('issues.create.attachmentsLabel')}</span>
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border border-dashed border-card-border px-4 py-3 text-center text-xs font-semibold text-text-secondary transition-colors hover:bg-content-bg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('issues.create.attachmentsHint')}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />
            {files.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {files.map((f, idx) => (
                  <li key={`${f.file.name}-${idx}`} className="relative flex items-center gap-2 rounded-lg bg-content-bg/60 px-2.5 py-1.5 text-xs">
                    {f.previewUrl ? (
                      <img src={f.previewUrl} alt={f.file.name} className="h-8 w-8 shrink-0 rounded-md object-cover" />
                    ) : (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-content-bg text-text-muted">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </span>
                    )}
                    <span className="max-w-[140px] truncate text-text">{f.file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="shrink-0 text-text-muted hover:text-danger"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-danger/30 bg-danger-light px-4 py-3">
              <p className="text-sm font-medium text-danger">{error}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-card-border px-6 py-4">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-xl px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg disabled:opacity-40">
            {t('issues.create.cancel')}
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? t('common.loading') : t('issues.create.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
