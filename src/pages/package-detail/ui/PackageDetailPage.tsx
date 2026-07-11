import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { contractPackageApi } from '@/entities/contractPackage';
import type { ContractPackage } from '@/entities/contractPackage';
import { PackageFormModal } from '@/features/packages';
import { useAccounts } from '@/features/accounts';
import { fileItemApi } from '@/entities/file-item';

/* ── Status mapping ── */
const STATUS_MAP: Record<number, { label: string; cls: string }> = {
  0: { label: 'Nháp', cls: 'bg-gray-100 text-gray-600' },
  1: { label: 'Chờ bắt đầu', cls: 'bg-warning-light text-warning' },
  2: { label: 'Đang thực hiện', cls: 'bg-success-light text-success' },
  3: { label: 'Hoàn thành', cls: 'bg-primary-light text-primary' },
  4: { label: 'Tạm dừng', cls: 'bg-danger-light text-danger' },
  5: { label: 'Đang soát xét', cls: 'bg-info-light text-info' },
};

function fmtCurrency(val: number | undefined, cur = 'VND') {
  if (!val) return '0 ' + cur;
  return new Intl.NumberFormat('vi-VN').format(val) + ' ' + cur;
}

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}


export default function PackageDetailPage() {
  const { projectId, packageId } = useParams<{ projectId: string; packageId: string }>();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState<ContractPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { accounts } = useAccounts();
  const [now] = useState(() => Date.now());
  const [docFiles, setDocFiles] = useState<any[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [viewFileUrl, setViewFileUrl] = useState<{ url: string; name: string; type: string } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = () => {
    if (!packageId) return;
    setLoading(true);
    contractPackageApi
      .getById(packageId)
      .then((res) => {
        const p = res.data?.result ?? null;
        setPkg(p);
        console.log('[PackageDetail] pkg loaded:', { id: p?.id, documentFolderId: p?.documentFolderId });
        if (p?.documentFolderId) {
          console.log('[PackageDetail] Fetching files for documentFolderId:', p.documentFolderId);
          import('@/entities/folder').then(({ folderApi }) => {
            folderApi.getContents(p.documentFolderId!)
              .then(viewRes => {
                console.log('[PackageDetail] getContents response:', viewRes.data);
                setDocFiles(viewRes.data?.result?.files ?? []);
              })
              .catch((err) => {
                console.error('[PackageDetail] getContents FAILED:', err);
                setDocFiles([]);
              });
          });
        } else {
          console.log('[PackageDetail] No documentFolderId on this package');
          setDocFiles([]);
        }
      })
      .catch(() => setPkg(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [packageId]);

  const st = STATUS_MAP[pkg?.status ?? 0] ?? STATUS_MAP[0];

  const workTypeTags = useMemo(() => {
    if (!pkg?.workTypes) return [];
    return pkg.workTypes.split(',').map((t) => t.trim()).filter(Boolean);
  }, [pkg?.workTypes]);

  const vatAmount = useMemo(() => {
    if (!pkg?.contractValue || !pkg?.taxRate) return 0;
    return (pkg.contractValue * pkg.taxRate) / 100;
  }, [pkg?.contractValue, pkg?.taxRate]);

  const total = (pkg?.contractValue ?? 0) + vatAmount;

  const durationDays = useMemo(() => {
    if (!pkg?.startDate || !pkg?.endDate) return null;
    const diff = new Date(pkg.endDate).getTime() - new Date(pkg.startDate).getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  }, [pkg?.startDate, pkg?.endDate]);

  const progressPct = useMemo(() => {
    if (!pkg?.startDate || !pkg?.endDate) return 0;
    const start = new Date(pkg.startDate).getTime();
    const end = new Date(pkg.endDate).getTime();
    if (now <= start) return 0;
    if (now >= end) return 100;
    return Math.round(((now - start) / (end - start)) * 100);
  }, [pkg?.startDate, pkg?.endDate, now]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-lg text-text-muted">Không tìm thấy gói thầu.</p>
        <button
          onClick={() => navigate(-1)}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-sm text-text-muted">
        <button onClick={() => navigate('/')} className="hover:text-primary transition-colors">
          BIM-CDE Portal
        </button>
        <span>/</span>
        <button onClick={() => navigate('/projects')} className="hover:text-primary transition-colors">
          Projects
        </button>
        <span>/</span>
        <button onClick={() => navigate(`/projects/${projectId}`)} className="hover:text-primary transition-colors">
          Dự án
        </button>
        <span>/</span>
        <span className="text-text font-semibold">Chi tiết gói thầu</span>
      </nav>

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate(`/projects/${projectId}?tab=packages`)}
            className="mt-1 rounded-lg p-1.5 text-text-muted hover:bg-content-bg hover:text-text transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">{pkg.code}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}>
                • {st.label}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-text lg:text-4xl">
              Gói thầu {pkg.name.toLowerCase()}
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              Dự án: (ID: {projectId?.slice(0, 8)})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const w = window.open('', '_blank');
              if (!w) return;
              w.document.write(`<html><head><title>Báo cáo gói thầu - ${pkg.name}</title><style>body{font-family:sans-serif;padding:40px}h1{font-size:24px}table{width:100%;border-collapse:collapse;margin:16px 0}td,th{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}.label{color:#888;font-size:12px;text-transform:uppercase}</style></head><body>`);
              w.document.write(`<h1>BÁO CÁO GÓI THẦU</h1>`);
              w.document.write(`<table>`);
              w.document.write(`<tr><th>Mã gói thầu</th><td>${pkg.code}</td><th>Tên gói thầu</th><td>${pkg.name}</td></tr>`);
              w.document.write(`<tr><th>Trạng thái</th><td>${st.label}</td><th>Mặc định</th><td>${pkg.isDefault ? 'Có' : 'Không'}</td></tr>`);
              w.document.write(`<tr><th>Ngày bắt đầu</th><td>${fmtDate(pkg.startDate)}</td><th>Ngày kết thúc</th><td>${fmtDate(pkg.endDate)}</td></tr>`);
              w.document.write(`<tr><th>Giá trị hợp đồng</th><td>${fmtCurrency(pkg.contractValue, pkg.currency ?? 'VND')}</td><th>Thuế VAT</th><td>${pkg.taxRate ?? 10}%</td></tr>`);
              w.document.write(`<tr><th>Tổng giá trị</th><td colspan="3">${fmtCurrency(total, pkg.currency ?? 'VND')}</td></tr>`);
              if (pkg.description) w.document.write(`<tr><th>Mô tả</th><td colspan="3">${pkg.description}</td></tr>`);
              if (pkg.scopeDescription) w.document.write(`<tr><th>Phạm vi</th><td colspan="3">${pkg.scopeDescription}</td></tr>`);
              if (pkg.workTypes) w.document.write(`<tr><th>Loại công việc</th><td colspan="3">${pkg.workTypes}</td></tr>`);
              if (pkg.notes) w.document.write(`<tr><th>Ghi chú kỹ thuật</th><td colspan="3">${pkg.notes}</td></tr>`);
              if (pkg.assignments && pkg.assignments.length > 0) {
                const a = pkg.assignments[0];
                w.document.write(`<tr><th>Đơn vị thi công</th><td>${a.organizationName ?? ''}</td><th>Người đại diện</th><td>${a.representativeName ?? ''}</td></tr>`);
                w.document.write(`<tr><th>Số hợp đồng</th><td>${a.contractNumber ?? ''}</td><th>Ngày ký</th><td>${fmtDate(a.contractSignDate)}</td></tr>`);
              }
              w.document.write(`</table>`);
              w.document.write(`<p style="margin-top:40px;color:#888;font-size:12px">Xuất lúc: ${new Date().toLocaleString('vi-VN')}</p>`);
              w.document.write(`</body></html>`);
              w.document.close();
              w.print();
            }}
            className="flex items-center gap-2 rounded-xl border border-card-border px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-content-bg"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Xuất báo cáo
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Chỉnh sửa gói thầu
          </button>
        </div>
      </div>

      {/* ── Content grid ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Top Left: Thông tin chi tiết ── */}
        <div className="lg:col-span-2">
          <div className="h-full rounded-2xl border border-card-border bg-card p-6 shadow-card">
            <div className="flex items-center gap-2 mb-6">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <h2 className="text-lg font-bold text-text">Thông tin chi tiết</h2>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">MÃ GÓI THẦU</span>
                <p className="font-mono text-base font-bold text-text mt-1">{pkg.code}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">TÊN GÓI THẦU</span>
                <p className="text-base font-bold text-text mt-1">{pkg.name}</p>
              </div>
            </div>

            {pkg.description && (
              <div className="mb-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">MÔ TẢ CHI TIẾT</span>
                <p className="mt-2 text-sm text-text leading-relaxed">{pkg.description}</p>
              </div>
            )}

            {(workTypeTags.length > 0 || pkg.scopeDescription) && (
              <div className="border-t border-card-border pt-6">
                {workTypeTags.length > 0 && (
                  <div className="mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">PHÂN LOẠI & PHẠM VI</span>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {workTypeTags.map((tag) => (
                        <span key={tag} className="rounded-lg border border-card-border bg-content-bg px-3 py-1.5 text-xs font-semibold text-text">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {pkg.scopeDescription && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl bg-[#F8F7F4] p-4">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted mt-0.5 shrink-0">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="9" y1="3" x2="9" y2="21" />
                    </svg>
                    <div>
                      <span className="text-xs font-bold text-text">Khối lượng chính:</span>
                      <p className="text-sm text-text mt-1">{pkg.scopeDescription}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Top Right: Giá trị hợp đồng ── */}
        <div className="lg:col-span-1">
          <div className="h-full rounded-2xl border border-card-border bg-primary p-6 shadow-card text-white">
            <div className="flex items-center gap-3 mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <circle cx="12" cy="12" r="2" />
                <path d="M6 12h.01M18 12h.01" />
              </svg>
              <h3 className="text-xl font-bold">Giá trị hợp đồng</h3>
            </div>

            <div className="space-y-4 text-[15px] mt-8">
              <div className="flex justify-between items-center border-b border-white/20 pb-4">
                <span className="text-white/80">Giá trị gốc ({pkg.currency ?? 'VND'})</span>
                <span className="font-semibold tracking-wide">{fmtCurrency(pkg.contractValue, '').trim()}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/20 pb-4">
                <span className="text-white/80">VAT ({pkg.taxRate ?? 10}%)</span>
                <span className="font-semibold tracking-wide">{fmtCurrency(vatAmount, '').trim()}</span>
              </div>
              <div className="pt-4 mt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-[#E8D7B0] mb-2">TỔNG CỘNG BAO GỒM THUẾ</p>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-4xl font-semibold tracking-tight">{new Intl.NumberFormat('vi-VN').format(total)}</span>
                  <span className="text-sm font-medium text-[#E8D7B0] uppercase">{pkg.currency ?? 'VND'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Middle Left: Tiến độ thực hiện ── */}
        <div className="lg:col-span-2">
          <div className="h-full rounded-2xl border border-card-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <h2 className="text-lg font-bold text-text">Tiến độ thực hiện</h2>
              </div>
              <span className="text-sm font-bold text-primary">Hoàn thành: {progressPct}%</span>
            </div>

            <div className="relative h-10 w-full overflow-hidden rounded-full bg-content-bg">
              <div
                className="absolute inset-y-0 left-0 flex items-center justify-center rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.max(progressPct, 15)}%` }}
              >
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                  {pkg.status === 2 ? 'IN PROGRESS' : st.label.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-content-bg">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                    <path d="M9 16l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">NGÀY BẮT ĐẦU</p>
                  <p className="text-sm font-bold text-text mt-0.5">{fmtDate(pkg.startDate)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-content-bg">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">THỜI GIAN</p>
                  <p className="text-sm font-bold text-text mt-0.5">{durationDays ? `${durationDays} Ngày` : '—'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-content-bg">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                    <line x1="4" y1="22" x2="4" y2="15" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">DỰ KIẾN KẾT THÚC</p>
                  <p className="text-sm font-bold text-text mt-0.5">{fmtDate(pkg.endDate)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Middle Right: Đơn vị thi công ── */}
        <div className="lg:col-span-1">
          <div className="h-full rounded-2xl border border-card-border bg-card p-6 shadow-card flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              <h3 className="text-lg font-bold text-text">Đơn vị thi công</h3>
            </div>

            {pkg.assignments && pkg.assignments.length > 0 ? (
              <div className="flex flex-col flex-1 h-full">
                <div className="mb-6">
                  <h4 className="text-base font-bold text-text">{pkg.assignments[0].organizationName || 'Chưa rõ tên Đơn vị'}</h4>
                  {pkg.assignments[0].organizationCode && (
                    <p className="text-[10px] text-text-placeholder mt-1">Mã đối tác: {pkg.assignments[0].organizationCode}</p>
                  )}
                </div>

                <div className="border-t border-card-border pt-4 pb-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <div>
                      <p className="text-sm font-bold text-text">{pkg.assignments[0].representativeName || 'Chưa cập nhật'}</p>
                      <p className="text-[10px] text-text-placeholder">{pkg.assignments[0].position || 'Đại diện pháp luật'}</p>
                    </div>
                  </div>
                  {pkg.assignments[0].representativeEmail && (
                    <div className="flex items-center gap-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      <p className="text-sm font-semibold text-text">{pkg.assignments[0].representativeEmail}</p>
                    </div>
                  )}
                  {pkg.assignments[0].representativePhone && (
                    <div className="flex items-center gap-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      <p className="text-sm font-semibold text-text">{pkg.assignments[0].representativePhone}</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-card-border pt-4 mt-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-text-placeholder mb-1">SỐ HỢP ĐỒNG</p>
                      <p className="text-sm font-bold text-[#8C6B20]">{pkg.assignments[0].contractNumber || 'Chưa ký'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-text-placeholder mb-1">NGÀY KÝ</p>
                      <p className="text-sm text-text">{fmtDate(pkg.assignments[0].contractSignDate) || '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-text-placeholder mb-1">MÃ SỐ THUẾ</p>
                      <p className="text-sm text-text">{pkg.assignments[0].vatCode || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-card-border bg-content-bg p-6 text-center">
                <div>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-2 text-text-muted opacity-50">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                  <p className="text-sm font-semibold text-text-muted">Chưa có dữ liệu</p>
                  <p className="text-xs text-text-placeholder mt-1">Sẽ cập nhật khi có PackageAssignment</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom Full Width: Ghi chú kỹ thuật & Attachments ── */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {pkg.notes && (
            <div className="flex flex-col h-full rounded-2xl border border-card-border bg-card p-6 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <h3 className="text-lg font-bold text-text">Ghi chú kỹ thuật</h3>
              </div>
              <div className="flex-1 rounded-2xl border border-dashed border-card-border bg-content-bg p-5">
                <p className="text-[13px] text-text leading-relaxed whitespace-pre-wrap break-words">
                  {pkg.notes}
                </p>
              </div>
            </div>
          )}

          {/* CDE Attachment */}
          <div className={`rounded-2xl border border-card-border bg-card p-6 shadow-card ${!pkg.notes ? 'md:col-span-2' : ''}`}>
            <div className="flex items-center gap-2 mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13 2 13 9 20 9" />
              </svg>
              <h3 className="text-lg font-bold text-text">Tài liệu đính kèm</h3>
            </div>
            {docFiles && docFiles.length > 0 ? (
              <div className="space-y-3">
                {docFiles.map((file, idx) => (
                  <div key={idx} className="rounded-2xl border border-card-border bg-content-bg p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text line-clamp-1">{file.name}</p>
                        <p className="text-xs text-text-muted mt-0.5">
                          Tệp đính kèm
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Xem trực tiếp */}
                      <button
                        onClick={async () => {
                          try {
                            const res = await fileItemApi.download(file.id);
                            const blobType = file.fileType === 0 ? 'application/pdf' :
                              file.fileType === 2 ? 'image/png' :
                                (res.headers?.['content-type'] as string) || 'application/pdf';
                            const blob = new Blob([res.data as Blob], { type: blobType });
                            const viewUrl = window.URL.createObjectURL(blob);
                            setViewFileUrl({ url: viewUrl, name: file.name || 'document', type: blobType });
                          } catch (err) {
                            console.error("Xem file thất bại", err);
                            alert("Xem file thất bại");
                          }
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        Xem
                      </button>
                      {/* Tải xuống */}
                      <button
                        onClick={async () => {
                          try {
                            const res = await fileItemApi.download(file.id);
                            const blob = res.data as Blob;
                            const downloadUrl = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = downloadUrl;
                            link.download = file.name || 'document';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(downloadUrl);
                          } catch (err) {
                            console.error("Tải file thất bại", err);
                            alert("Tải file thất bại");
                          }
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-text border border-card-border shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Tải xuống
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-card-border bg-content-bg p-5 flex flex-col items-center justify-center text-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-placeholder mb-2">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                </svg>
                <p className="text-sm font-semibold text-text-muted">Chưa có tài liệu</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      <PackageFormModal
        isOpen={isEditModalOpen && !!pkg}
        onClose={() => setIsEditModalOpen(false)}
        projectId={projectId!}
        initialData={pkg || undefined}
        accounts={accounts}
        onSuccess={(msg) => {
          showToast(msg, 'success');
          setIsEditModalOpen(false);
          loadData();
        }}
        onError={(msg) => showToast(msg, 'error')}
      />

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-20 right-6 z-[60] animate-slide-up rounded-xl border px-5 py-3 shadow-dropdown ${toast.type === 'success' ? 'border-success/30 bg-success-light' : 'border-danger/30 bg-danger-light'}`}>
          <p className={`text-sm font-medium ${toast.type === 'success' ? 'text-success' : 'text-danger'}`}>{toast.msg}</p>
        </div>
      )}

      {/* View File Modal */}
      {viewFileUrl && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-content-bg w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-card-border bg-white">
              <h3 className="font-bold text-lg text-text truncate pr-4">{viewFileUrl.name}</h3>
              <button
                onClick={() => {
                  window.URL.revokeObjectURL(viewFileUrl.url);
                  setViewFileUrl(null);
                }}
                className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-full transition-colors"
                title="Đóng"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="flex-1 bg-gray-100 relative flex items-center justify-center p-4">
              {viewFileUrl.type.startsWith('image/') ? (
                <img src={viewFileUrl.url} alt={viewFileUrl.name} className="max-w-full max-h-full object-contain shadow-sm" />
              ) : (
                <object
                  data={viewFileUrl.url}
                  type={viewFileUrl.type}
                  className="absolute inset-0 w-full h-full border-0"
                  title={viewFileUrl.name}
                >
                  <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <p className="text-text-muted">Trình duyệt của bạn không hỗ trợ xem trực tiếp tệp này.</p>
                    <a href={viewFileUrl.url} download={viewFileUrl.name} className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors">
                      Tải xuống
                    </a>
                  </div>
                </object>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
