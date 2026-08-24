import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { contractPackageApi, parseWorkTypes, workTypeLabel } from '@/entities/contractPackage';
import type { ContractPackage } from '@/entities/contractPackage';
import { packageStatusMeta, PackageFormModal } from '@/features/packages';
import { useProjectDetail } from '@/features/projects';
import { useAccounts } from '@/features/accounts';
import { fileItemApi } from '@/entities/file-item';
import type { FolderContentsFileDto } from '@/entities/folder';
import { downloadBlob } from '@/shared/lib/download';
import { Toast, ToolbarIconButton, useToast } from '@/shared/components';
import { useAsyncData } from '@/shared/lib/async';
import { formatDate } from '@/shared/lib/format';
import { t } from '@/shared/lib/i18n';

interface PackageDetailData {
  pkg: ContractPackage | null;
  docFiles: FolderContentsFileDto[];
}

const EMPTY_DETAIL: PackageDetailData = { pkg: null, docFiles: [] };

function fmtCurrency(val: number | undefined, cur = 'VND') {
  if (val === undefined) return '';
  const isVnd = cur === 'VND';
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: isVnd ? 0 : 2,
  }).format(val) + ' ' + cur;
}

function fmtDate(d?: string) {
  if (!d) return '—';
  return formatDate(d);
}

function computeElapsedPercent(startDate: string | undefined, endDate: string | undefined, now: number): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}


