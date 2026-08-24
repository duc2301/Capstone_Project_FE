import React, { useCallback, useMemo, useState } from 'react';
import type { CreateContractPackagePayload, ContractPackage } from '@/entities/contractPackage';
import { parseWorkTypes, serializeWorkTypes, WORK_TYPE_CODES, workTypeLabel } from '@/entities/contractPackage';
import type { Account } from '@/entities/account';
import { useOrganizationList } from '@/entities/organization';
import { fileItemApi } from '@/entities/file-item';
import type { FolderContentsFileDto } from '@/entities/folder';
import { downloadBlob } from '@/shared/lib/download';
import { ConfirmDialog, Toast, useToast } from '@/shared/components';
import { useAsyncData } from '@/shared/lib/async';
import { t } from '@/shared/lib/i18n';
import { numberToWordsVN } from '@/shared/lib/format';
import { fetchAllPages } from '@/shared/lib/paging';

const EMPTY_EXISTING_FILES: FolderContentsFileDto[] = [];

function initialDurationDays(pkg?: ContractPackage): number | '' {
  if (!pkg?.startDate || !pkg?.endDate) return '';
  const start = new Date(pkg.startDate).getTime();
  const end = new Date(pkg.endDate).getTime();
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

/* ── Section heading component ── */
function SectionHeading({ icon, number, title }: { icon?: string; number: number; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-card-border pb-3 mb-5">
      {icon && <span className="text-xl">{icon}</span>}
      <h3 className="heading-card">
        {number}. {title}
      </h3>
    </div>
  );
}

/* ── Label helper ── */
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="field-label mb-1.5">
      {children}
      {required && <span className="text-danger ml-1">*</span>}
    </label>
  );
}

/* ── Input CSS class ── */
const inputCls =
  'field-input';
const selectCls = 'field-select';
const readOnlyCls =
  'w-full rounded-[var(--radius-input)] border border-input-border bg-content-bg px-4 py-3 text-sm text-text-muted cursor-not-allowed';

/* ── Format currency ── */
function fmtCurrency(value: number, currency: string): string {
  const isVnd = currency === 'VND';
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: isVnd ? 0 : 2,
  }).format(value) + ' ' + currency;
}

export interface CreatePackageFormProps {
  onSubmit: (payload: CreateContractPackagePayload, files: File[]) => Promise<void>;
  onCancel: () => void;
  accounts?: Account[];
  initialData?: ContractPackage;
  pendingFiles?: File[];
}

