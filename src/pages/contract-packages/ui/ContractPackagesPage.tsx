import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { contractPackageApi } from '@/entities/contractPackage';
import type { ContractPackage } from '@/entities/contractPackage';
import type { ListTableColumn } from '@/shared/components';
import { ActionPillButton, ListErrorCard, ListLoadingCard, ListTable, PaginationBar, RowActions } from '@/shared/components';
import { t } from '@/shared/lib/i18n';
import { sortByNewest } from '@/shared/lib/sort';
import { packageStatusMeta } from '@/features/packages';
import { useProjects } from '@/features/projects';

const PAGE_SIZE = 20;

const PACKAGE_COLUMNS: ListTableColumn[] = [
  { key: 'project', label: t('packages.col.project'), width: 'w-[26%]' },
  { key: 'package', label: t('packages.col.package') },
  { key: 'status', label: t('packages.col.status'), width: 'w-[150px]' },
  { key: 'actions', label: t('common.col.actions'), width: 'w-[130px]', align: 'right' },
];

export function ContractPackagesPage() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<ContractPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  
  const { projects } = useProjects();
  const projectMap = useMemo(() => {
    const map = new Map();
    projects.forEach(p => map.set(p.id, p));
    return map;
  }, [projects]);

  useEffect(() => {
    let cancelled = false;
    const fetchPackages = async () => {
      try {
        const { data } = await contractPackageApi.getAll();
        if (!cancelled) {
          setPackages(sortByNewest(data.result ?? [], (p) => p.createdAt));
        }
      } catch {
        if (!cancelled) setError(t('common.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPackages();
    return () => { cancelled = true; };
  }, []);

  const pageCount = Math.max(1, Math.ceil(packages.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = packages.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <h1 className="heading-page shrink-0">{t('admin.nav.packages')}</h1>

      {loading && (
        <ListLoadingCard />
      )}

      {error && !loading && (
        <ListErrorCard message={error} />
      )}

      {!loading && !error && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-card-lg)] border border-card-border bg-card shadow-card-hover">
          <div className="admin-scrollbar min-h-0 flex-1 overflow-auto">
            <ListTable columns={PACKAGE_COLUMNS} minWidth="min-w-[780px]">
              <tbody className="divide-y divide-card-border">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-sm text-text-muted">
                      {t('packages.empty')}
                    </td>
                  </tr>
                ) : (
                  paged.map((pkg) => {
                    const project = projectMap.get(pkg.projectId);
                    const status = packageStatusMeta(pkg.status);
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
            total={packages.length}
            unit={t('packages.paginationUnit')}
            variant="inline"
            onChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
