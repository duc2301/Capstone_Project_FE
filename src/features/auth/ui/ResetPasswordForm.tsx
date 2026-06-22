import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useResetPassword } from '../model/useResetPassword';

const INPUT_BASE =
  'h-12 w-full rounded-xl border border-[#C3C9B9] bg-white font-jakarta text-base text-[#1B1C17] placeholder:text-[#6B7280] transition-colors focus:border-[#406623] focus:outline-none focus:ring-1 focus:ring-[#406623]';
const LABEL_CLASS =
  'font-jakarta text-sm font-semibold tracking-[0.14px] text-[#43493C]';

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

  const isInvalidLink = !email || !token;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (newPassword.length < 6) {
      setLocalError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError('Xác nhận mật khẩu không khớp.');
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
          <h1 className="font-display text-[28px] font-semibold text-[#1B1C17]">
            Link không hợp lệ
          </h1>
          <p className="font-jakarta text-base text-[#43493C]">
            Link đặt lại mật khẩu này không hợp lệ hoặc đã hết hạn.
          </p>
        </div>
        <Link
          to="/forgot-password"
          className="flex h-12 items-center justify-center rounded-xl bg-[#406623] px-6 font-jakarta text-sm font-semibold text-white hover:bg-[#34521c] transition-colors"
        >
          Yêu cầu link mới
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex w-full max-w-[448px] flex-col items-center gap-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#406623]/10 text-[#406623]">
          <CheckCircleIcon />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[28px] font-semibold text-[#1B1C17]">
            Đặt lại mật khẩu thành công!
          </h1>
          <p className="font-jakarta text-base text-[#43493C]">
            Mật khẩu của bạn đã được cập nhật. Đang chuyển hướng đến trang đăng nhập...
          </p>
        </div>
        <Link
          to="/login"
          className="font-jakarta text-sm font-semibold text-[#406623] transition-colors hover:underline"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  const displayError = localError || error;

  return (
    <div className="flex w-full max-w-[448px] flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[32px] font-semibold leading-10 text-[#1B1C17]">
          Đặt lại mật khẩu
        </h1>
        <p className="font-jakarta text-base text-[#43493C]">
          Nhập mật khẩu mới cho tài khoản <strong>{email}</strong>.
        </p>
      </header>

      <div className="flex flex-col gap-4 rounded-3xl border border-[#C3C9B9]/30 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
        <form id="reset-password-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          {displayError && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              <span className="font-jakarta text-sm text-red-600">{displayError}</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="reset-new-password" className={LABEL_CLASS}>
              Mật khẩu mới
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#73796B]">
                <LockIcon />
              </span>
              <input
                id="reset-new-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ít nhất 6 ký tự"
                autoComplete="new-password"
                className={`${INPUT_BASE} pl-12 pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#73796B] transition-colors hover:text-[#43493C]"
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="reset-confirm-password" className={LABEL_CLASS}>
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#73796B]">
                <LockIcon />
              </span>
              <input
                id="reset-confirm-password"
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
                className={`${INPUT_BASE} pl-12 pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                tabIndex={-1}
                aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#73796B] transition-colors hover:text-[#43493C]"
              >
                <EyeIcon open={showConfirm} />
              </button>
            </div>
          </div>

          <button
            id="reset-password-submit-btn"
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#406623] font-jakarta text-sm font-semibold tracking-[0.14px] text-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] transition-colors hover:bg-[#34521c] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>{loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}</span>
            {!loading && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </form>
      </div>

      <p className="text-center font-jakarta text-sm font-semibold tracking-[0.14px] text-[#43493C]">
        <Link to="/login" className="text-[#406623] transition-colors hover:underline">
          ← Quay lại đăng nhập
        </Link>
      </p>
    </div>
  );
}
