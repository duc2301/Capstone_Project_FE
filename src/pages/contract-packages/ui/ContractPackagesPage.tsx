import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { contractPackageApi } from '@/entities/contractPackage';
import type { ContractPackage } from '@/entities/contractPackage';
import type { ListTableColumn } from '@/shared/components';
import { ActionPillButton, ListErrorCard, ListLoadingCard, ListTable, PaginationBar, RowActions } from '@/shared/components';
import { t } from '@/shared/lib/i18n';
import { formatDate } from '@/shared/lib/format';
import { sortByNewest } from '@/shared/lib/sort';
import { packageStatusMeta } from '@/features/packages';
import { useProjects } from '@/features/projects';
import { useOrganizations } from '@/features/organizations';

const PAGE_SIZE = 20;

const PACKAGE_COLUMNS: ListTableColumn[] = [
  { key: 'project', label: t('packages.col.project'), width: 'w-[18%]' },
  { key: 'package', label: t('packages.col.package'), width: 'w-[20%]' },
  { key: 'contractor', label: t('packages.col.contractor'), width: 'w-[18%]' },
  { key: 'startDate', label: t('packages.col.startDate'), width: 'w-[11%]', align: 'center' },
  { key: 'endDate', label: t('packages.col.endDate'), width: 'w-[11%]', align: 'center' },
  { key: 'status', label: t('packages.col.status'), width: 'w-[12%]' },
  { key: 'actions', label: t('common.col.actions'), width: 'w-[10%]', align: 'right' },
];

export function ContractPackagesPage() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<ContractPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const { projects, loading: projectsLoading } = useProjects();
  const projectMap = useMemo(() => {
    const map = new Map();
    projects.forEach(p => map.set(p.id, p));
    return map;
  }, [projects]);

  const { organizations } = useOrganizations();
  const organizationMap = useMemo(() => {
    const map = new Map();
    organizations.forEach(o => map.set(o.id, o));
    return map;
  }, [organizations]);

  useEffect(() => {
    if (projectsLoading) return;
    let cancelled = false;
    const fetchPackages = async () => {
      setLoading(true);
      try {
        // Lấy theo từng dự án (thay vì getAll) để đảm bảo assignments (đơn vị thực hiện)
        // được trả về đầy đủ, đồng nhất với cách trang chi tiết dự án đang lấy.
        const responses = await Promise.all(
          projects.map((p) => contractPackageApi.getByProjectId(p.id)),
        );
        if (!cancelled) {
          const all = responses.flatMap((res) => res.data.result ?? []);
          setPackages(sortByNewest(all, (p) => p.createdAt));
        }
      } catch {
        if (!cancelled) setError(t('common.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPackages();
    return () => { cancelled = true; };
  }, [projects, projectsLoading]);

  const getContractorName = (pkg: ContractPackage) => {
    const contractor = pkg.assignments?.[0];
    if (!contractor) return null;
    return (
      contractor.organizationName
      || organizationMap.get(contractor.organizationId)?.displayName
      || t('packages.contractor.updating')
    );
  };

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
        getContractorName(pkg),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [packages, projectMap, searchQuery]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <h1 className="heading-page shrink-0">{t('admin.nav.packages')}</h1>

      <div className="relative max-w-sm shrink-0">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          placeholder={t('packages.search')}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-[var(--radius-input)] border border-card-border bg-card py-2.5 pl-10 pr-4 text-sm text-text shadow-card outline-none transition-colors focus:border-primary"
        />
      </div>

      {loading && (
        <ListLoadingCard />
      )}

      {error && !loading && (
        <ListErrorCard message={error} />
      )}

      {!loading && !error && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-card-lg)] border border-card-border bg-card shadow-card-hover">
          <div className="admin-scrollbar min-h-0 flex-1 overflow-auto">
            <ListTable columns={PACKAGE_COLUMNS} minWidth="min-w-[1080px]">
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
                    const contractorName = getContractorName(pkg);
                    return (
                      <tr
                        key={pkg.id}
                        onClick={() => navigate(`/projects/${pkg.projectId}/packages/${pkg.id}`)}
                        className="cursor-pointer transition-colors duration-150 hover:bg-primary-ghost"
                      >
                        <td className="px-6 py-4">
                          {project ? (
                            <div className="flex items-center gap-3">
                              {project.projectImageUrl ? (
                                <img src={project.projectImageUrl} alt={project.projectName} className="w-8 h-8 rounded-md object-cover border border-card-border" />
                              ) : (
                                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 text-xs">
                                  {project.projectName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="cell-wrap font-semibold text-text">{project.projectName}</div>
                                {project.projectCode && <div className="cell-wrap text-xs text-text-muted mt-0.5">{project.projectCode}</div>}
                              </div>
                            </div>
                          ) : (
                            <span className="text-text-muted">{t('packages.project.unknown')}</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="cell-wrap font-semibold text-text">{pkg.name}</div>
                          {pkg.code && <div className="cell-wrap text-xs text-text-muted mt-0.5">{t('packages.contractNo')}: {pkg.code}</div>}
                        </td>
                        <td className="px-5 py-4 text-sm text-text-secondary">
                          {contractorName ?? t('packages.contractor.unassigned')}
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
