import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { t } from '@/shared/lib/i18n';
import { useRegister } from '../model/useRegister';

const FIELD_CLASS =
  'box-border w-full px-4 py-2.5 bg-[#1D2027] border border-[#414754] rounded-sm font-sans text-base text-[#E0E2EC] placeholder:text-[#8B909F] focus:outline-none focus:border-[#ACC7FF] transition-colors';
const LABEL_CLASS =
  'font-heading text-xs font-bold leading-3 tracking-[0.6px] text-[#C1C6D6] w-full';

export function RegisterForm() {
  const { loading, error, register } = useRegister();
  const [form, setForm] = useState({
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await register(form);
  };

  return (
    <form
      id="register-form"
      onSubmit={handleSubmit}
      className="flex flex-col items-start px-4 gap-8 w-full max-w-[420px]"
    >
      <div className="flex flex-col items-start gap-1 w-full">
        <h1 className="font-heading text-[32px] font-semibold leading-[38px] text-[#E0E2EC] w-full">
          {t('register.title')}
        </h1>
        <p className="font-sans text-base font-normal leading-6 text-[#C1C6D6] w-full">
          {t('register.subtitle')}
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

      <div className="flex flex-col items-start gap-4 w-full">
        <div className="flex flex-col items-start gap-1 w-full">
          <label htmlFor="register-username" className={LABEL_CLASS}>
            {t('register.userNameLabel')}
          </label>
          <input
            id="register-username"
            name="userName"
            type="text"
            required
            value={form.userName}
            onChange={handleChange}
            placeholder={t('register.userNamePlaceholder')}
            autoComplete="username"
            className={FIELD_CLASS}
          />
        </div>

        <div className="flex flex-col items-start gap-1 w-full">
          <label htmlFor="register-email" className={LABEL_CLASS}>
            {t('register.emailLabel')}
          </label>
          <input
            id="register-email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder={t('register.emailPlaceholder')}
            autoComplete="email"
            className={FIELD_CLASS}
          />
        </div>

        <div className="flex flex-col items-start gap-1 w-full">
          <label htmlFor="register-password" className={LABEL_CLASS}>
            {t('register.passwordLabel')}
          </label>
          <input
            id="register-password"
            name="password"
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={handleChange}
            placeholder={t('register.passwordPlaceholder')}
            autoComplete="new-password"
            className={FIELD_CLASS}
          />
        </div>

        <div className="flex flex-col items-start gap-1 w-full">
          <label htmlFor="register-confirm-password" className={LABEL_CLASS}>
            {t('register.confirmPasswordLabel')}
          </label>
          <input
            id="register-confirm-password"
            name="confirmPassword"
            type="password"
            required
            minLength={6}
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder={t('register.confirmPasswordPlaceholder')}
            autoComplete="new-password"
            className={FIELD_CLASS}
          />
        </div>
      </div>

      <button
        id="register-submit-btn"
        type="submit"
        disabled={loading}
        className="flex justify-center items-center gap-2 w-full py-4 bg-[#ACC7FF] rounded-sm font-heading text-xs font-bold tracking-[0.6px] uppercase text-[#002F68] hover:bg-[#C4D8FF] active:bg-[#94B5F5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        <span>{loading ? '...' : t('register.submit')}</span>
        {!loading && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        )}
      </button>

      <p className="font-sans text-sm text-[#C1C6D6] w-full text-center">
        {t('register.haveAccount')}{' '}
        <Link to="/login" className="text-[#ACC7FF] hover:underline transition-colors">
          {t('register.signIn')}
        </Link>
      </p>
    </form>
  );
}
