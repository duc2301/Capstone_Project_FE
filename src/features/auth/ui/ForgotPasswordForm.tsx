import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { t } from '@/shared/lib/i18n';

import { useForgotPassword } from '../model/useForgotPassword';

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

function CheckCircleIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function ForgotPasswordForm() {
  const { loading, error, success, forgotPassword } = useForgotPassword();
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await forgotPassword(email);
  };

  if (success) {
    return (
      <div className="flex w-full max-w-[448px] flex-col items-center gap-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircleIcon />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="heading-page">
            Kiểm tra email của bạn
          </h1>
          <p className="text-base text-text-secondary">
            Nếu email <strong>{email}</strong> tồn tại trong hệ thống, chúng tôi đã gửi link đặt lại mật khẩu.
            Link có hiệu lực trong <strong>{t('auth.otpExpiry')}</strong>.
          </p>
        </div>
        <Link
          to="/login"
          className="text-sm font-semibold text-primary transition-colors hover:underline"
        >
          ← Quay lại đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[448px] flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="heading-page">
          Quên mật khẩu?
        </h1>
        <p className="text-base text-text-secondary">
          Nhập email của bạn và chúng tôi sẽ gửi link để đặt lại mật khẩu.
        </p>
      </header>

      <div className="flex flex-col gap-4 rounded-3xl border border-border-sage/30 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
        <form id="forgot-password-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            <label htmlFor="forgot-email" className={LABEL_CLASS}>
              Email công việc
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                <MailIcon />
              </span>
              <input
                id="forgot-email"
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

          <button
            id="forgot-password-submit-btn"
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-primary text-sm font-semibold tracking-[0.14px] text-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>{loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}</span>
            {!loading && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </form>
      </div>

      <p className="text-center text-sm font-semibold tracking-[0.14px] text-text-secondary">
        Nhớ mật khẩu rồi?{' '}
        <Link to="/login" className="text-primary transition-colors hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
