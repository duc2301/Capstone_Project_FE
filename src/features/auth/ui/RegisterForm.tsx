import type { FormEvent, ReactNode } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';
import { useRegister } from '../model/useRegister';

const INPUT_BASE =
  'h-10 w-full rounded-xl border border-[#C3C9B9] bg-white px-4 font-jakarta text-sm text-[#1B1C17] placeholder:text-[#6B7280] transition-colors focus:border-[#406623] focus:outline-none focus:ring-1 focus:ring-[#406623]';
const LABEL_CLASS =
  'font-jakarta text-sm font-semibold tracking-[0.14px] text-[#43493C]';

function SectionHeader({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-[#406623]">
      {icon}
      <h2 className="font-jakarta text-sm font-semibold uppercase tracking-[0.7px]">
        {title}
      </h2>
    </div>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3z" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="m1 1 22 22" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    </svg>
  );
}

interface PasswordFieldProps {
  id: string;
  name: 'password' | 'confirmPassword';
  labelKey: TranslationKey;
  placeholderKey: TranslationKey;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hintKey?: TranslationKey;
}

function PasswordField({
  id,
  name,
  labelKey,
  placeholderKey,
  value,
  onChange,
  hintKey,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={LABEL_CLASS}>
        {t(labelKey)}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          required
          minLength={6}
          value={value}
          onChange={onChange}
          placeholder={t(placeholderKey)}
          autoComplete="new-password"
          className={`${INPUT_BASE} pr-12`}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          tabIndex={-1}
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#73796B] transition-colors hover:text-[#43493C]"
        >
          <EyeIcon open={visible} />
        </button>
      </div>
      {hintKey && (
        <p className="font-jakarta text-xs font-medium tracking-[0.6px] text-[#73796B]">
          {t(hintKey)}
        </p>
      )}
    </div>
  );
}

export function RegisterForm() {
  const { loading, error, register } = useRegister();
  const [form, setForm] = useState({
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [agreed, setAgreed] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await register(form);
  };

  return (
    <div className="flex w-full max-w-[896px] flex-col gap-4">
      <header className="flex flex-col items-center gap-1.5 text-center">
        <h1 className="font-display text-[26px] font-semibold leading-8 text-[#1B1C17]">
          {t('register.title')}
        </h1>
        <p className="max-w-[512px] font-jakarta text-sm text-[#73796B]">
          {t('register.subtitle')}
        </p>
      </header>

      <form
        id="register-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 rounded-3xl border border-[#C3C9B9] bg-white px-6 py-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] md:px-10 md:py-6"
      >
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

        <section className="flex flex-col gap-4">
          <SectionHeader icon={<UserIcon />} title={t('register.section.personal')} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
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
                className={INPUT_BASE}
              />
            </div>
            <div className="flex flex-col gap-1.5">
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
                className={INPUT_BASE}
              />
            </div>
          </div>
        </section>

        <div className="h-px bg-[#C3C9B9]/30" />

        <section className="flex flex-col gap-4">
          <SectionHeader icon={<ShieldIcon />} title={t('register.section.security')} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PasswordField
              id="register-password"
              name="password"
              labelKey="register.passwordLabel"
              placeholderKey="register.passwordPlaceholder"
              value={form.password}
              onChange={handleChange}
              hintKey="register.passwordHint"
            />
            <PasswordField
              id="register-confirm-password"
              name="confirmPassword"
              labelKey="register.confirmPasswordLabel"
              placeholderKey="register.confirmPasswordPlaceholder"
              value={form.confirmPassword}
              onChange={handleChange}
            />
          </div>
        </section>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 rounded border-[#C3C9B9] text-[#406623] accent-[#406623] focus:ring-[#406623]"
          />
          <span className="font-jakarta text-base text-[#43493C]">
            {t('register.agreeTerms')}
          </span>
        </label>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#C3C9B9]/30 pt-4 sm:flex-row">
          <p className="font-jakarta text-base text-[#73796B]">
            {t('register.haveAccount')}{' '}
            <Link to="/login" className="font-semibold text-[#406623] transition-colors hover:underline">
              {t('register.signIn')}
            </Link>
          </p>
          <button
            id="register-submit-btn"
            type="submit"
            disabled={loading || !agreed}
            className="flex items-center justify-center rounded-full bg-[#406623] px-10 py-3 font-jakarta text-sm font-bold tracking-[0.14px] text-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#34521c] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? '...' : t('register.submit')}
          </button>
        </div>
      </form>
    </div>
  );
}
