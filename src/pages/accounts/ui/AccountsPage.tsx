import { useMemo, useState } from 'react';

import type { Account } from '@/entities/account';
import { CreateAccountForm, UpdateAccountForm, useAccounts } from '@/features/accounts';
import { t } from '@/shared/lib/i18n';

type FormMode = 'idle' | 'create' | 'edit';

/* ── Stat card ─────────────────────────────────────── */
interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
  bgColor: string;
}

function StatCard({ icon, value, label, color, bgColor }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-card)] border border-card-border bg-card p-5 shadow-card transition-shadow duration-200 hover:shadow-card-hover">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: bgColor, color }}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-text" style={{ color }}>{value}</p>
        <p className="text-xs font-medium text-text-muted">{label}</p>
      </div>
    </div>
  );
}

/* ── Modal wrapper ─────────────────────────────────── */
interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Dialog */}
      <div className="relative z-10 w-full max-w-2xl animate-scale-in rounded-[var(--radius-card-lg)] bg-card shadow-modal">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-card-border px-7 py-5">
          <h2 className="font-heading text-lg font-bold text-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-content-bg hover:text-text"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {/* Body */}
        <div className="px-7 py-6">{children}</div>
      </div>
    </div>
  );
}

/* ── Status badge ──────────────────────────────────── */
function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-text-muted">—</span>;

  const lower = status.toLowerCase();
  let classes = 'bg-gray-100 text-gray-600';
  if (lower.includes('activ') || lower === 'hoạt động') {
    classes = 'bg-success-light text-success';
  } else if (lower.includes('pending') || lower.includes('chờ')) {
    classes = 'bg-warning-light text-warning';
  } else if (lower.includes('inactiv') || lower.includes('không')) {
    classes = 'bg-danger-light text-danger';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-[var(--radius-badge)] px-2.5 py-1 text-xs font-semibold ${classes}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

/* ── Main page ─────────────────────────────────────── */
export function AccountsPage() {
  const { accounts, loading, error, createAccount, updateAccount, deleteAccount } = useAccounts();

  const [formMode, setFormMode] = useState<FormMode>('idle');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  /* ── Handlers (unchanged logic) ──────────────────── */
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

  /* ── Filtered accounts ───────────────────────────── */
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return accounts;
    const q = searchQuery.toLowerCase();
    return accounts.filter(
      (a) =>
        a.userName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.role ?? '').toLowerCase().includes(q),
    );
  }, [accounts, searchQuery]);

  /* ── Stats ───────────────────────────────────────── */
  const stats = useMemo(() => {
    const total = accounts.length;
    const active = accounts.filter((a) => a.status?.toLowerCase().includes('activ') || a.status === 'Hoạt động').length;
    const inactive = accounts.filter((a) => a.status?.toLowerCase().includes('inactiv') || a.status === 'Không hoạt động').length;
    const admin = accounts.filter((a) => a.role?.toLowerCase().includes('admin')).length;
    return { total, active, inactive: inactive || total - active, admin };
  }, [accounts]);

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text lg:text-3xl">
            {t('account.title')}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {t('account.description')}
          </p>
        </div>
        <button
          onClick={() => setFormMode('create')}
          className="flex shrink-0 items-center gap-2 rounded-[var(--radius-button)] bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-primary-hover hover:shadow-md"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t('account.createNew')}
        </button>
      </div>

      {/* ── Statistics Cards ───────────────────────── */}
      {!loading && !error && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
            value={stats.total}
            label={t('account.stats.total')}
            color="#406623"
            bgColor="#E8F0E0"
          />
          <StatCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
            value={stats.active}
            label={t('account.stats.active')}
            color="#2E7D32"
            bgColor="#E6F4EA"
          />
          <StatCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
            value={stats.inactive}
            label={t('account.stats.inactive')}
            color="#DC2626"
            bgColor="#FEE2E2"
          />
          <StatCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
            value={stats.admin}
            label={t('account.stats.admin')}
            color="#1976D2"
            bgColor="#E3F2FD"
          />
        </div>
      )}

      {/* ── Search Bar ─────────────────────────────── */}
      {!loading && !error && (
        <div className="rounded-[var(--radius-card)] border border-card-border bg-card p-4 shadow-card">
          <div className="flex items-center gap-3 rounded-[var(--radius-input)] border border-input-border bg-input-bg px-4 py-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-text-muted">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('account.search')}
              className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-placeholder"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="shrink-0 text-text-muted hover:text-text"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Loading ────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center rounded-[var(--radius-card)] border border-card-border bg-card py-20 shadow-card">
          <div className="flex flex-col items-center gap-3">
            <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-text-muted">{t('common.loading')}</p>
          </div>
        </div>
      )}

      {/* ── Error ──────────────────────────────────── */}
      {error && (
        <div className="rounded-[var(--radius-card)] border border-danger/20 bg-danger-light p-6 text-center">
          <p className="text-sm font-medium text-danger">{error}</p>
        </div>
      )}

      {/* ── Data Table ─────────────────────────────── */}
      {!loading && !error && (
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-card-border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-input-bg">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-text-muted">
                    {t('account.userName')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-text-muted">
                    {t('account.email')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-text-muted">
                    {t('account.role')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-text-muted">
                    {t('account.status')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-text-muted">
                    {t('account.createdAt')}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-text-muted">
                    {t('account.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-text-placeholder">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <line x1="17" y1="11" x2="23" y2="11" />
                        </svg>
                        <p className="text-sm text-text-muted">
                          {searchQuery ? t('account.noResults') : t('common.noData')}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((acc) => (
                    <tr
                      key={acc.id}
                      className="transition-colors duration-150 hover:bg-primary-ghost"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                            {acc.userName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-text">{acc.userName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-muted">{acc.email}</td>
                      <td className="px-6 py-4">
                        {acc.role ? (
                          <span className="inline-block rounded-lg bg-input-bg px-2.5 py-1 text-xs font-medium text-text-secondary">
                            {acc.role}
                          </span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={acc.status} />
                      </td>
                      <td className="px-6 py-4 text-text-muted">
                        {acc.createdAt
                          ? new Date(acc.createdAt).toLocaleDateString('vi-VN')
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit */}
                          <button
                            onClick={() => openEdit(acc)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-all duration-150 hover:bg-primary-light hover:text-primary"
                            title={t('account.update')}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(acc.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-all duration-150 hover:bg-danger-light hover:text-danger"
                            title={t('account.delete')}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Create Modal ───────────────────────────── */}
      {formMode === 'create' && (
        <Modal title={t('account.modal.createTitle')} onClose={closeForm}>
          <CreateAccountForm onSubmit={handleCreate} onCancel={closeForm} />
        </Modal>
      )}

      {/* ── Edit Modal ─────────────────────────────── */}
      {formMode === 'edit' && selectedAccount && (
        <Modal title={t('account.modal.editTitle')} onClose={closeForm}>
          <UpdateAccountForm
            account={selectedAccount}
            onSubmit={handleUpdate}
            onCancel={closeForm}
          />
        </Modal>
      )}
    </div>
  );
}
