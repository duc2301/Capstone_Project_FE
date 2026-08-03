import { useMemo, useState } from 'react';

import type { Account } from '@/entities/account';
import {
  CreateAccountForm,
  isAdmin,
  isProjectManager,
  managedProjectsLabel,
  roleLabel,
  statusMeta,
  UpdateAccountForm,
  useAccounts,
} from '@/features/accounts';
import { getApiErrorMessage } from '@/shared/api';
import { ActionIconButton, ConfirmDialog, DeleteIcon, EditIcon, Modal, PaginationBar, RowActions, Toast, UserAvatar, useToast } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

type FormMode = 'idle' | 'create' | 'edit';

const PAGE_SIZE = 10;
const EMPTY_CELL = '—';

const formatCount = (value: number) => value.toLocaleString('vi-VN');

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
    <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-card-border bg-card p-4 shadow-card transition-shadow duration-200 hover:shadow-card-hover">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: bgColor, color }}
      >
        {icon}
      </div>
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs font-bold uppercase tracking-[0.6px] text-text-muted">{label}</p>
        <p className="font-display text-xl font-semibold text-text">{formatCount(value)}</p>
      </div>
    </div>
  );
}

function RoleBadge({ account }: { account: Account }) {
  if (isProjectManager(account)) {
    return (
      <div className="space-y-1">
        <span className="inline-flex items-center rounded-[var(--radius-badge)] bg-primary-tint px-2.5 py-0.5 text-xs font-bold tracking-[0.4px] text-primary-deep">
          {t('account.role.pm')}
        </span>
        <p className="truncate text-xs text-text-muted" title={managedProjectsLabel(account)}>
          {managedProjectsLabel(account)}
        </p>
      </div>
    );
  }

  const adminBadge = isAdmin(account);
  return (
    <span
      className={`inline-flex items-center rounded-[var(--radius-badge)] px-2.5 py-0.5 text-xs font-bold tracking-[0.4px] ${
        adminBadge ? 'bg-primary/10 text-primary' : 'bg-content-bg text-text-secondary'
      }`}
    >
      {roleLabel(account.role)}
    </span>
  );
}

interface UserRowProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

function UserRow({ account, onEdit, onDelete }: UserRowProps) {
  const status = statusMeta(account.status);

  return (
    <tr className="border-t border-card-border/60 transition-colors duration-150 hover:bg-primary-ghost">
      {/* Người dùng */}
      <td className="px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <UserAvatar
              userName={account.userName}
              avatarUrl={account.avatarUrl}
              className="ring-[3px] ring-primary/10"
            />
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${status.dotClass}`}
              title={status.label}
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text">{account.userName}</p>
            <p className="truncate text-xs text-text-muted">{account.email}</p>
          </div>
        </div>
      </td>

      {/* Doanh nghiệp / Công ty */}
      <td className="px-5 py-3">
        <span className="text-sm text-text-secondary">
          {account.organizationName ?? <span className="text-text-placeholder">{EMPTY_CELL}</span>}
        </span>
      </td>

      {/* Vai trò */}
      <td className="px-5 py-3">
        <RoleBadge account={account} />
      </td>

      {/* Trạng thái */}
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${status.dotClass}`} />
          <span className={`text-xs font-medium ${status.textClass}`}>{status.label}</span>
        </div>
      </td>

      <td className="px-6 py-3">
        <RowActions>
          <ActionIconButton
            label={t('account.update')}
            tone="primary"
            icon={<EditIcon />}
            onClick={() => onEdit(account)}
          />
          <ActionIconButton
            label={t('account.delete')}
            tone="danger"
            icon={<DeleteIcon />}
            onClick={() => onDelete(account.id)}
          />
        </RowActions>
      </td>
    </tr>
  );
}