export function CreatePackageForm({ onSubmit, onCancel, accounts = [], initialData, pendingFiles }: Readonly<CreatePackageFormProps>) {
  const { organizations, loading: orgsLoading } = useOrganizationList();
  const [loading, setLoading] = useState(false);
  const [viewFileUrl, setViewFileUrl] = useState<{ url: string; name: string; type: string } | null>(null);

  // ── Form state ──
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [selectedFiles, setSelectedFiles] = useState<File[]>(pendingFiles ?? []);
  const [deleteFileTarget, setDeleteFileTarget] = useState<{ id: string } | null>(null);
  const [deletingFile, setDeletingFile] = useState(false);
  const { toast, showToast } = useToast();

  const confirmDeleteFile = async () => {
    if (!deleteFileTarget) return;
    setDeletingFile(true);
    try {
      await fileItemApi.delete(deleteFileTarget.id);
      setExistingFiles((prev) => prev.filter((f) => f.id !== deleteFileTarget.id));
      setDeleteFileTarget(null);
    } catch {
      showToast(t('packages.file.deleteError'), 'error');
    } finally {
      setDeletingFile(false);
    }
  };

  // Section 2 – Time
  const [startDate, setStartDate] = useState(initialData?.startDate ? initialData.startDate.split('T')[0] : '');
  const [durationDays, setDurationDays] = useState<number | ''>(() => initialDurationDays(initialData));

  // Section 3 – Scope
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<string[]>(
    parseWorkTypes(initialData?.workTypes)
  );
  const [scopeDescription, setScopeDescription] = useState(initialData?.scopeDescription ?? '');

  // Section 4 – Finance
  const [contractValue, setContractValue] = useState<number | ''>(initialData?.contractValue ?? '');
  const [taxRate, setTaxRate] = useState<number>(initialData?.taxRate ?? 10);
  const [currency, setCurrency] = useState(initialData?.currency ?? 'VND');

  // Section 5 – Contractor
  const mainContractors = initialData?.assignments?.filter(a => Number(a.role) === 0 || String(a.role) === 'MainContractor') || [];
  const [contractorOrgId, setContractorOrgId] = useState<string>(
    mainContractors[0]?.organizationId ?? ''
  );
  const [representativeId, setRepresentativeId] = useState(
    mainContractors[0]?.representativeAccountId ?? ''
  );

  // Section 6 – Contract
  const [contractNumber, setContractNumber] = useState(mainContractors[0]?.contractNumber ?? '');
  const [contractSignDate, setContractSignDate] = useState(mainContractors[0]?.contractSignDate ? mainContractors[0].contractSignDate.split('T')[0] : '');
  const [contractJobTitle, setContractJobTitle] = useState(mainContractors[0]?.position ?? '');

  // Section 7 – Extra
  const [notes, setNotes] = useState(initialData?.notes ?? '');

  const documentFolderId = initialData?.documentFolderId ?? '';

  const fetchExistingFiles = useCallback(async (): Promise<FolderContentsFileDto[]> => {
    const { folderApi } = await import('@/entities/folder');
    let hoistedFiles: FolderContentsFileDto[] = [];

    const pagedFiles = await fetchAllPages<FolderContentsFileDto>(async (page, pageSize) => {
      const { data } = await folderApi.getContents(documentFolderId, { page, pageSize });
      const contents = data?.result;
      if (page === 1) hoistedFiles = contents?.hoistedFiles ?? [];
      return { items: contents?.files ?? [], totalPages: contents?.totalPages ?? 1 };
    });

    return [...pagedFiles, ...hoistedFiles];
  }, [documentFolderId]);

  const { data: existingFiles, setData: setExistingFiles } = useAsyncData(
    documentFolderId,
    fetchExistingFiles,
    {
      fallback: EMPTY_EXISTING_FILES,
      enabled: Boolean(documentFolderId),
    },
  );

  // ── Computed values ──
  const endDate = useMemo(() => {
    if (!startDate || !durationDays) return '';
    const d = new Date(startDate);
    d.setDate(d.getDate() + Number(durationDays));
    return d.toISOString().split('T')[0];
  }, [startDate, durationDays]);

  const vatAmount = useMemo(() => {
    if (!contractValue) return 0;
    return (Number(contractValue) * taxRate) / 100;
  }, [contractValue, taxRate]);

  // ── Work types toggle ──
  const toggleWorkType = (wt: string) => {
    setSelectedWorkTypes((prev) =>
      prev.includes(wt) ? prev.filter((x) => x !== wt) : [...prev, wt],
    );
  };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        projectId: initialData?.projectId ?? '', // will be overridden by parent if new
        code: initialData?.code ?? '',
        name,
        description: description,
        contractValue: contractValue ? Number(contractValue) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        isDefault: initialData?.isDefault ?? false,
        workTypes: serializeWorkTypes(selectedWorkTypes),
        scopeDescription: scopeDescription,
        taxRate: taxRate,
        currency,
        notes: notes,
        contractorOrganizationId: contractorOrgId || undefined,
        representativeAccountId: representativeId || undefined,
        contractNumber: contractNumber,
        contractSignDate: contractSignDate || undefined,
        contractJobTitle: contractJobTitle,
      }, selectedFiles);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Header subtitle ── */}
      <p className="text-sm text-text-muted -mt-2">{t('packages.form.subtitle')}</p>

      {/* ══════ Section 1: Thông tin cơ bản ══════ */}
      <section>
        <SectionHeading number={1} title={t('packages.section.basic')} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label required>{t('packages.form.name')}</Label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder={t('packages.form.namePlaceholder')}
              className={inputCls}
            />
          </div>
          <div>
            <Label>{t('packages.form.code')} <span className="text-text-muted font-normal">{t('packages.form.autoGenerated')}</span></Label>
            <input
              value={initialData?.code ?? t('packages.form.codePlaceholder')}
              disabled
              className={readOnlyCls}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>{t('packages.form.description')}</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={t('packages.form.descriptionPlaceholder')}
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {/* ══════ Section 2: Thời gian thực hiện ══════ */}
      <section>
        <SectionHeading number={2} title={t('packages.section.time')} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label required>{t('packages.form.startDate')}</Label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className={inputCls}
            />
          </div>
          <div>
            <Label required>{t('packages.form.duration')}</Label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value ? Number(e.target.value) : '')}
                required
                placeholder="90"
                className={inputCls}
              />
              <span className="rounded-[var(--radius-input)] border border-input-border bg-content-bg px-3 py-3 text-sm font-medium text-text-muted whitespace-nowrap">
                {t('packages.form.daysUnit')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ Section 3: Phạm vi công việc ══════ */}
      <section>
        <SectionHeading number={3} title={t('packages.section.scope')} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label required>{t('packages.form.workTypes')}</Label>
            <div className="rounded-[var(--radius-input)] border border-input-border bg-input-bg p-2 max-h-36 overflow-y-auto">
              {WORK_TYPE_CODES.map((code) => (
                <label
                  key={code}
                  className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-primary/5 ${
                    selectedWorkTypes.includes(code) ? 'bg-primary/10 text-primary font-semibold' : 'text-text'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedWorkTypes.includes(code)}
                    onChange={() => toggleWorkType(code)}
                    className="accent-primary h-4 w-4"
                  />
                  {workTypeLabel(code)}
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-text-muted">{t('packages.form.workTypesHint')}</p>
          </div>
          <div>
            <Label required>{t('packages.form.scope')}</Label>
            <textarea
              value={scopeDescription}
              onChange={(e) => setScopeDescription(e.target.value)}
              required
              rows={6}
              placeholder={t('packages.form.scopePlaceholder')}
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {/* ══════ Section 4: Thông tin tài chính ══════ */}
      <section>
        <SectionHeading number={4} title={t('packages.section.finance')} />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <Label required>{t('packages.form.contractValue')}</Label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={999999999999999}
                value={contractValue}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw.length > 15) return;
                  const val = raw ? Number(raw) : '';
                  if (typeof val === 'number' && val > 999999999999999) return;
                  setContractValue(val);
                }}
                required
                className={inputCls}
                placeholder={t('packages.form.contractValuePlaceholder')}
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="field-select w-auto py-3 pl-3 font-semibold"
              >
                <option value="VND">VND</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div>
            <Label>{t('packages.form.taxRate')}</Label>
            <input
              type="number"
              min={0}
              max={100}
              value={taxRate}
              onChange={(e) => setTaxRate(Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <Label>{t('packages.form.vatAmount')} <span className="text-text-muted font-normal">{t('packages.form.auto')}</span></Label>
            <input
              value={fmtCurrency(vatAmount, currency)}
              disabled
              className={readOnlyCls}
            />
          </div>
          <div>
            <Label>{t('packages.form.total')} <span className="text-text-muted font-normal">{t('packages.form.auto')}</span></Label>
            <input
              value={fmtCurrency((contractValue || 0) + vatAmount, currency)}
              disabled
              className="w-full rounded-[var(--radius-input)] border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-bold text-primary cursor-not-allowed"
            />
          </div>
          {contractValue ? (
            <div className="sm:col-span-2">
              <p className="text-sm italic text-text-muted">
                {t('packages.form.totalInWords')}: <span className="font-semibold text-text not-italic">{numberToWordsVN((contractValue || 0) + vatAmount)}</span>
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {/* ══════ Section 5: Đơn vị thầu ══════ */}
      <section className="space-y-4">
        <SectionHeading number={5} title={t('packages.section.contractor')} />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <Label required>{t('packages.form.partner')}</Label>
            <select
              value={contractorOrgId}
              onChange={(e) => setContractorOrgId(e.target.value)}
              required
              className={selectCls}
              disabled={orgsLoading}
            >
              <option value="">{orgsLoading ? t('packages.form.partnerLoading') : t('packages.form.partnerPlaceholder')}</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.isJointVenture ? `⭐ [${t('org.jointVenture')}] ` : ''}
                  {org.displayName || org.legalName}
                  {org.taxCode ? ` (MST: ${org.taxCode})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label required>{t('packages.form.representative')}</Label>
            <select
              value={representativeId}
              onChange={(e) => setRepresentativeId(e.target.value)}
              required
              className={selectCls}
            >
              <option value="">{t('packages.form.representativePlaceholder')}</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.userName} ({acc.email})
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ══════ Section 6: Thông tin hợp đồng ══════ */}
      <section>
        <SectionHeading number={6} title={t('packages.section.contract')} />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <Label>{t('packages.form.contractNumber')}</Label>
            <input
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value)}
              placeholder={t('packages.form.contractNumberPlaceholder')}
              className={inputCls}
            />
          </div>
          <div>
            <Label>{t('packages.form.contractSignDate')}</Label>
            <input
              type="date"
              value={contractSignDate}
              onChange={(e) => setContractSignDate(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <Label>{t('packages.form.jobTitle')}</Label>
            <input
              value={contractJobTitle}
              onChange={(e) => setContractJobTitle(e.target.value)}
              placeholder={t('packages.form.jobTitlePlaceholder')}
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {/* ══════ Section 7: Tài liệu đính kèm ══════ */}
      <section>
        <SectionHeading number={7} title={t('packages.section.attachments')} />
        <div className="space-y-4">
          <div>
            <Label>{t('packages.form.notes')}</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={t('packages.form.notesPlaceholder')}
              className={inputCls}
            />
          </div>
          <div>
            <Label>{t('packages.form.attachments')}</Label>
            <div className="relative flex flex-col items-center justify-center rounded-[var(--radius-card)] border-2 border-dashed border-input-border bg-content-bg p-8 transition-colors hover:border-primary/40 cursor-pointer">
              <input 
                type="file" 
                multiple
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                  }
                }}
              />
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary/50 mb-2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <p className="text-sm font-semibold text-text-muted">{t('packages.form.dropzone')}</p>
              <p className="text-xs text-text-placeholder mt-1">{t('packages.form.dropzoneHint')}</p>
            </div>
            
            {/* List of Files */}
            {(selectedFiles.length > 0 || existingFiles.length > 0) && (
              <div className="mt-4 space-y-2">
                {existingFiles.map((file, idx) => (
                  <div key={`exist-${idx}`} className="flex items-center justify-between p-3 rounded-lg border border-input-border bg-content-bg">
                    <span className="text-sm font-medium text-primary flex-1">{file.name}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
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
                        className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"
                        title={t('packages.form.viewFile')}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await fileItemApi.download(file.id);
                            downloadBlob(res.data as Blob, file.name || 'document');
                          } catch (err) {
                            console.error("Tải file thất bại", err);
                            showToast(t('file.download.error'), 'error');
                          }
                        }}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"
                        title={t('packages.form.downloadFile')}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setDeleteFileTarget(file)}
                        className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors"
                        title={t('packages.form.deleteFile')}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
                {selectedFiles.map((file, idx) => (
                  <div key={`new-${idx}`} className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5">
                    <span className="text-sm font-medium text-text">{file.name}</span>
                    <button 
                      type="button" 
                      onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                      className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <div className="flex items-center justify-end gap-3 border-t border-card-border pt-6 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[var(--radius-button)] border border-card-border px-6 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg hover:text-text"
        >
          {t('packages.form.cancel')}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-[var(--radius-button)] bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          {loading ? t('packages.form.submitting') : t('packages.form.submit')}
        </button>
      </div>

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
                    <p className="text-text-muted">{t('packages.form.previewUnsupported')}</p>
                    <a href={viewFileUrl.url} download={viewFileUrl.name} className="rounded-[var(--radius-button)] bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-hover">
                      {t('packages.form.downloadFile')}
                    </a>
                  </div>
                </object>
              )}
            </div>
          </div>
        </div>
      )}

      {deleteFileTarget && (
        <ConfirmDialog
          title={t('packages.form.deleteFile')}
          message={t('packages.file.deleteConfirm')}
          confirmLabel={t('common.action.delete')}
          busy={deletingFile}
          onConfirm={confirmDeleteFile}
          onCancel={() => setDeleteFileTarget(null)}
        />
      )}

      <Toast toast={toast} className="z-[80]" />
    </form>
  );
}
