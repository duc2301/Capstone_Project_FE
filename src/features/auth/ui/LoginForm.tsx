import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

import { t } from '@/shared/lib/i18n';
import { useLogin } from '../model/useLogin';
import { useGoogleLogin } from '../model/useGoogleLogin';

const INPUT_BASE =
  'h-12 w-full rounded-xl border border-border-sage bg-white text-base text-text-strong placeholder:text-text-placeholder transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';
const LABEL_CLASS =
  'text-sm font-semibold tracking-[0.14px] text-text-secondary';

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}

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


export function LoginForm() {
  const { loading, error, login } = useLogin();
  const { loading: gLoading, error: gError, handleGoogleCredential, setError: setGError } = useGoogleLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login({ email, password });
  };

  return (
    <div className="flex w-full max-w-[448px] flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="heading-page">
          Chào mừng trở lại
        </h1>
        <p className="text-base text-text-secondary">
          Vui lòng đăng nhập để truy cập dự án của bạn.
        </p>
      </header>

      <div className="flex flex-col gap-4 rounded-3xl border border-border-sage/30 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
        <form id="login-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="login-email" className={LABEL_CLASS}>
              Email công việc
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                <MailIcon />
              </span>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ten@congty.com"
                autoComplete="email"
                className={`${INPUT_BASE} pl-12 pr-4`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <label htmlFor="login-password" className={LABEL_CLASS}>
                {t('login.passwordLabel')}
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium tracking-[0.6px] text-primary transition-colors hover:underline"
              >
                {t('login.forgotPassword')}
              </Link>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                <LockIcon />
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.passwordPlaceholder')}
                autoComplete="current-password"
                className={`${INPUT_BASE} pl-12 pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text-secondary"
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          <label className="flex items-center gap-3 px-1">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-5 w-5 rounded border-border-sage text-primary accent-primary focus:ring-primary"
            />
            <span className="text-sm font-semibold tracking-[0.14px] text-text-secondary">
              {t('login.rememberMe')}
            </span>
          </label>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary text-sm font-semibold tracking-[0.14px] text-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>{loading ? '...' : t('login.submit')}</span>
            {!loading && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </form>

        <div className="border-t border-border-sage/30 pt-4 flex flex-col gap-3">
          <div className="relative flex items-center">
            <div className="flex-1 border-t border-border-sage/40" />
            <span className="mx-3 text-xs text-text-muted">{t('common.or')}</span>
            <div className="flex-1 border-t border-border-sage/40" />
          </div>

          {gError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <span className="text-sm text-red-600">{gError}</span>
            </div>
          )}

          <div className="flex w-full justify-center">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  handleGoogleCredential(credentialResponse.credential);
                } else {
                  setGError('Không nhận được thông tin từ Google.');
                }
              }}
              onError={() => setGError('Đăng nhập bằng Google thất bại. Vui lòng thử lại.')}
              width="400"
              text="continue_with"
              shape="rectangular"
              logo_alignment="left"
            />
          </div>

          {gLoading && (
            <p className="text-center text-xs text-text-muted">{t('common.processing')}</p>
          )}
        </div>
      </div>

      <p className="text-center text-sm font-semibold tracking-[0.14px] text-text-secondary">
        {t('login.noAccount')}{' '}
        <Link to="/register" className="text-primary transition-colors hover:underline">
          {t('login.signUp')}
        </Link>
      </p>
    </div>
  );
}
