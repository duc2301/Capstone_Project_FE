import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useForgotPassword } from '../model/useForgotPassword';

const INPUT_BASE =
  'h-12 w-full rounded-xl border border-[#C3C9B9] bg-white font-jakarta text-base text-[#1B1C17] placeholder:text-[#6B7280] transition-colors focus:border-[#406623] focus:outline-none focus:ring-1 focus:ring-[#406623]';
const LABEL_CLASS =
  'font-jakarta text-sm font-semibold tracking-[0.14px] text-[#43493C]';

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
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#406623]/10 text-[#406623]">
          <CheckCircleIcon />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[28px] font-semibold text-[#1B1C17]">
            Kiểm tra email của bạn
          </h1>
          <p className="font-jakarta text-base text-[#43493C]">
            Nếu email <strong>{email}</strong> tồn tại trong hệ thống, chúng tôi đã gửi link đặt lại mật khẩu.
            Link có hiệu lực trong <strong>15 phút</strong>.
          </p>
        </div>
        <Link
          to="/login"
          className="font-jakarta text-sm font-semibold text-[#406623] transition-colors hover:underline"
        >
          ← Quay lại đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[448px] flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[32px] font-semibold leading-10 text-[#1B1C17]">
          Quên mật khẩu?
        </h1>
        <p className="font-jakarta text-base text-[#43493C]">
          Nhập email của bạn và chúng tôi sẽ gửi link để đặt lại mật khẩu.
        </p>
      </header>

      <div className="flex flex-col gap-4 rounded-3xl border border-[#C3C9B9]/30 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
        <form id="forgot-password-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <span className="font-jakarta text-sm text-red-600">{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="forgot-email" className={LABEL_CLASS}>
              Email công việc
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#73796B]">
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
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#406623] font-jakarta text-sm font-semibold tracking-[0.14px] text-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] transition-colors hover:bg-[#34521c] disabled:cursor-not-allowed disabled:opacity-50"
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

      <p className="text-center font-jakarta text-sm font-semibold tracking-[0.14px] text-[#43493C]">
        Nhớ mật khẩu rồi?{' '}
        <Link to="/login" className="text-[#406623] transition-colors hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
