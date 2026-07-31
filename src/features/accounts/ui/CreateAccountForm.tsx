import { useState } from 'react';

import type { CreateAccountPayload } from '@/entities/account';
import { t } from '@/shared/lib/i18n';

interface Props {
  onSubmit: (payload: CreateAccountPayload) => Promise<void>;
  onCancel: () => void;
}

export function CreateAccountForm({ onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<CreateAccountPayload>({
    userName: '',
    email: '',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* User Name */}
        <div className="space-y-1.5">
          <label htmlFor="create-userName" className="block text-sm font-medium text-text-secondary">
            {t('account.userName')}
          </label>
          <input
            id="create-userName"
            name="userName"
            value={form.userName}
            onChange={handleChange}
            placeholder={t('account.userName')}
            required
            className="w-full rounded-[var(--radius-input)] border border-input-border bg-input-bg px-4 py-3 text-sm text-text outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="create-email" className="block text-sm font-medium text-text-secondary">
            {t('account.email')}
          </label>
          <input
            id="create-email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder={t('account.email')}
            required
            className="w-full rounded-[var(--radius-input)] border border-input-border bg-input-bg px-4 py-3 text-sm text-text outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="create-password" className="block text-sm font-medium text-text-secondary">
            {t('account.password')}
          </label>
          <input
            id="create-password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder={t('account.password')}
            required
            className="w-full rounded-[var(--radius-input)] border border-input-border bg-input-bg px-4 py-3 text-sm text-text outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-card-border pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[var(--radius-button)] border border-card-border bg-card px-6 py-2.5 text-sm font-semibold text-text-secondary transition-all duration-200 hover:bg-content-bg hover:border-text-muted"
        >
          {t('account.cancel')}
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-[var(--radius-button)] bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t('account.save')}
            </span>
          ) : (
            t('account.save')
          )}
        </button>
      </div>
    </form>
  );
}
