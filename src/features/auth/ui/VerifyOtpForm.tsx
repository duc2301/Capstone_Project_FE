import type { FormEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { t } from '@/shared/lib/i18n';
import { useVerifyOtp } from '../model/useVerifyOtp';

const OTP_LENGTH = 6;

export function VerifyOtpForm() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') ?? '';

  const { loading, error, success, resending, verifyOtp, resendOtp } =
    useVerifyOtp();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [countdown, setCountdown] = useState(120); // 2 phút countdown

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleChange = useCallback(
    (index: number, value: string) => {
      // Chỉ nhận số
      const digit = value.replace(/\D/g, '').slice(-1);
      setDigits((prev) => {
        const next = [...prev];
        next[index] = digit;
        return next;
      });
      // Auto-focus ô tiếp theo
      if (digit && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [],
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [digits],
  );

  // Hỗ trợ paste toàn bộ mã OTP
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
      if (pasted.length === 0) return;
      const newDigits = Array(OTP_LENGTH).fill('');
      for (let i = 0; i < pasted.length; i++) {
        newDigits[i] = pasted[i];
      }
      setDigits(newDigits);
      const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
      inputRefs.current[focusIndex]?.focus();
    },
    [],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length !== OTP_LENGTH) return;
    await verifyOtp(email, otp);
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    await resendOtp(email);
    setCountdown(120);
  };

  if (!email) {
    return (
      <div className="flex w-full max-w-[480px] flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-semibold text-[#1B1C17]">
          {t('verifyOtp.missingEmail')}
        </h1>
        <p className="font-jakarta text-base text-[#73796B]">
          {t('verifyOtp.missingEmailDesc')}
        </p>
        <Link
          to="/register"
          className="mt-2 rounded-full bg-[#406623] px-8 py-3 font-jakarta text-sm font-bold text-white transition-colors hover:bg-[#34521c]"
        >
          {t('verifyOtp.goToRegister')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[480px] flex-col gap-5">
      <header className="flex flex-col items-center gap-2 text-center">
        {/* Email icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#406623]/10">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#406623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>
        <h1 className="font-display text-[28px] font-semibold leading-9 text-[#1B1C17]">
          {t('verifyOtp.title')}
        </h1>
        <p className="max-w-[400px] font-jakarta text-base text-[#73796B]">
          {t('verifyOtp.subtitle')}{' '}
          <span className="font-semibold text-[#1B1C17]">{email}</span>
        </p>
      </header>

      <form
        id="verify-otp-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 rounded-3xl border border-[#C3C9B9] bg-white px-6 pb-6 pt-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] md:px-10"
      >
        {/* Error alert */}
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

        {/* Success alert */}
        {success && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-green-300 bg-green-50 px-4 py-3"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span className="font-jakarta text-sm text-green-600">{success}</span>
          </div>
        )}

        {/* OTP Input Grid */}
        <div className="flex flex-col items-center gap-3">
          <p className="font-jakarta text-sm font-semibold tracking-[0.14px] text-[#43493C]">
            {t('verifyOtp.enterCode')}
          </p>
          <div className="flex gap-3" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                autoFocus={idx === 0}
                className="h-14 w-12 rounded-xl border border-[#C3C9B9] bg-[#F8F8F5] text-center font-display text-2xl font-semibold text-[#1B1C17] transition-all focus:border-[#406623] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#406623]/30"
                aria-label={`OTP digit ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          id="verify-otp-submit-btn"
          type="submit"
          disabled={loading || digits.join('').length !== OTP_LENGTH}
          className="flex w-full items-center justify-center rounded-full bg-[#406623] py-3 font-jakarta text-sm font-bold tracking-[0.14px] text-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#34521c] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t('verifyOtp.verifying')}
            </span>
          ) : (
            t('verifyOtp.submit')
          )}
        </button>

        {/* Resend & timer */}
        <div className="flex flex-col items-center gap-2 border-t border-[#C3C9B9]/30 pt-4">
          <p className="font-jakarta text-sm text-[#73796B]">
            {t('verifyOtp.noCode')}
          </p>
          {countdown > 0 ? (
            <p className="font-jakarta text-sm text-[#73796B]">
              {t('verifyOtp.resendIn')}{' '}
              <span className="font-semibold text-[#406623]">
                {formatCountdown(countdown)}
              </span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="font-jakarta text-sm font-semibold text-[#406623] transition-colors hover:underline disabled:opacity-50"
            >
              {resending ? t('verifyOtp.resending') : t('verifyOtp.resendBtn')}
            </button>
          )}
        </div>

        {/* Back to login */}
        <div className="text-center">
          <Link
            to="/login"
            className="font-jakarta text-sm text-[#73796B] transition-colors hover:text-[#43493C]"
          >
            ← {t('verifyOtp.backToLogin')}
          </Link>
        </div>
      </form>
    </div>
  );
}
