import { useState } from 'react';

import type { Account, UpdateAccountPayload } from '../../../entities/account/model/account.types';
import { t } from '../../../shared/lib/i18n/translations';

interface Props {
  account: Account;
  onSubmit: (id: string, payload: UpdateAccountPayload) => Promise<void>;
  onCancel: () => void;
}

export function UpdateAccountForm({ account, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<UpdateAccountPayload>({
    userName: account.userName,
    email: account.email,
    role: account.role ?? '',
    status: account.status ?? '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(account.id, form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">{t('account.editTitle')}</h2>
      <div className="grid grid-cols-2 gap-4">
        <input
          name="userName"
          value={form.userName ?? ''}
          onChange={handleChange}
          placeholder={t('account.userName')}
          className="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <input
          name="email"
          type="email"
          value={form.email ?? ''}
          onChange={handleChange}
          placeholder={t('account.email')}
          className="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <input
          name="role"
          value={form.role ?? ''}
          onChange={handleChange}
          placeholder={t('account.role')}
          className="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <input
          name="status"
          value={form.status ?? ''}
          onChange={handleChange}
          placeholder={t('account.status')}
          className="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
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
