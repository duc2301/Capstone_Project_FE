import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { t } from '@/shared/lib/i18n';

import { useResetPassword } from '../model/useResetPassword';

const WELCOME_TEMP_PASSWORD = '123456';

const INPUT_BASE =
  'h-12 w-full rounded-xl border border-border-sage bg-white text-base text-text-strong placeholder:text-text-placeholder transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';
const LABEL_CLASS =
  'text-sm font-semibold tracking-[0.14px] text-text-secondary';

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="m1 1 22 22" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function ResetPasswordForm() {
  const { loading, error, success, resetPassword } = useResetPassword();
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const email = searchParams.get('email') ?? '';
  const token = searchParams.get('token') ?? '';
  // Chỉ hiển thị: liên kết từ email mời (admin tạo tài khoản) mang welcome=1;
  // liên kết quên mật khẩu thì không. KHÔNG gửi tham số này lên API.
  const isWelcome = searchParams.get('welcome') === '1';

  const isInvalidLink = !email || !token;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (newPassword.length < 6) {
      setLocalError(t('auth.resetPassword.minLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError(t('auth.resetPassword.mismatch'));
      return;
    }

    await resetPassword(email, token, newPassword);
  };

  if (isInvalidLink) {
    return (
      <div className="flex w-full max-w-[448px] flex-col items-center gap-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-500">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="heading-page">{t('auth.resetPassword.invalidTitle')}</h1>
          <p className="text-base text-text-secondary">{t('auth.resetPassword.invalidBody')}</p>
        </div>
        <div className="flex w-full flex-col items-center gap-3">
          <Link
            to="/login"
            className="flex h-12 w-full items-center justify-center rounded-[var(--radius-button)] bg-primary px-6 text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
          >
            {t('auth.resetPassword.goLogin')}
          </Link>
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-primary transition-colors hover:underline"
          >
            {t('auth.resetPassword.requestNew')}
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex w-full max-w-[448px] flex-col items-center gap-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircleIcon />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="heading-page">
            {isWelcome ? t('auth.resetPassword.doneWelcome') : t('auth.resetPassword.doneTitle')}
          </h1>
          <p className="text-base text-text-secondary">{t('auth.resetPassword.doneBody')}</p>
        </div>
        <Link
          to="/login"
          className="text-sm font-semibold text-primary transition-colors hover:underline"
        >
          {t('auth.resetPassword.loginNow')}
        </Link>
      </div>
    );
  }

  const displayError = localError || error;

  return (
    <div className="flex w-full max-w-[448px] flex-col gap-4">
      <header className="flex flex-col gap-1">
        {isWelcome ? (
          <>
            <h1 className="heading-page">{t('auth.resetPassword.welcomeTitle')}</h1>
            <p className="text-base text-text-secondary">
              {t('auth.resetPassword.welcomeBody')
                .replace('{email}', email)
                .replace('{password}', WELCOME_TEMP_PASSWORD)}
            </p>
          </>
        ) : (
          <>
            <h1 className="heading-page">{t('auth.resetPassword.title')}</h1>
            <p className="text-base text-text-secondary">
              {t('auth.resetPassword.subtitle').replace('{email}', email)}
            </p>
          </>
        )}
      </header>

      <div className="flex flex-col gap-4 rounded-3xl border border-border-sage/30 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
        <form id="reset-password-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          {displayError && (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2" className="shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <span className="text-sm text-red-600">{displayError}</span>
              </div>

              {/* Lỗi từ server (token hết hạn / email không hợp lệ): mở hai lối đi cho người dùng. */}
              {error && (
                <div className="flex flex-col gap-2 border-t border-red-200 pt-3">
                  {isWelcome && (
                    <p className="text-xs text-text-secondary">
                      {t('auth.resetPassword.tempHint').replace('{password}', WELCOME_TEMP_PASSWORD)}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to="/login"
                      className="inline-flex h-9 items-center justify-center rounded-[var(--radius-button)] bg-primary px-4 text-xs font-semibold text-white transition-colors hover:bg-primary-hover"
                    >
                      {t('auth.resetPassword.goLogin')}
                    </Link>
                    <Link
                      to="/forgot-password"
                      className="inline-flex h-9 items-center justify-center rounded-[var(--radius-button)] border border-primary px-4 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
                    >
                      {t('auth.resetPassword.resendNew')}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="reset-new-password" className={LABEL_CLASS}>
              {t('auth.resetPassword.newPassword')}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                <LockIcon />
              </span>
              <input
                id="reset-new-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('auth.password.minHint')}
                autoComplete="new-password"
                className={`${INPUT_BASE} pl-12 pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                aria-label={showPassword ? t('auth.password.hide') : t('auth.password.show')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="reset-confirm-password" className={LABEL_CLASS}>
              {t('auth.resetPassword.confirmPassword')}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                <LockIcon />
              </span>
              <input
                id="reset-confirm-password"
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('auth.password.confirmHint')}
                autoComplete="new-password"
                className={`${INPUT_BASE} pl-12 pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                tabIndex={-1}
                aria-label={showConfirm ? t('auth.password.hide') : t('auth.password.show')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
              >
                <EyeIcon open={showConfirm} />
              </button>
            </div>
          </div>

          <button
            id="reset-password-submit-btn"
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary text-sm font-semibold tracking-[0.14px] text-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>{loading ? t('common.processing') : isWelcome ? t('auth.resetPassword.setPassword') : t('auth.resetPassword.submit')}</span>
            {!loading && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </form>
      </div>

      <p className="text-center text-sm font-semibold tracking-[0.14px] text-text-secondary">
        <Link to="/login" className="text-primary transition-colors hover:underline">
          {`← ${t('auth.forgot.backToLogin')}`}
        </Link>
      </p>
    </div>
  );
}
