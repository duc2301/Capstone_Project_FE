import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { t } from '@/shared/lib/i18n';
import { useLogin } from '../model/useLogin';

export function LoginForm() {
  const { loading, error, login } = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login({ email, password });
  };

  return (
    <form
      id="login-form"
      onSubmit={handleSubmit}
      className="flex flex-col items-start px-4 gap-8 w-full max-w-[420px]"
    >
      <div className="flex flex-col items-start gap-1 w-full">
        <h1
          className="font-heading text-[32px] font-semibold leading-[38px] text-[#E0E2EC] w-full"
        >
          {t('login.title')}
        </h1>
        <p className="font-sans text-base font-normal leading-6 text-[#C1C6D6] w-full">
          {t('login.subtitle')}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 w-full px-4 py-3 rounded-sm bg-red-500/10 border border-red-500/30">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <span className="font-sans text-sm text-red-400">{error}</span>
        </div>
      )}

      <div className="flex flex-col items-start w-full pb-4">
        <div className="flex flex-col items-start gap-4 w-full">
          <div className="flex flex-col items-start gap-1 w-full">
            <label
              htmlFor="login-email"
              className="font-heading text-xs font-bold leading-3 tracking-[0.6px] text-[#C1C6D6] w-full"
            >
              {t('login.emailLabel')}
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('login.emailPlaceholder')}
              autoComplete="email"
              className="box-border w-full px-4 py-2.5 bg-[#1D2027] border border-[#414754] rounded-sm font-sans text-base text-[#E0E2EC] placeholder:text-[#8B909F] focus:outline-none focus:border-[#ACC7FF] transition-colors"
            />
          </div>

          <div className="flex flex-col items-start gap-1 w-full">
            <div className="flex justify-between items-start w-full">
              <label
                htmlFor="login-password"
                className="font-heading text-xs font-bold leading-3 tracking-[0.6px] text-[#C1C6D6]"
              >
                {t('login.passwordLabel')}
              </label>
              <a
                href="#"
                className="font-sans text-sm font-normal leading-5 tracking-[0.6px] text-[#ACC7FF] hover:underline transition-colors"
              >
                {t('login.forgotPassword')}
              </a>
            </div>
            <div className="relative w-full">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.passwordPlaceholder')}
                autoComplete="current-password"
                className="box-border w-full px-4 py-2.5 pr-12 bg-[#1D2027] border border-[#414754] rounded-sm font-sans text-base text-[#E0E2EC] placeholder:text-[#8B909F] focus:outline-none focus:border-[#ACC7FF] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B909F] hover:text-[#C1C6D6] transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="m1 1 22 22" />
                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start pt-2 w-full">
        <button
          id="login-submit-btn"
          type="submit"
          disabled={loading}
          className="flex justify-center items-center gap-2 w-full py-4 bg-[#ACC7FF] rounded-sm font-heading text-xs font-bold tracking-[0.6px] uppercase text-[#002F68] hover:bg-[#C4D8FF] active:bg-[#94B5F5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <span>{loading ? '...' : t('login.submit')}</span>
          {!loading && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>

      <div className="flex items-center gap-4 w-full">
        <div className="flex-1 h-px bg-[#414754]" />
        <span className="font-heading text-xs font-bold tracking-[0.6px] text-[#C1C6D6]">
          {t('login.divider')}
        </span>
        <div className="flex-1 h-px bg-[#414754]" />
      </div>

      <button
        id="login-sso-btn"
        type="button"
        className="box-border flex justify-center items-center gap-4 w-full py-4 bg-[#1D2027] border border-[#414754] rounded-sm font-heading text-xs font-bold tracking-[0.6px] uppercase text-[#E0E2EC] hover:bg-[#272A31] hover:border-[#5A6173] transition-colors cursor-pointer"
      >
        <svg width="15" height="14" viewBox="0 0 15 14" fill="none">
          <rect x="0" y="0" width="6.5" height="6.5" fill="#E0E2EC" />
          <rect x="8" y="0" width="6.5" height="6.5" fill="#E0E2EC" />
          <rect x="0" y="7.5" width="6.5" height="6.5" fill="#E0E2EC" />
          <rect x="8" y="7.5" width="6.5" height="6.5" fill="#E0E2EC" />
        </svg>
        <span>{t('login.sso')}</span>
      </button>

      <p className="font-sans text-sm text-[#C1C6D6] w-full text-center">
        {t('login.noAccount')}{' '}
        <Link to="/register" className="text-[#ACC7FF] hover:underline transition-colors">
          {t('login.signUp')}
        </Link>
      </p>
    </form>
  );
}
