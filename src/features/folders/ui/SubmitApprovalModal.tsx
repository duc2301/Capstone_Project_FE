import { useEffect, useRef, useState } from 'react';

import type { ApprovalTargetZone, SubmitApprovalPayload } from '@/entities/approval';
import type { Group } from '@/entities/group';
import { GroupMemberStatus } from '@/entities/group';
import { t } from '@/shared/lib/i18n';

interface SubmitApprovalModalProps {
  fileName: string;
  currentZone: string;
  targetZone: ApprovalTargetZone;
  canRequireSignature: boolean;
  mustRequireSignature: boolean;
  signerGroups: Group[];
  loadingSigners: boolean;
  busy: boolean;
  onClose: () => void;
  onSubmit: (payload: SubmitApprovalPayload) => void;
}

export function SubmitApprovalModal({
  fileName,
  currentZone,
  targetZone,
  canRequireSignature,
  mustRequireSignature,
  signerGroups,
  loadingSigners,
  busy,
  onClose,
  onSubmit,
}: SubmitApprovalModalProps) {
  const [requiresSignature, setRequiresSignature] = useState(false);
  const [signerAccountIds, setSignerAccountIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mustRequireSignature) setRequiresSignature(true);
  }, [mustRequireSignature]);

  const effectiveRequiresSignature = mustRequireSignature || (canRequireSignature && requiresSignature);

  const handleSubmit = () => {
    if (effectiveRequiresSignature && signerAccountIds.length === 0) {
      setError('Vui lòng nhập ít nhất một người ký hoặc nhóm ký.');
      return;
    }

    setError(null);
    onSubmit({
      targetZone,
      requiresSignature: effectiveRequiresSignature,
      signerAccountIds,
      signerGroupIds: [],
    });
  };

  const toggleAccount = (accountId: string) => {
    setSignerAccountIds((current) =>
      current.includes(accountId)
        ? current.filter((id) => id !== accountId)
        : [...current, accountId],
    );
  };

  const toggleGroupMembers = (memberIds: string[]) => {
    setSignerAccountIds((current) => {
      const currentSet = new Set(current);
      const allSelected = memberIds.every((id) => currentSet.has(id));

      if (allSelected) {
        return current.filter((id) => !memberIds.includes(id));
      }

      memberIds.forEach((id) => currentSet.add(id));
      return [...currentSet];
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={busy ? undefined : onClose} />
      <div className="relative z-10 w-full max-w-lg animate-scale-in rounded-(--radius-card-lg) bg-card shadow-modal">
        <div className="flex items-center justify-between border-b border-card-border px-6 py-4">
          <h2 className="font-heading text-lg font-bold text-text">{t('approvals.submitModal.title')}</h2>
          <button type="button" onClick={onClose} disabled={busy} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-content-bg hover:text-text disabled:opacity-40">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{t('approvals.submitModal.fileName')}</span>
            <input
              readOnly
              value={fileName}
              className="rounded-(--radius-input) border border-input-border bg-input-bg/60 px-3.5 py-2.5 text-sm text-text-secondary outline-none"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Vùng hiện tại</span>
              <input
                readOnly
                value={currentZone}
                className="rounded-(--radius-input) border border-input-border bg-input-bg/60 px-3.5 py-2.5 text-sm text-text-secondary outline-none"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Vùng chuyển đến</span>
              <input
                readOnly
                value={targetZone}
                className="rounded-(--radius-input) border border-input-border bg-input-bg/60 px-3.5 py-2.5 text-sm text-text-secondary outline-none"
              />
            </label>
          </div>

          {(canRequireSignature || mustRequireSignature) && (
            <label className="flex items-center gap-2.5 rounded-xl border border-card-border px-3.5 py-3">
              <input
                type="checkbox"
                checked={effectiveRequiresSignature}
                onChange={(e) => setRequiresSignature(e.target.checked)}
                disabled={busy || mustRequireSignature}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm font-medium text-text">{t('approvals.submitModal.requiresSignature')}</span>
              {mustRequireSignature && (
                <span className="ml-auto rounded-full bg-warning-light px-2.5 py-1 text-xs font-semibold text-warning">
                  Bắt buộc
                </span>
              )}
            </label>
          )}

          {effectiveRequiresSignature && (
            <div className="space-y-3 rounded-xl border border-card-border bg-content-bg/40 p-3.5">
              <p className="text-sm font-semibold text-text">Người ký bắt buộc</p>
              <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                {loadingSigners ? (
                  <p className="rounded-xl border border-card-border bg-card px-3.5 py-3 text-sm text-text-muted">
                    {t('common.loading')}
                  </p>
                ) : signerGroups.length === 0 ? (
                  <p className="rounded-xl border border-card-border bg-card px-3.5 py-3 text-sm text-text-muted">
                    Chưa có nhóm hoặc thành viên để chọn.
                  </p>
                ) : signerGroups.map((group) => {
                  const activeMembers = group.members.filter((member) => member.status === GroupMemberStatus.Active);
                  const activeMemberIds = activeMembers.map((member) => member.accountId);
                  const selectedMemberCount = activeMemberIds.filter((id) => signerAccountIds.includes(id)).length;
                  const allGroupMembersSelected = activeMemberIds.length > 0 && selectedMemberCount === activeMemberIds.length;
                  const hasPartialSelection = selectedMemberCount > 0 && selectedMemberCount < activeMemberIds.length;
                  return (
                    <div key={group.id} className="rounded-xl border border-card-border bg-card p-3">
                      <GroupSelectAllRow
                        groupName={group.name}
                        checked={allGroupMembersSelected}
                        indeterminate={hasPartialSelection}
                        disabled={busy || activeMemberIds.length === 0}
                        onToggle={() => toggleGroupMembers(activeMemberIds)}
                      />

                      <div className="mt-3 space-y-2 border-t border-card-border pt-3">
                        {activeMembers.length === 0 ? (
                          <p className="text-xs text-text-muted">Nhóm này chưa có thành viên active.</p>
                        ) : activeMembers.map((member) => (
                          <label key={`${group.id}-${member.accountId}`} className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-content-bg">
                            <input
                              type="checkbox"
                              checked={signerAccountIds.includes(member.accountId)}
                              onChange={() => toggleAccount(member.accountId)}
                              disabled={busy}
                              className="mt-1 h-4 w-4 accent-primary"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-text">{member.userName}</span>
                              <span className="block truncate text-xs text-text-muted">{member.email ?? member.accountId}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-text-muted">
                Tick vào tên nhóm để chọn hoặc bỏ chọn toàn bộ thành viên trong nhóm.
              </p>
            </div>
          )}

          {error && (
            <p className="rounded-xl border border-danger/20 bg-danger-light px-3.5 py-2 text-sm font-medium text-danger">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-card-border px-6 py-4">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-xl px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg disabled:opacity-40">
            {t('approvals.submitModal.cancel')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleSubmit}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? t('common.loading') : t('approvals.submitModal.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}

interface GroupSelectAllRowProps {
  groupName: string;
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  onToggle: () => void;
}

function GroupSelectAllRow({ groupName, checked, indeterminate, disabled, onToggle }: GroupSelectAllRowProps) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label className="flex items-center gap-2.5">
      <input
        ref={checkboxRef}
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        disabled={disabled}
        className="h-4 w-4 accent-primary"
      />
      <span className="font-semibold text-text">{groupName}</span>
      <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
        Chọn nhóm
      </span>
    </label>
  );
}
