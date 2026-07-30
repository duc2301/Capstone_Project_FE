import { useState } from 'react';

import type { Account, UpdateAccountPayload } from '@/entities/account';
import { ACCOUNT_ASSIGNABLE_STATUSES, ACCOUNT_ROLES } from '@/entities/account';
import { t } from '@/shared/lib/i18n';
import { roleLabel, statusMeta } from '../model/accountFormat';
import { apiErrorMessage } from '../model/accountError';
import { useOrganizationOptions } from '../model/useOrganizationOptions';
import { AvatarDropzone } from './AvatarDropzone';

interface Props {
  account: Account;
  onSubmit: (id: string, payload: UpdateAccountPayload, avatar: File | null) => Promise<void>;
  onCancel: () => void;
}

const fieldClass =
  'w-full rounded-xl border border-card-border bg-input-bg px-4 py-3 text-sm text-text outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20';
const iconFieldClass = `${fieldClass} pl-11`;
const labelClass = 'block text-sm text-text-secondary';
const iconClass = 'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted';

/* Nhãn nhóm trường — chia form thành từng khối cho dễ đọc. */
function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-text-muted">
      {icon}
      <span className="text-[11px] font-bold uppercase tracking-[1px]">{children}</span>
    </div>
  );
}

export function UpdateAccountForm({ account, onSubmit, onCancel }: Props) {
  const [userName, setUserName] = useState(account.userName);
  const [email, setEmail] = useState(account.email);
  const [role, setRole] = useState(account.role ?? '');
  const [status, setStatus] = useState(account.status ?? '');
  const [organizationId, setOrganizationId] = useState(account.organizationId ?? '');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { options: organizations, loading: loadingOrganizations } = useOrganizationOptions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: UpdateAccountPayload = { userName, email, role, status };

      if (organizationId) {
        payload.organizationId = organizationId;
      } else if (account.organizationId) {
        // BE cập nhật partial: bỏ trống dropdown phải báo cờ này mới gỡ được công ty cũ.
        payload.clearOrganization = true;
      }

      await onSubmit(account.id, payload, avatar);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Thông tin cá nhân ─────────────────────── */}
      <section className="space-y-4">
        <SectionLabel
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="10" r="3" />
              <path d="M6.5 19.5a6 6 0 0 1 11 0" />
            </svg>
          }
        >
          {t('account.section.personal')}
        </SectionLabel>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {/* Họ và tên */}
          <div className="space-y-1.5">
            <label htmlFor="edit-userName" className={labelClass}>{t('account.fullName')}</label>
            <div className="relative">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                id="edit-userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder={t('account.fullNamePlaceholder')}
                className={iconFieldClass}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="edit-email" className={labelClass}>{t('account.emailAddress')}</label>
            <div className="relative">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-10 6L2 7" />
              </svg>
              <input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('account.emailPlaceholder')}
                className={iconFieldClass}
              />
            </div>
          </div>

          {/* Doanh nghiệp / Công ty */}
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="edit-organization" className={labelClass}>{t('account.organization')}</label>
            <div className="relative">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
                <path d="M3 21h18" />
                <path d="M5 21V7l8-4v18" />
                <path d="M19 21V11l-6-4" />
              </svg>
              <select
                id="edit-organization"
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                disabled={loadingOrganizations}
                className={`${iconFieldClass} disabled:opacity-60`}
              >
                <option value="">{t('account.organizationNone')}</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-text-muted">{t('account.organizationHint')}</p>
          </div>
        </div>
      </section>

      {/* ── Quyền truy cập ────────────────────────── */}
      <section className="space-y-4 border-t border-card-border pt-5">
        <SectionLabel
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          }
        >
          {t('account.section.access')}
        </SectionLabel>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="edit-role" className={labelClass}>{t('account.roleSystem')}</label>
            <select
              id="edit-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={fieldClass}
            >
              {ACCOUNT_ROLES.map((value) => (
                <option key={value} value={value}>
                  {roleLabel(value)}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-muted">{t('account.roleHint')}</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="edit-status" className={labelClass}>{t('account.status')}</label>
            <select
              id="edit-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={fieldClass}
            >
              {ACCOUNT_ASSIGNABLE_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {statusMeta(value).label}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-muted">{t('account.statusHint')}</p>
          </div>
        </div>
      </section>

      {/* ── Ảnh đại diện ──────────────────────────── */}
      <section className="space-y-3 border-t border-card-border pt-5">
        <SectionLabel
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          }
        >
          {t('account.avatar.label')}
        </SectionLabel>
        <AvatarDropzone file={avatar} onChange={setAvatar} currentUrl={account.avatarUrl} />
      </section>

      {error && (
        <p className="rounded-xl bg-danger-light px-4 py-2.5 text-sm font-medium text-danger">{error}</p>
      )}

      {/* ── Actions ───────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 border-t border-card-border pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-card-border bg-card px-8 py-3 text-sm font-semibold text-text-secondary transition-all duration-200 hover:border-text-muted hover:bg-content-bg"
        >
          {t('account.cancel')}
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white shadow-[0_6px_10px_-3px_rgba(64,102,35,0.25)] transition-all duration-200 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t('account.submitUpdate')}
            </span>
          ) : (
            t('account.submitUpdate')
          )}
        </button>
      </div>
    </form>
  );
}
