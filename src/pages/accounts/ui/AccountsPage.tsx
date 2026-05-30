import { useState } from 'react';

import type { Account } from '@/entities/account';
import { CreateAccountForm, UpdateAccountForm, useAccounts } from '@/features/accounts';
import { t } from '@/shared/lib/i18n';

type FormMode = 'idle' | 'create' | 'edit';

export function AccountsPage() {
  const { accounts, loading, error, createAccount, updateAccount, deleteAccount } = useAccounts();

  const [formMode, setFormMode] = useState<FormMode>('idle');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const handleCreate = async (payload: Parameters<typeof createAccount>[0]) => {
    await createAccount(payload);
    setFormMode('idle');
  };

  const handleUpdate = async (id: string, payload: Parameters<typeof updateAccount>[1]) => {
    await updateAccount(id, payload);
    setFormMode('idle');
    setSelectedAccount(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('account.deleteConfirm'))) return;
    await deleteAccount(id);
  };

  const openEdit = (account: Account) => {
    setSelectedAccount(account);
    setFormMode('edit');
  };

  const closeForm = () => {
    setFormMode('idle');
    setSelectedAccount(null);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('account.title')}</h1>
        {formMode === 'idle' && (
          <button
            onClick={() => setFormMode('create')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            {t('account.createNew')}
          </button>
        )}
      </div>

      {formMode === 'create' && (
        <CreateAccountForm onSubmit={handleCreate} onCancel={closeForm} />
      )}

      {formMode === 'edit' && selectedAccount && (
        <UpdateAccountForm
          account={selectedAccount}
          onSubmit={handleUpdate}
          onCancel={closeForm}
        />
      )}

      {loading && (
        <p className="text-gray-500 py-8 text-center">{t('common.loading')}</p>
      )}

      {error && (
        <p className="text-red-500 py-4 text-center">{error}</p>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="w-full bg-white text-sm">
            <thead className="bg-gray-100 text-left text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">{t('account.userName')}</th>
                <th className="px-4 py-3">{t('account.email')}</th>
                <th className="px-4 py-3">{t('account.role')}</th>
                <th className="px-4 py-3">{t('account.status')}</th>
                <th className="px-4 py-3">{t('account.createdAt')}</th>
                <th className="px-4 py-3">{t('account.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => (
                  <tr key={acc.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{acc.userName}</td>
                    <td className="px-4 py-3 text-gray-600">{acc.email}</td>
                    <td className="px-4 py-3 text-gray-600">{acc.role ?? '-'}</td>
                    <td className="px-4 py-3">
                      {acc.status ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                          {acc.status}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {acc.createdAt
                        ? new Date(acc.createdAt).toLocaleDateString('vi-VN')
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => openEdit(acc)}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {t('account.update')}
                        </button>
                        <button
                          onClick={() => handleDelete(acc.id)}
                          className="text-red-500 hover:underline text-sm"
                        >
                          {t('account.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
