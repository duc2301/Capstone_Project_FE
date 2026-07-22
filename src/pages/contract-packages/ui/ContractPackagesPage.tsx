import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { contractPackageApi } from '@/entities/contractPackage';
import type { ContractPackage } from '@/entities/contractPackage';
import { t } from '@/shared/lib/i18n';
import { useProjects } from '@/features/projects';

export function ContractPackagesPage() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<ContractPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
          setPackages(data.result ?? []);
        }
      } catch (err) {
        if (!cancelled) setError(t('common.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchPackages();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text lg:text-3xl">{t('admin.nav.packages')}</h1>
        <p className="mt-1 text-sm text-text-muted">Danh sách tất cả gói thầu và hợp đồng trên hệ thống</p>
      </div>

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
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-primary/10 bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-primary/5 border-b border-primary/10">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-primary">Dự án</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-primary">Gói thầu</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-primary">Trạng thái</th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-primary">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {packages.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center text-sm text-text-muted">
                      Chưa có gói thầu nào
                    </td>
                  </tr>
                ) : (
                  packages.map((pkg) => {
                    const project = projectMap.get(pkg.projectId);
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
                              <div>
                                <div className="font-semibold text-text">{project.projectName}</div>
                                {project.projectCode && <div className="text-xs text-text-muted mt-0.5">{project.projectCode}</div>}
                              </div>
                            </div>
                          ) : (
                            <span className="text-text-muted">Không xác định</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-text">{pkg.name}</div>
                          {pkg.code && <div className="text-xs text-text-muted mt-0.5">Số HĐ: {pkg.code}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                            pkg.status === 1 ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'
                          }`}>
                            {pkg.status === 1 ? 'Đang thực hiện' : 'Khác'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/projects/${pkg.projectId}/packages/${pkg.id}`);
                            }}
                            className="rounded-[var(--radius-button)] border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary transition-all duration-200 hover:bg-primary hover:text-white"
                          >
                            Quản lý
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
