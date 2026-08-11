import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { accountApi } from '@/entities/account';
import type { Organization } from '@/entities/organization';
import {
  CreateOrganizationForm,
  UpdateOrganizationForm,
  useOrganizations,
  useOrganizationTypes,
} from '@/features/organizations';
import { getApiErrorMessage } from '@/shared/api';
import {
  ActionIconButton,
  ConfirmDialog,
  DeleteIcon,
  EditIcon,
  ListErrorCard,
  ListLoadingCard,
  ListTable,
  Modal,
  PaginationBar,
  RowActions,
  SearchField,
  Toast,
  ToolbarIconButton,
  useToast,
} from '@/shared/components';
import type { ListTableColumn } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

type FormMode = 'idle' | 'create' | 'create-jv' | 'edit';

const PAGE_SIZE = 10;

const ORGANIZATION_COLUMNS: ListTableColumn[] = [
  { key: 'name', label: t('org.col.name') },
  { key: 'taxCode', label: t('org.col.taxCode'), width: 'w-[170px]' },
  { key: 'type', label: t('org.type'), width: 'w-[22%]' },
  { key: 'projects', label: t('org.col.projects'), width: 'w-[110px]' },
  { key: 'actions', label: t('common.col.actions'), width: 'w-[120px]', align: 'right' },
];

