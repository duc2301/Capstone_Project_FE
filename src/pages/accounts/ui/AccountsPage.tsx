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
import { UserAvatar } from '@/shared/components';
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
        <p className="text-[11px] font-bold uppercase tracking-[0.6px] text-text-muted">{label}</p>
        <p className="font-display text-xl font-semibold text-text">{formatCount(value)}</p>
      </div>
    </div>
  );
}

/* ── Modal wrapper ─────────────────────────────────── */
interface ModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ title, description, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Dialog — cao tối đa 88vh, nội dung cuộn bên trong chứ không đẩy dài trang */}
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-3xl animate-scale-in flex-col rounded-3xl bg-card shadow-modal">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-6 border-b border-card-border px-8 py-6">
          <div className="min-w-0 space-y-1">
            <h2 className="heading-page">{title}</h2>
            {description && <p className="text-sm text-text-secondary">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-content-bg hover:text-text"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {/* Body */}
        <div className="admin-scrollbar min-h-0 flex-1 overflow-y-auto px-8 py-6">{children}</div>
      </div>
    </div>
  );
}

/* ── Role badge ────────────────────────────────────
   3 mức quan tâm: Quản trị CDE (role hệ thống), PM (theo dự án), Người dùng. */
function RoleBadge({ account }: { account: Account }) {
  if (isProjectManager(account)) {
    return (
      <div className="space-y-1">
        <span className="inline-flex items-center rounded-[var(--radius-badge)] bg-[#D3EABC] px-2.5 py-0.5 text-[11px] font-bold tracking-[0.4px] text-[#4E623E]">
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
      className={`inline-flex items-center rounded-[var(--radius-badge)] px-2.5 py-0.5 text-[11px] font-bold tracking-[0.4px] ${
        adminBadge ? 'bg-primary/10 text-primary' : 'bg-content-bg text-text-secondary'
      }`}
    >
      {roleLabel(account.role)}
    </span>
  );
}

/* ── User row ──────────────────────────────────────── */
interface UserRowProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

const actionButtonClass =
  'flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150';

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

      {/* Thao tác */}
      <td className="px-6 py-3">
        <div className="flex items-center justify-end gap-2">
          {/* Sửa */}
          <button
            type="button"
            onClick={() => onEdit(account)}
            className={`${actionButtonClass} text-primary hover:bg-primary-light`}
            title={t('account.update')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>

          {/* Xoá */}
          <button
            type="button"
            onClick={() => onDelete(account.id)}
            className={`${actionButtonClass} text-danger hover:bg-danger-light`}
            title={t('account.delete')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ── Pagination ────────────────────────────────────
   Rút gọn kiểu 1 2 3 … 129 để dải số không tràn khi nhiều trang. */
function pageWindow(page: number, pageCount: number): (number | 'gap')[] {
  if (pageCount <= 5) return Array.from({ length: pageCount }, (_, i) => i + 1);

  const items: (number | 'gap')[] = [];
  const from = Math.max(2, Math.min(page - 1, pageCount - 3));
  const to = Math.min(pageCount - 1, Math.max(page + 1, 4));

  items.push(1);
  if (from > 2) items.push('gap');
  for (let p = from; p <= to; p += 1) items.push(p);
  if (to < pageCount - 1) items.push('gap');
  items.push(pageCount);

  return items;
}

interface PaginationProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}

function Pagination({ page, pageCount, onChange }: PaginationProps) {
  const arrowClass =
    'flex h-9 w-9 items-center justify-center rounded-full border border-card-border text-text-muted transition-colors hover:bg-content-bg hover:text-text disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <nav className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label={t('account.pagination.prev')}
        className={arrowClass}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {pageWindow(page, pageCount).map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} className="px-1 text-sm text-text-muted">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? 'page' : undefined}
            className={`flex h-9 min-w-9 items-center justify-center rounded-full px-2.5 text-sm font-semibold transition-colors ${
              item === page
                ? 'bg-primary text-white shadow-sm'
                : 'border border-card-border text-text-secondary hover:bg-content-bg'
            }`}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        aria-label={t('account.pagination.next')}
        className={arrowClass}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </nav>
  );
}

/* ── Main page ─────────────────────────────────────── */
export function AccountsPage() {
  const { accounts, loading, error, createAccount, updateAccount, deleteAccount } = useAccounts();

  const [formMode, setFormMode] = useState<FormMode>('idle');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  /* ── Handlers ────────────────────────────────────── */
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

  /* Đổi từ khoá thì về trang 1, nếu không sẽ đứng ở trang trống. */
  const changeSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  /* ── Lọc theo từ khoá ────────────────────────────── */
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

  /* ── Phân trang (BE trả toàn bộ danh sách nên cắt ở FE) ── */
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  /* ── Số liệu thống kê ────────────────────────────── */
  const stats = useMemo(() => ({
    total: accounts.length,
    active: accounts.filter((a) => a.status === 'Active').length,
    pending: accounts.filter((a) => a.status === 'PendingVerification').length,
    admin: accounts.filter((a) => a.role === 'Admin').length,
  }), [accounts]);

  return (
    // AdminLayout đã cho h-screen + overflow-hidden; h-full ở đây để trang không dài ra
    // theo dữ liệu — bảng tự cuộn bên trong khung cố định.
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
                <tr className="border-b border-card-border/60 bg-content-bg">
                  <th className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-[1px] text-text-muted">
                    {t('account.column.user')}
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-[1px] text-text-muted">
                    {t('account.column.organization')}
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-[1px] text-text-muted">
                    {t('account.role')}
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-[1px] text-text-muted">
                    {t('account.status')}
                  </th>
                  <th className="px-6 py-3.5 text-right text-[11px] font-bold uppercase tracking-[1px] text-text-muted">
                    {t('account.actions')}
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
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Footer: tóm tắt + phân trang ─────────── */}
          {filtered.length > 0 && (
            <div className="flex shrink-0 flex-col items-center justify-between gap-4 border-t border-card-border/60 px-6 py-3.5 sm:flex-row">
              <p className="text-xs text-text-muted">
                {t('account.pagination.showing')}{' '}
                <strong className="font-semibold text-text-secondary">
                  {formatCount(pageStart + 1)} – {formatCount(pageStart + pageItems.length)}
                </strong>{' '}
                {t('account.pagination.of')}{' '}
                <strong className="font-semibold text-text-secondary">{formatCount(filtered.length)}</strong>{' '}
                {t('account.pagination.members')}
              </p>
              <Pagination page={currentPage} pageCount={pageCount} onChange={setPage} />
            </div>
          )}
        </div>
      )}

      {/* ── Create Modal ───────────────────────────── */}
      {formMode === 'create' && (
        <Modal
          title={t('account.modal.createTitle')}
          description={t('account.modal.createDescription')}
          onClose={closeForm}
        >
          <CreateAccountForm onSubmit={handleCreate} onCancel={closeForm} />
        </Modal>
      )}

      {/* ── Edit Modal ─────────────────────────────── */}
      {formMode === 'edit' && selectedAccount && (
        <Modal
          title={t('account.modal.editTitle')}
          description={t('account.modal.editDescription')}
          onClose={closeForm}
        >
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
