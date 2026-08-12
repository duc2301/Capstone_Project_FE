import { useState } from 'react';

import type { CreateAccountPayload } from '@/entities/account';
import { t } from '@/shared/lib/i18n';
import { apiErrorMessage } from '../model/accountError';
import { useOrganizationOptions } from '../model/useOrganizationOptions';
import { AvatarDropzone } from './AvatarDropzone';

interface Props {
  onSubmit: (payload: CreateAccountPayload, avatar: File | null) => Promise<void>;
  onCancel: () => void;
}

const iconFieldClass = 'field-input pl-11';
const iconSelectClass = 'field-select pl-11';
const labelClass = 'field-label';
const iconClass = 'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted';

export function CreateAccountForm({ onSubmit, onCancel }: Props) {
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { options: organizations, loading: loadingOrganizations } = useOrganizationOptions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError(t('account.passwordMismatch'));
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(
        organizationId ? { userName, email, password, organizationId } : { userName, email, password },
        avatar,
      );
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Họ và tên — chiếm cả hàng */}
      <div className="space-y-1.5">
        <label htmlFor="create-userName" className={labelClass}>{t('account.fullName')}</label>
        <div className="relative">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <input
            id="create-userName"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder={t('account.fullNamePlaceholder')}
            required
            className={iconFieldClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="create-email" className={labelClass}>{t('account.emailAddress')}</label>
          <div className="relative">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-10 6L2 7" />
            </svg>
            <input
              id="create-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('account.emailPlaceholder')}
              required
              className={iconFieldClass}
            />
          </div>
        </div>

        {/* Doanh nghiệp / Công ty */}
        <div className="space-y-1.5">
          <label htmlFor="create-organization" className={labelClass}>{t('account.organization')}</label>
          <div className="relative">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
              <path d="M3 21h18" />
              <path d="M5 21V7l8-4v18" />
              <path d="M19 21V11l-6-4" />
            </svg>
            <select
              id="create-organization"
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              disabled={loadingOrganizations}
              className={iconSelectClass}
            >
              <option value="">{t('account.organizationNone')}</option>
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mật khẩu */}
        <div className="space-y-1.5">
          <label htmlFor="create-password" className={labelClass}>{t('account.password')}</label>
          <div className="relative">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              id="create-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className={`${iconFieldClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={t(showPassword ? 'account.hidePassword' : 'account.showPassword')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
                <circle cx="12" cy="12" r="3" />
                {!showPassword && <line x1="3" y1="3" x2="21" y2="21" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Nhập lại mật khẩu */}
        <div className="space-y-1.5">
          <label htmlFor="create-confirm" className={labelClass}>{t('account.confirmPassword')}</label>
          <div className="relative">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass}>
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              id="create-confirm"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={`${iconFieldClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={t(showConfirm ? 'account.hidePassword' : 'account.showPassword')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
                <circle cx="12" cy="12" r="3" />
                {!showConfirm && <line x1="3" y1="3" x2="21" y2="21" />}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Ảnh đại diện */}
      <AvatarDropzone file={avatar} onChange={setAvatar} />

      <p className="field-hint">{t('account.organizationHint')}</p>

      {error && (
        <p className="rounded-xl bg-danger-light px-4 py-2.5 text-sm font-medium text-danger">{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-card-border pt-5">
        <button type="button" onClick={onCancel} className="btn-modal-ghost">
          {t('account.cancel')}
        </button>
        <button type="submit" disabled={submitting} className="btn-modal-primary">
          {submitting ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t('account.submitCreate')}
            </span>
          ) : (
            t('account.submitCreate')
          )}
        </button>
      </div>
    </form>
  );
}