/* ── Main page ─────────────────────────────────────── */
export function AccountsPage() {
  const { accounts, loading, error, createAccount, updateAccount, deleteAccount } = useAccounts();

  const [formMode, setFormMode] = useState<FormMode>('idle');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const handleCreate = async (payload: Parameters<typeof createAccount>[0], avatar: File | null) => {
    await createAccount(payload, avatar);
    setFormMode('idle');
  };

  const handleUpdate = async (
    id: string,
    payload: Parameters<typeof updateAccount>[1],
    avatar: File | null,
  ) => {
    await updateAccount(id, payload, avatar);
    setFormMode('idle');
    setSelectedAccount(null);
  };

  const { toast, showToast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAccount(deleteTarget);
      setDeleteTarget(null);
    } catch (err) {
      showToast(getApiErrorMessage(err, t('account.deleteError')), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (account: Account) => {
    setSelectedAccount(account);
    setFormMode('edit');
  };

  const closeForm = () => {
    setFormMode('idle');
    setSelectedAccount(null);
  };

  const changeSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        a.userName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        roleLabel(a.role).toLowerCase().includes(q) ||
        (a.role ?? '').toLowerCase().includes(q) ||
        (a.organizationName ?? '').toLowerCase().includes(q),
    );
  }, [accounts, searchQuery]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const stats = useMemo(() => ({
    total: accounts.length,
    active: accounts.filter((a) => a.status === 'Active').length,
    pending: accounts.filter((a) => a.status === 'PendingVerification').length,
    admin: accounts.filter((a) => a.role === 'Admin').length,
  }), [accounts]);

  return (
    <div className="flex h-full flex-col gap-5">
      {/* ── Page Header ────────────────────────────── */}
      <h1 className="heading-page shrink-0">{t('account.title')}</h1>

      {/* ── Statistics Cards ───────────────────────── */}
      {!loading && !error && (
        <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
            value={stats.total}
            label={t('account.stats.total')}
            color="#406623"
            bgColor="#F0F5EB"
          />
          <StatCard
            icon={<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
            value={stats.active}
            label={t('account.stats.active')}
            color="#4E623E"
            bgColor="#D3EABC"
          />
          <StatCard
            icon={<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 1 4 1 4-1 4-1"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>}
            value={stats.pending}
            label={t('account.stats.pending')}
            color="#8A5100"
            bgColor="#FDF0DC"
          />
          <StatCard
            icon={<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="11" r="2"/><path d="M12 13v3"/></svg>}
            value={stats.admin}
            label={t('account.stats.admin')}
            color="#43493C"
            bgColor="#EAE8E0"
          />
        </div>
      )}

      {/* ── Toolbar ────────────────────────────────── */}
      {!loading && !error && (
        <div className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-[420px]">
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => changeSearch(e.target.value)}
              placeholder={t('account.search')}
              className="w-full rounded-[var(--radius-input)] border border-card-border bg-card py-2.5 pl-11 pr-10 text-sm text-text shadow-card outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => changeSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setFormMode('create')}
            className="flex shrink-0 items-center justify-center gap-2.5 rounded-[var(--radius-input)] bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-[0_6px_10px_-3px_rgba(64,102,35,0.25)] transition-all duration-200 hover:bg-primary-hover"
          >
            <svg width="18" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            {t('account.createNew')}
          </button>
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
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-card-lg)] border border-card-border bg-card shadow-card-hover">
          <div className="admin-scrollbar min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[780px] text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="table-head bg-content-bg">
                  <th className="px-6 py-3.5">
                    {t('account.column.user')}
                  </th>
                  <th className="px-5 py-3.5">
                    {t('account.column.organization')}
                  </th>
                  <th className="px-5 py-3.5">
                    {t('account.role')}
                  </th>
                  <th className="px-5 py-3.5">
                    {t('account.status')}
                  </th>
                  <th className="px-6 py-3.5 text-right">
                    {t('common.col.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
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
                  pageItems.map((account) => (
                    <UserRow
                      key={account.id}
                      account={account}
                      onEdit={openEdit}
                      onDelete={setDeleteTarget}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Footer: tóm tắt + phân trang ─────────── */}
          <PaginationBar
            page={currentPage}
            pageCount={pageCount}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            unit={t('account.pagination.members')}
            variant="inline"
            onChange={setPage}
          />
        </div>
      )}

      {/* ── Create Modal ───────────────────────────── */}
      {formMode === 'create' && (
        <Modal title={t('account.modal.createTitle')} onClose={closeForm} maxWidth="max-w-3xl">
          <CreateAccountForm onSubmit={handleCreate} onCancel={closeForm} />
        </Modal>
      )}

      {/* ── Edit Modal ─────────────────────────────── */}
      {formMode === 'edit' && selectedAccount && (
        <Modal title={t('account.modal.editTitle')} onClose={closeForm} maxWidth="max-w-3xl">
          <UpdateAccountForm
            account={selectedAccount}
            onSubmit={handleUpdate}
            onCancel={closeForm}
          />
        </Modal>
      )}

      <Toast toast={toast} className="z-[80]" />

      {deleteTarget && (
        <ConfirmDialog
          title={t('account.delete')}
          message={t('account.deleteConfirm')}
          confirmLabel={t('account.delete')}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
