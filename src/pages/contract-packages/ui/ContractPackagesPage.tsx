import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { contractPackageApi } from '@/entities/contractPackage';
import type { ContractPackage } from '@/entities/contractPackage';
import { ActionPillButton, PaginationBar, RowActions } from '@/shared/components';
import { t } from '@/shared/lib/i18n';
import { sortByNewest } from '@/shared/lib/sort';
import { packageStatusMeta } from '@/features/packages';
import { useProjects } from '@/features/projects';

const PAGE_SIZE = 20;

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
        <div className="flex items-center justify-center rounded-[var(--radius-card)] border border-card-border bg-card py-20 shadow-card">
          <p className="text-sm text-text-muted">{t('common.loading')}</p>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-[var(--radius-card)] border border-danger/20 bg-danger-light p-6 text-center">
          <p className="text-sm font-medium text-danger">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-card-lg)] border border-card-border bg-card shadow-card-hover">
          <div className="admin-scrollbar min-h-0 flex-1 overflow-auto">
            <table className="table-list min-w-[780px]">
              <colgroup>
                <col className="w-[26%]" />
                <col />
                <col className="w-[150px]" />
                <col className="w-[130px]" />
              </colgroup>
              <thead className="sticky top-0 z-10">
                <tr className="table-head bg-content-bg">
                  <th className="px-6 py-3.5">{t('packages.col.project')}</th>
                  <th className="px-5 py-3.5">{t('packages.col.package')}</th>
                  <th className="px-5 py-3.5">{t('packages.col.status')}</th>
                  <th className="px-5 py-3.5 text-right">{t('common.col.actions')}</th>
                </tr>
              </thead>
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
            </table>
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