export default function PackageDetailPage() {
  const { projectId, packageId } = useParams<{ projectId: string; packageId: string }>();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { accounts } = useAccounts();
  const { project } = useProjectDetail(projectId);
  const [now] = useState(() => Date.now());
  const [viewFileUrl, setViewFileUrl] = useState<{ url: string; name: string; type: string } | null>(null);

  const { toast, showToast } = useToast();

  const fetchPackage = useCallback(async (): Promise<PackageDetailData> => {
    const res = await contractPackageApi.getById(packageId!);
    const p = res.data?.result ?? null;

    if (!p?.documentFolderId) return { pkg: p, docFiles: [] };

    const { folderApi } = await import('@/entities/folder');
    // /contents nay phan trang `files` (mac dinh 20). Man hinh nay muon TOAN BO tai lieu cua
    // goi thau -> lay pageSize toi da (500) + gop hoistedFiles (khong phan trang).
    const viewRes = await folderApi
      .getContents(p.documentFolderId, { pageSize: 500 })
      .catch(() => null);
    const contents = viewRes?.data?.result;

    return {
      pkg: p,
      docFiles: [...(contents?.files ?? []), ...(contents?.hoistedFiles ?? [])],
    };
  }, [packageId]);

  const { data, loading, reload: loadData } = useAsyncData(packageId ?? '', fetchPackage, {
    fallback: EMPTY_DETAIL,
    enabled: Boolean(packageId),
  });

  const { pkg, docFiles } = data;

  const st = packageStatusMeta(pkg?.status ?? 0);

  const workTypeTags = parseWorkTypes(pkg?.workTypes);

  const vatAmount = pkg?.contractValue && pkg?.taxRate
    ? (pkg.contractValue * pkg.taxRate) / 100
    : 0;

  const total = (pkg?.contractValue ?? 0) + vatAmount;

  const durationDays = pkg?.startDate && pkg?.endDate
    ? Math.round((new Date(pkg.endDate).getTime() - new Date(pkg.startDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const progressPct = computeElapsedPercent(pkg?.startDate, pkg?.endDate, now);

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
        <p className="text-lg text-text-muted">{t('packageDetail.notFound')}</p>
        <button
          onClick={() => navigate(-1)}
          className="rounded-[var(--radius-button)] bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-hover"
        >
          {t('packageDetail.back')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">


      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">

          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">{pkg.code}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${st.badgeClass}`}>
                • {st.label}
              </span>
            </div>
            <h1 className="heading-page">
              {pkg.name}
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              {t('packageDetail.project')}: {project?.projectName ?? '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ToolbarIconButton
            variant="solid"
            showLabel
            label={t('packageDetail.edit')}
            onClick={() => setIsEditModalOpen(true)}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* ── Content grid ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Top Left: Thông tin chi tiết ── */}
        <div className="lg:col-span-2">
          <div className="h-full rounded-[var(--radius-card)] border border-card-border bg-card p-6 shadow-card">
            <div className="flex items-center gap-2 mb-6">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <h2 className="heading-entity">{t('packageDetail.details')}</h2>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-text-muted">{t('packageDetail.col.code')}</span>
                <p className="font-mono text-base font-bold text-text mt-1">{pkg.code}</p>
              </div>
              <div>
                <span className="text-2xs font-bold uppercase tracking-wider text-text-muted">{t('packageDetail.col.name')}</span>
                <p className="text-base font-bold text-text mt-1">{pkg.name}</p>
              </div>
            </div>

            {pkg.description && (
              <div className="mb-6">
                <span className="text-2xs font-bold uppercase tracking-wider text-text-muted">{t('packageDetail.col.description')}</span>
                <p className="mt-2 text-sm text-text leading-relaxed">{pkg.description}</p>
              </div>
            )}

            {(workTypeTags.length > 0 || pkg.scopeDescription) && (
              <div className="border-t border-card-border pt-6">
                {workTypeTags.length > 0 && (
                  <div className="mb-4">
                    <span className="text-2xs font-bold uppercase tracking-wider text-text-muted">{t('packageDetail.col.workTypes')}</span>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {workTypeTags.map((tag) => (
                        <span key={tag} className="rounded-lg border border-card-border bg-content-bg px-3 py-1.5 text-xs font-semibold text-text">
                          {workTypeLabel(tag)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {pkg.scopeDescription && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl bg-input-bg p-4">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted mt-0.5 shrink-0">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="9" y1="3" x2="9" y2="21" />
                    </svg>
                    <div>
                      <span className="text-xs font-bold text-text">{t('packageDetail.scopeLabel')}</span>
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
          <div className="h-full rounded-[var(--radius-card)] border border-card-border bg-primary p-6 shadow-card text-white">
            <div className="flex items-center gap-3 mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <circle cx="12" cy="12" r="2" />
                <path d="M6 12h.01M18 12h.01" />
              </svg>
              <h3 className="heading-section">{t('packageDetail.contractValue')}</h3>
            </div>

            <div className="space-y-4 text-base mt-8">
              <div className="flex justify-between items-center border-b border-white/20 pb-4">
                <span className="text-white/80">{t('packageDetail.baseValue')} ({pkg.currency ?? 'VND'})</span>
                <span className="font-semibold tracking-wide">{fmtCurrency(pkg.contractValue, '').trim()}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/20 pb-4">
                <span className="text-white/80">VAT ({pkg.taxRate ?? 10}%)</span>
                <span className="font-semibold tracking-wide">{fmtCurrency(vatAmount, '').trim()}</span>
              </div>
              <div className="pt-4 mt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-accent-amber-soft mb-2">{t('packageDetail.totalWithTax')}</p>
                <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                  <span 
                    className="text-2xl xl:text-3xl font-semibold tracking-tight break-all"
                    title={`${new Intl.NumberFormat('vi-VN').format(total)} ${pkg.currency ?? 'VND'}`}
                  >
                    {new Intl.NumberFormat('vi-VN').format(total)}
                  </span>
                  <span className="text-sm font-medium text-accent-amber-soft uppercase shrink-0">{pkg.currency ?? 'VND'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Middle Left: Tiến độ thực hiện ── */}
        <div className="lg:col-span-2">
          <div className="h-full rounded-[var(--radius-card)] border border-card-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <h2 className="heading-entity">{t('packageDetail.progress')}</h2>
              </div>
              <span className="text-sm font-bold text-primary">{t('packageDetail.elapsed')}: {progressPct}%</span>
            </div>

            <div className="relative h-10 w-full overflow-hidden rounded-full bg-content-bg">
              <div
                className="absolute inset-y-0 left-0 flex items-center justify-center rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.max(progressPct, 15)}%` }}
              >
                <span className="text-2xs font-bold text-white uppercase tracking-wider">
                  {st.label.toUpperCase()}
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
                  <p className="text-2xs font-bold uppercase tracking-wider text-text-muted">{t('packageDetail.col.startDate')}</p>
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
                  <p className="text-2xs font-bold uppercase tracking-wider text-text-muted">{t('packageDetail.col.duration')}</p>
                  <p className="text-sm font-bold text-text mt-0.5">{durationDays ? `${durationDays} ${t('packageDetail.days')}` : '—'}</p>
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
                  <p className="text-2xs font-bold uppercase tracking-wider text-text-muted">{t('packageDetail.col.endDate')}</p>
                  <p className="text-sm font-bold text-text mt-0.5">{fmtDate(pkg.endDate)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Middle Right: Đơn vị thi công ── */}
        <div className="lg:col-span-1">
          <div className="h-full rounded-[var(--radius-card)] border border-card-border bg-card p-6 shadow-card flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              <h3 className="heading-entity">{t('packageDetail.contractor')}</h3>
            </div>

            {pkg.assignments && pkg.assignments.length > 0 ? (
              <div className="flex flex-col flex-1 h-full">
                <div className="mb-6">
                  <h4 className="heading-card text-text">{pkg.assignments[0].organizationName || t('packageDetail.contractor.unnamed')}</h4>
                  {pkg.assignments[0].organizationCode && (
                    <p className="text-2xs text-text-placeholder mt-1">{t('packageDetail.contractor.code')}: {pkg.assignments[0].organizationCode}</p>
                  )}
                </div>

                <div className="border-t border-card-border pt-4 pb-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <div>
                      <p className="text-sm font-bold text-text">{pkg.assignments[0].representativeName || t('packageDetail.contractor.noRepresentative')}</p>
                      <p className="text-2xs text-text-placeholder">{pkg.assignments[0].position || t('packageDetail.contractor.legalRep')}</p>
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
                      <p className="text-2xs font-bold uppercase tracking-wider text-text-placeholder mb-1">{t('packageDetail.col.contractNumber')}</p>
                      <p className="text-sm font-bold text-accent-gold">{pkg.assignments[0].contractNumber || t('packageDetail.unsigned')}</p>
                    </div>
                    <div>
                      <p className="text-2xs font-bold uppercase tracking-wider text-text-placeholder mb-1">{t('packageDetail.col.signDate')}</p>
                      <p className="text-sm text-text">{fmtDate(pkg.assignments[0].contractSignDate) || '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xs font-bold uppercase tracking-wider text-text-placeholder mb-1">{t('packageDetail.col.taxCode')}</p>
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
                  <p className="text-sm font-semibold text-text-muted">{t('packageDetail.noData')}</p>
                  <p className="text-xs text-text-placeholder mt-1">{t('packageDetail.noContractor')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom Full Width: Ghi chú kỹ thuật & Attachments ── */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {pkg.notes && (
            <div className="flex flex-col h-full rounded-[var(--radius-card)] border border-card-border bg-card p-6 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <h3 className="heading-entity">{t('packageDetail.notes')}</h3>
              </div>
              <div className="flex-1 rounded-[var(--radius-card)] border border-dashed border-card-border bg-content-bg p-5">
                <p className="text-sm text-text leading-relaxed whitespace-pre-wrap break-words">
                  {pkg.notes}
                </p>
              </div>
            </div>
          )}

          {/* CDE Attachment */}
          <div className={`rounded-[var(--radius-card)] border border-card-border bg-card p-6 shadow-card ${!pkg.notes ? 'md:col-span-2' : ''}`}>
            <div className="flex items-center gap-2 mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13 2 13 9 20 9" />
              </svg>
              <h3 className="heading-entity">{t('packageDetail.attachments')}</h3>
            </div>
            {docFiles && docFiles.length > 0 ? (
              <div className="space-y-3">
                {docFiles.map((file, idx) => (
                  <div key={idx} className="rounded-[var(--radius-card)] border border-card-border bg-content-bg p-5 flex items-center justify-between">
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
                          {t('packageDetail.attachment')}
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
                            showToast(t('file.view.error'), 'error');
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
                            downloadBlob(res.data as Blob, file.name || 'document');
                          } catch (err) {
                            console.error("Tải file thất bại", err);
                            showToast(t('file.download.error'), 'error');
                          }
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-text border border-card-border shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        {t('packageDetail.download')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[var(--radius-card)] border border-dashed border-card-border bg-content-bg p-5 flex flex-col items-center justify-center text-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-placeholder mb-2">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                </svg>
                <p className="text-sm font-semibold text-text-muted">{t('packageDetail.noAttachments')}</p>
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
      <Toast toast={toast} className="z-[60]" />

      {/* View File Modal */}
      {viewFileUrl && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="flex h-[90vh] w-full max-w-5xl animate-scale-in flex-col overflow-hidden rounded-[var(--radius-card-lg)] bg-card shadow-modal">
            <div className="flex items-center justify-between gap-4 border-b border-card-border px-6 py-4">
              <h3 className="heading-entity truncate">{viewFileUrl.name}</h3>
              <button
                onClick={() => {
                  window.URL.revokeObjectURL(viewFileUrl.url);
                  setViewFileUrl(null);
                }}
                className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-full transition-colors"
                title={t('common.close')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="relative flex flex-1 items-center justify-center bg-content-bg p-4">
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
                    <p className="text-text-muted">{t('packageDetail.previewUnsupported')}</p>
                    <a href={viewFileUrl.url} download={viewFileUrl.name} className="btn-modal-primary">
                      {t('packageDetail.download')}
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
