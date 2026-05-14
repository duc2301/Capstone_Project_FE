import { useState } from 'react';

import type { CreateAccountPayload } from '../../../entities/account/model/account.types';
import { t } from '../../../shared/lib/i18n/translations';

interface Props {
  onSubmit: (payload: CreateAccountPayload) => Promise<void>;
  onCancel: () => void;
}

export function CreateAccountForm({ onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<CreateAccountPayload>({
    userName: '',
    email: '',
    password: '',
    role: '',
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
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">{t('account.createNew')}</h2>
      <div className="grid grid-cols-2 gap-4">
        <input
          name="userName"
          value={form.userName}
          onChange={handleChange}
          placeholder={t('account.userName')}
          required
          className="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder={t('account.email')}
          required
          className="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder={t('account.password')}
          required
          className="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="role"
          value={form.role}
          onChange={handleChange}
          placeholder={t('account.role')}
          className="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {t('account.save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition-colors"
        >
          {t('account.cancel')}
        </button>
      </div>
    </form>
  );
}
