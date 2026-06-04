import { useMemo, useState } from 'react';

import type { Organization } from '@/entities/organization';
import {
  CreateOrganizationForm,
  UpdateOrganizationForm,
  useOrganizations,
  useOrganizationTypes,
} from '@/features/organizations';
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] animate-scale-in overflow-y-auto rounded-[var(--radius-card-lg)] bg-card shadow-modal">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-card-border bg-card px-7 py-5">
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
        <div className="px-7 py-6">{children}</div>
      </div>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────── */
export function OrganizationsPage() {
  const { organizations, loading, error, createOrganization, updateOrganization, deleteOrganization } = useOrganizations();
  const { orgTypes } = useOrganizationTypes();

  const [formMode, setFormMode] = useState<FormMode>('idle');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  /* ── Handlers ────────────────────────────────────── */
  const handleCreate = async (payload: Parameters<typeof createOrganization>[0]) => {
    await createOrganization(payload);
    setFormMode('idle');
  };

  const handleUpdate = async (id: string, payload: Parameters<typeof updateOrganization>[1]) => {
    await updateOrganization(id, payload);
    setFormMode('idle');
    setSelectedOrg(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('org.deleteConfirm'))) return;
    await deleteOrganization(id);
  };

  const openEdit = (org: Organization) => {
    setSelectedOrg(org);
    setFormMode('edit');
  };

  const closeForm = () => {
    setFormMode('idle');
    setSelectedOrg(null);
  };

  /* ── Helpers ─────────────────────────────────────── */
  const orgTypeMap = useMemo(() => {
    const map = new Map<string, string>();
    orgTypes.forEach((ot) => map.set(ot.id, ot.name));
    return map;
  }, [orgTypes]);

  /* ── Filtered organizations ──────────────────────── */
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return organizations;
    const q = searchQuery.toLowerCase();
    return organizations.filter(
      (o) =>
        o.legalName.toLowerCase().includes(q) ||
        (o.displayName ?? '').toLowerCase().includes(q) ||
        o.taxCode.toLowerCase().includes(q) ||
        (o.email ?? '').toLowerCase().includes(q),
    );
  }, [organizations, searchQuery]);

  /* ── Stats ───────────────────────────────────────── */
  const stats = useMemo(() => {
    const total = organizations.length;
    const uniqueTypes = new Set(organizations.map((o) => o.organizationTypeId)).size;
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const recent = organizations.filter((o) => o.createdAt && now - new Date(o.createdAt).getTime() < thirtyDays).length;
    return { total, active: total, uniqueTypes, recent };
  }, [organizations]);

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text lg:text-3xl">
            {t('org.title')}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {t('org.description')}
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
          {t('org.createNew')}
        </button>
      </div>

      {/* ── Statistics Cards ───────────────────────── */}
      {!loading && !error && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h1"/><path d="M9 13h1"/><path d="M9 17h1"/></svg>}
            value={stats.total}
            label={t('org.stats.total')}
            color="#406623"
            bgColor="#E8F0E0"
          />
          <StatCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
            value={stats.active}
            label={t('org.stats.active')}
            color="#2E7D32"
            bgColor="#E6F4EA"
          />
          <StatCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>}
            value={stats.uniqueTypes}
            label={t('org.stats.byType')}
            color="#1976D2"
            bgColor="#E3F2FD"
          />
          <StatCard
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
            value={stats.recent}
            label={t('org.stats.recent')}
            color="#F59E0B"
            bgColor="#FEF3C7"
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
              placeholder={t('org.search')}
              className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-placeholder"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="shrink-0 text-text-muted hover:text-text">
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
                    {t('org.col.taxCode')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-text-muted">
                    {t('org.col.name')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-text-muted">
                    {t('org.col.type')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-text-muted">
                    {t('org.col.contact')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-text-muted">
                    {t('org.col.createdAt')}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-text-muted">
                    {t('org.col.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-text-placeholder">
                          <path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/>
                        </svg>
                        <p className="text-sm text-text-muted">
                          {searchQuery ? t('org.noResults') : t('common.noData')}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((org) => (
                    <tr key={org.id} className="transition-colors duration-150 hover:bg-primary-ghost">
                      <td className="px-6 py-4">
                        <span className="inline-block rounded-lg bg-input-bg px-2.5 py-1 font-mono text-xs font-medium text-text-secondary">
                          {org.taxCode}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                            {org.legalName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-text">{org.displayName ?? org.legalName}</p>
                            {org.displayName && (
                              <p className="text-xs text-text-muted">{org.legalName}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-badge)] bg-info-light px-2.5 py-1 text-xs font-semibold text-info">
                          {orgTypeMap.get(org.organizationTypeId) ?? '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          {org.email && <p className="text-xs text-text-muted">{org.email}</p>}
                          {org.phone && <p className="text-xs text-text-muted">{org.phone}</p>}
                          {!org.email && !org.phone && <span className="text-text-muted">—</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-muted">
                        {org.createdAt ? new Date(org.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(org)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-all duration-150 hover:bg-primary-light hover:text-primary"
                            title="Chỉnh sửa"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(org.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-all duration-150 hover:bg-danger-light hover:text-danger"
                            title="Xóa"
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
        <Modal title={t('org.modal.createTitle')} onClose={closeForm}>
          <CreateOrganizationForm orgTypes={orgTypes} onSubmit={handleCreate} onCancel={closeForm} />
        </Modal>
      )}

      {/* ── Edit Modal ─────────────────────────────── */}
      {formMode === 'edit' && selectedOrg && (
        <Modal title={t('org.modal.editTitle')} onClose={closeForm}>
          <UpdateOrganizationForm
            organization={selectedOrg}
            orgTypes={orgTypes}
            onSubmit={handleUpdate}
            onCancel={closeForm}
          />
        </Modal>
      )}
    </div>
  );
}
