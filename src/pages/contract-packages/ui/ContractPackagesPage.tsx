import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { contractPackageApi } from '@/entities/contractPackage';
import type { ContractPackage } from '@/entities/contractPackage';
import { isAccountAdmin, useSession } from '@/entities/session';
import type { ListTableColumn } from '@/shared/components';
import { ActionPillButton, ListErrorCard, ListLoadingCard, ListTable, PaginationBar, RowActions, SearchField } from '@/shared/components';
import { useAsyncData } from '@/shared/lib/async';
import { t } from '@/shared/lib/i18n';
import { formatDate } from '@/shared/lib/format';
import { sortByNewest } from '@/shared/lib/sort';
import { packageStatusMeta } from '@/features/packages';
import { useProjects } from '@/features/projects';

const PAGE_SIZE = 20;

const PACKAGE_COLUMNS: ListTableColumn[] = [
  { key: 'project', label: t('packages.col.project'), width: 'w-[16%]' },
  { key: 'package', label: t('packages.col.package') },
  { key: 'contractor', label: t('packages.col.contractor'), width: 'w-[16%]' },
  { key: 'startDate', label: t('packages.col.startDate'), width: 'w-[140px]', align: 'center' },
  { key: 'endDate', label: t('packages.col.endDate'), width: 'w-[140px]', align: 'center' },
  { key: 'status', label: t('packages.col.status'), width: 'w-[136px]' },
  { key: 'actions', label: t('common.col.actions'), width: 'w-[130px]', align: 'right' },
];

function contractorName(pkg: ContractPackage): string | null {
  const contractor = pkg.assignments?.[0];
  if (!contractor) return null;
  return contractor.organizationName || t('packages.contractor.updating');
}

export function ContractPackagesPage() {
  const navigate = useNavigate();
  const { currentUser } = useSession();
  const isAdmin = isAccountAdmin(currentUser?.role);

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const { projects } = useProjects();
  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects],
  );

  const { data: packages, loading, error } = useAsyncData<ContractPackage[]>(
    isAdmin ? 'packages:all' : 'packages:mine',
    async () => {
      if (isAdmin) {
        const { data } = await contractPackageApi.getAll();
        return sortByNewest(data.result?.items ?? [], (p) => p.createdAt);
      }
      const { data } = await contractPackageApi.getMine();
      return sortByNewest(data.result ?? [], (p) => p.createdAt);
    },
    { fallback: [], toErrorMessage: () => t('common.error') },
  );

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return packages;
    return packages.filter((pkg) => {
      const project = projectMap.get(pkg.projectId);
      const haystack = [
        project?.projectName,
        project?.projectCode,
        pkg.name,
        pkg.code,
        contractorName(pkg),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [packages, projectMap, searchQuery]);

  const changeSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <h1 className="heading-page shrink-0">{t('admin.nav.packages')}</h1>

      {!loading && !error && (
        <div className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <SearchField
            value={searchQuery}
            onChange={changeSearch}
            placeholder={t('packages.search')}
            className="w-full lg:max-w-[420px]"
          />
        </div>
      )}

      {loading && (
        <ListLoadingCard />
      )}

      {error && !loading && (
        <ListErrorCard message={error} />
      )}

      {!loading && !error && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-card-lg)] border border-card-border bg-card shadow-card-hover">
          <div className="admin-scrollbar min-h-0 flex-1 overflow-auto">
            <ListTable columns={PACKAGE_COLUMNS} minWidth="min-w-[1160px]">
              <tbody className="divide-y divide-card-border">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-sm text-text-muted">
                      {searchQuery ? t('packages.noResults') : t('packages.empty')}
                    </td>
                  </tr>
                ) : (
                  paged.map((pkg) => {
                    const project = projectMap.get(pkg.projectId);
                    const status = packageStatusMeta(pkg.status);
                    const contractor = contractorName(pkg);
                    return (
                      <tr
                        key={pkg.id}
                        onClick={() => navigate(`/projects/${pkg.projectId}/packages/${pkg.id}`)}
                        className="cursor-pointer transition-colors duration-150 hover:bg-primary-ghost"
                      >
                        <td className="px-6 py-4">
                          {project ? (
                            <div className="min-w-0">
                              <div className="cell-wrap font-semibold text-text">{project.projectName}</div>
                              {project.projectCode && <div className="cell-wrap text-xs text-text-muted mt-0.5">{project.projectCode}</div>}
                            </div>
                          ) : (
                            <span className="text-text-muted">{t('packages.project.unknown')}</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="cell-wrap font-semibold text-text">{pkg.name}</div>
                          {pkg.code && <div className="cell-wrap text-xs text-text-muted mt-0.5">{t('packages.contractNo')}: {pkg.code}</div>}
                        </td>
                        <td className="cell-wrap px-5 py-4 text-sm text-text-secondary">
                          {contractor ?? t('packages.contractor.unassigned')}
                        </td>
                        <td className="px-5 py-4 text-center text-sm text-text-secondary">
                          {pkg.startDate ? formatDate(pkg.startDate) : '—'}
                        </td>
                        <td className="px-5 py-4 text-center text-sm text-text-secondary">
                          {pkg.endDate ? formatDate(pkg.endDate) : '—'}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-2xs font-semibold ${status.badgeClass}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <RowActions>
                            <ActionPillButton
                              tone="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/projects/${pkg.projectId}/packages/${pkg.id}`);
                              }}
                            >
                              {t('packages.action.manage')}
                            </ActionPillButton>
                          </RowActions>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </ListTable>
          </div>

          <PaginationBar
            page={currentPage}
            pageCount={pageCount}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            unit={t('packages.paginationUnit')}
            variant="inline"
            onChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