/* ── Main page ─────────────────────────────────────── */
export function OrganizationsPage() {
  const navigate = useNavigate();
  const { organizations, loading, error, createOrganization, updateOrganization, deleteOrganization } = useOrganizations();
  const { orgTypes, createOrgType } = useOrganizationTypes();

  const [formMode, setFormMode] = useState<FormMode>('idle');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const { toast, showToast } = useToast();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const changeSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  /* ── Handlers ────────────────────────────────────── */
  const handleCreate = async (payload: Parameters<typeof createOrganization>[0], selectedAccountIds?: string[]) => {
    const newOrg = await createOrganization(payload);
    if (newOrg && selectedAccountIds?.length) {
      await Promise.all(selectedAccountIds.map((accountId) => accountApi.update(accountId, { organizationId: newOrg.id })));
    }
    setFormMode('idle');
  };

  const handleUpdate = async (
    id: string,
    payload: Parameters<typeof updateOrganization>[1],
    selectedAccountIds?: string[],
    initialAccountIds?: string[],
  ) => {
    await updateOrganization(id, payload);

    if (selectedAccountIds && initialAccountIds) {
      const added = selectedAccountIds.filter((accountId) => !initialAccountIds.includes(accountId));
      const removed = initialAccountIds.filter((accountId) => !selectedAccountIds.includes(accountId));
      await Promise.all([
        ...added.map((accountId) => accountApi.update(accountId, { organizationId: id })),
        ...removed.map((accountId) => accountApi.update(accountId, { clearOrganization: true })),
      ]);
    }

    setFormMode('idle');
    setSelectedOrg(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteOrganization(deleteTarget);
      setDeleteTarget(null);
    } catch (err) {
      showToast(getApiErrorMessage(err, t('org.deleteError')), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (org: Organization) => {
    setSelectedOrg(org);
    setFormMode('edit');
  };

  const closeForm = () => {
    setFormMode('idle');
    setSelectedOrg(null);
  };

  /* ── Filtered organizations ──────────────────────── */
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return organizations;
    return organizations.filter(
      (o) =>
        o.legalName.toLowerCase().includes(q)
        || (o.displayName ?? '').toLowerCase().includes(q)
        || o.taxCode.toLowerCase().includes(q)
        || (o.email ?? '').toLowerCase().includes(q),
    );
  }, [organizations, searchQuery]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const orgTypeName = (organizationTypeId: string) =>
    orgTypes.find((ot) => ot.id === organizationTypeId)?.name ?? t('org.typeOther');

  const initialsOf = (org: Organization) => {
    const raw = (org.displayName || org.legalName || '').trim();
    const words = raw.split(/\s+/).filter(Boolean);
    if (words.length === 0) return '?';
    return (words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2)).toUpperCase();
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      {/* ── Page Header ────────────────────────────── */}
      <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="heading-page">{t('org.title')}</h1>
        <div className="flex shrink-0 items-center gap-3">
          <ToolbarIconButton
            showLabel
            label={t('org.createJv')}
            onClick={() => setFormMode('create-jv')}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />
          <button
            type="button"
            onClick={() => setFormMode('create')}
            className="flex items-center gap-2 rounded-[var(--radius-button)] bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t('org.createNew')}
          </button>
        </div>
      </div>

      {/* ── Toolbar ────────────────────────────────── */}
      {!loading && !error && (
        <div className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <SearchField
            value={searchQuery}
            onChange={changeSearch}
            placeholder={t('org.search')}
            className="w-full lg:max-w-[420px]"
          />
        </div>
      )}

      {/* ── Loading ────────────────────────────────── */}
      {loading && (
        <ListLoadingCard />
      )}

      {/* ── Error ──────────────────────────────────── */}
      {error && (
        <ListErrorCard message={error} />
      )}

      {/* ── Data Table ─────────────────────────────── */}
      {!loading && !error && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-card-lg)] border border-card-border bg-card shadow-card-hover">
          <div className="admin-scrollbar min-h-0 flex-1 overflow-auto">
            <ListTable columns={ORGANIZATION_COLUMNS} minWidth="min-w-[780px]">
              <tbody className="divide-y divide-card-border">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-sm text-text-muted">
                      {searchQuery ? t('org.noResults') : t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  paged.map((org) => (
                    <tr
                      key={org.id}
                      onClick={() => navigate(`/organizations/${org.id}`)}
                      className="cursor-pointer transition-colors duration-150 hover:bg-content-bg"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-card-border bg-input-bg text-xs font-bold text-primary">
                            {initialsOf(org)}
                          </span>
                          <div className="min-w-0">
                            <p className="cell-wrap font-semibold text-text">{org.displayName || org.legalName}</p>
                            {org.isJointVenture && (
                              <span className="mt-0.5 inline-flex items-center rounded-full bg-info-light px-2 py-0.5 text-2xs font-bold text-info">
                                {t('org.jointVenture')}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-block rounded-[var(--radius-button)] bg-input-bg px-2.5 py-1 font-mono text-xs font-medium text-text-secondary">
                          {org.taxCode || '—'}
                        </span>
                      </td>
                      <td className="cell-wrap px-5 py-4 text-text-secondary">{orgTypeName(org.organizationTypeId)}</td>
                      <td className="px-5 py-4 text-text-secondary">{org.participatingProjectsCount ?? 0}</td>
                      <td className="px-5 py-4">
                        <RowActions>
                          <ActionIconButton
                            tone="primary"
                            label={t('org.edit')}
                            icon={<EditIcon />}
                            onClick={(e) => { e.stopPropagation(); openEdit(org); }}
                          />
                          <ActionIconButton
                            tone="danger"
                            label={t('org.delete')}
                            icon={<DeleteIcon />}
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(org.id); }}
                          />
                        </RowActions>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </ListTable>
          </div>

          <PaginationBar
            page={currentPage}
            pageCount={pageCount}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            unit={t('org.paginationUnit')}
            variant="inline"
            onChange={setPage}
          />
        </div>
      )}

      {/* ── Create Modal ───────────────────────────── */}
      {formMode === 'create' && (
        <Modal title={t('org.modal.createTitle')} onClose={closeForm} flush>
          <CreateOrganizationForm mode="organization" orgTypes={orgTypes} organizations={organizations} onSubmit={handleCreate} onCancel={closeForm} onCreateOrgType={createOrgType} />
        </Modal>
      )}

      {/* ── Create Joint Venture Modal ─────────────── */}
      {formMode === 'create-jv' && (
        <Modal title={t('org.modal.createJvTitle')} onClose={closeForm} flush>
          <CreateOrganizationForm mode="joint-venture" orgTypes={orgTypes} organizations={organizations} onSubmit={handleCreate} onCancel={closeForm} onCreateOrgType={createOrgType} />
        </Modal>
      )}

      {/* ── Edit Modal ─────────────────────────────── */}
      {formMode === 'edit' && selectedOrg && (
        <Modal title={t('org.modal.editTitle')} onClose={closeForm}>
          <UpdateOrganizationForm
            organization={selectedOrg}
            organizations={organizations}
            orgTypes={orgTypes}
            onSubmit={handleUpdate}
            onCancel={closeForm}
            onCreateOrgType={createOrgType}
          />
        </Modal>
      )}

      <Toast toast={toast} className="z-[80]" />

      {deleteTarget && (
        <ConfirmDialog
          title={t('org.delete')}
          message={t('org.deleteConfirm')}
          confirmLabel={t('org.delete')}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
