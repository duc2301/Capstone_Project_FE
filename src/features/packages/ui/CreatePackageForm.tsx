import React, { useMemo, useState, useEffect } from 'react';
import type { CreateContractPackagePayload, ContractPackage } from '@/entities/contractPackage';
import type { Account } from '@/entities/account';
import { useOrganizations } from '@/features/organizations';
import { fileItemApi } from '@/entities/file-item';
import { numberToWordsVN } from '@/shared/lib/format/numberToWords';

/* ── Work-type options for multi-select ── */
const WORK_TYPES = [
  'Xây dựng thô',
  'Kết cấu',
  'Kiến trúc',
  'Cơ điện',
  'Hoàn thiện',
  'Bê tông cốt thép',
  'Hạ tầng kỹ thuật',
  'Phòng cháy chữa cháy',
];

/* ── Section heading component ── */
function SectionHeading({ icon, number, title }: { icon?: string; number: number; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-card-border pb-3 mb-5">
      {icon && <span className="text-xl">{icon}</span>}
      <h3 className="text-base font-bold text-primary">
        {number}. {title}
      </h3>
    </div>
  );
}

/* ── Label helper ── */
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-text-secondary mb-1.5">
      {children}
      {required && <span className="text-danger ml-1">*</span>}
    </label>
  );
}

/* ── Input CSS class ── */
const inputCls =
  'w-full rounded-[var(--radius-input)] border border-input-border bg-input-bg px-4 py-3 text-sm text-text outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20';
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
}

export function CreatePackageForm({ onSubmit, onCancel, accounts = [], initialData }: CreatePackageFormProps) {
  const { organizations, loading: orgsLoading } = useOrganizations();
  const [loading, setLoading] = useState(false);
  const [viewFileUrl, setViewFileUrl] = useState<{ url: string; name: string; type: string } | null>(null);

  // ── Form state ──
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<any[]>([]);

  // Section 2 – Time
  const [startDate, setStartDate] = useState(initialData?.startDate ? initialData.startDate.split('T')[0] : '');
  const [durationDays, setDurationDays] = useState<number | ''>('');
  
  // Try to calculate initial duration
  useEffect(() => {
    if (initialData?.startDate && initialData?.endDate) {
      const s = new Date(initialData.startDate).getTime();
      const e = new Date(initialData.endDate).getTime();
      setDurationDays(Math.round((e - s) / (1000 * 60 * 60 * 24)));
    }
  }, [initialData]);

  // Section 3 – Scope
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<string[]>(
    initialData?.workTypes ? initialData.workTypes.split(',').map(s => s.trim()) : []
  );
  const [scopeDescription, setScopeDescription] = useState(initialData?.scopeDescription ?? '');

  // Section 4 – Finance
  const [contractValue, setContractValue] = useState<number | ''>(initialData?.contractValue ?? '');
  const [taxRate, setTaxRate] = useState<number>(initialData?.taxRate ?? 10);
  const [currency, setCurrency] = useState(initialData?.currency ?? 'VND');

  // Section 5 – Contractor
  const mainContractors = initialData?.assignments?.filter(a => Number(a.role) === 0 || (a.role as any) === 'MainContractor') || [];
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

  // ── Sync with initialData & fetch existing document ──
  useEffect(() => {
    if (initialData) {
      setName(initialData.name ?? '');
      setDescription(initialData.description ?? '');
      setStartDate(initialData.startDate ? initialData.startDate.split('T')[0] : '');
      setSelectedWorkTypes(initialData.workTypes ? initialData.workTypes.split(',').map(s => s.trim()) : []);
      setScopeDescription(initialData.scopeDescription ?? '');
      setContractValue(initialData.contractValue ?? '');
      setTaxRate(initialData.taxRate ?? 10);
      setCurrency(initialData.currency ?? 'VND');
      
      const mcs = initialData.assignments?.filter(a => Number(a.role) === 0 || (a.role as any) === 'MainContractor') || [];
      setContractorOrgId(mcs[0]?.organizationId ?? '');
      setRepresentativeId(mcs[0]?.representativeAccountId ?? '');
      setContractNumber(mcs[0]?.contractNumber ?? '');
      setContractSignDate(mcs[0]?.contractSignDate ? mcs[0].contractSignDate.split('T')[0] : '');
      setContractJobTitle(mcs[0]?.position ?? '');
      setNotes(initialData.notes ?? '');
      setSelectedFiles([]);
      
      if (initialData.documentFolderId) {
        import('@/entities/folder').then(({ folderApi }) => {
          folderApi.getContents(initialData.documentFolderId!)
            .then(res => {
              if (res.data?.result?.files) {
                setExistingFiles(res.data.result.files);
              }
            })
            .catch(() => setExistingFiles([]));
        });
      } else {
        setExistingFiles([]);
      }
    } else {
      setName('');
      setDescription('');
      setStartDate('');
      setDurationDays('');
      setSelectedWorkTypes([]);
      setScopeDescription('');
      setContractValue('');
      setTaxRate(10);
      setCurrency('VND');
      setContractorOrgId('');
      setRepresentativeId('');
      setContractNumber('');
      setContractSignDate('');
      setContractJobTitle('');
      setNotes('');
      setSelectedFiles([]);
      setExistingFiles([]);
    }
  }, [initialData]);

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
        status: initialData?.status ?? 1, // Keep status or default to Pending
        isDefault: initialData?.isDefault ?? false,
        workTypes: selectedWorkTypes.join(','),
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
      <p className="text-sm text-text-muted -mt-2">
        Khởi tạo và thiết lập các thông số chi tiết cho gói thầu dự án.
      </p>

      {/* ══════ Section 1: Thông tin cơ bản ══════ */}
      <section>
        <SectionHeading number={1} title="Thông tin cơ bản" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label required>Tên gói thầu</Label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Nhập tên gói thầu..."
              className={inputCls}
            />
          </div>
          <div>
            <Label>Mã gói thầu <span className="text-text-muted font-normal">(Tự động tạo)</span></Label>
            <input
              value={initialData?.code ?? 'PKG-XXXX (Tự động)'}
              disabled
              className={readOnlyCls}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Mô tả gói thầu</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Tóm tắt nội dung gói thầu..."
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {/* ══════ Section 2: Thời gian thực hiện ══════ */}
      <section>
        <SectionHeading number={2} title="Thời gian" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label required>Ngày khởi công</Label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className={inputCls}
            />
          </div>
          <div>
            <Label required>Thời gian thực hiện</Label>
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
                Ngày
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ Section 3: Phạm vi công việc ══════ */}
      <section>
        <SectionHeading number={3} title="Phạm vi công việc" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label required>Loại công việc</Label>
            <div className="rounded-[var(--radius-input)] border border-input-border bg-input-bg p-2 max-h-36 overflow-y-auto">
              {WORK_TYPES.map((wt) => (
                <label
                  key={wt}
                  className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-primary/5 ${
                    selectedWorkTypes.includes(wt) ? 'bg-primary/10 text-primary font-semibold' : 'text-text'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedWorkTypes.includes(wt)}
                    onChange={() => toggleWorkType(wt)}
                    className="accent-primary h-4 w-4"
                  />
                  {wt}
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-text-muted">Giữ Ctrl/Cmd để chọn nhiều loại</p>
          </div>
          <div>
            <Label required>Phạm vi & khối lượng</Label>
            <textarea
              value={scopeDescription}
              onChange={(e) => setScopeDescription(e.target.value)}
              required
              rows={6}
              placeholder="Liệt kê các hạng mục chính và khối lượng ước tính..."
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {/* ══════ Section 4: Thông tin tài chính ══════ */}
      <section>
        <SectionHeading number={4} title="Giá trị & Tài chính" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <Label required>Giá trị hợp đồng gốc</Label>
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
                placeholder="Ví dụ: 1000000000"
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="rounded-[var(--radius-input)] border border-input-border bg-input-bg px-3 py-3 text-sm font-semibold text-text"
              >
                <option value="VND">VND</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div>
            <Label>Thuế VAT (%)</Label>
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
            <Label>Giá trị VAT <span className="text-text-muted font-normal">(Tự động)</span></Label>
            <input
              value={fmtCurrency(vatAmount, currency)}
              disabled
              className={readOnlyCls}
            />
          </div>
          <div>
            <Label>Tổng giá trị (sau VAT) <span className="text-text-muted font-normal">(Tự động)</span></Label>
            <input
              value={fmtCurrency((contractValue || 0) + vatAmount, currency)}
              disabled
              className="w-full rounded-[var(--radius-input)] border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-bold text-primary cursor-not-allowed"
            />
          </div>
          {contractValue ? (
            <div className="sm:col-span-2">
              <p className="text-sm italic text-text-muted">
                Bằng chữ (Tổng giá trị): <span className="font-semibold text-text not-italic">{numberToWordsVN((contractValue || 0) + vatAmount)}</span>
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {/* ══════ Section 5: Đơn vị thầu ══════ */}
      <section className="space-y-4">
        <SectionHeading number={5} title="Nhà thầu & Phân công" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <Label required>Đối tác / Liên doanh quản lý</Label>
            <select
              value={contractorOrgId}
              onChange={(e) => setContractorOrgId(e.target.value)}
              required
              className={inputCls}
              disabled={orgsLoading}
            >
              <option value="">{orgsLoading ? 'Đang tải danh sách...' : 'Chọn đối tác hoặc liên doanh...'}</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.isJointVenture ? '⭐ [Liên doanh] ' : ''}
                  {org.displayName || org.legalName}
                  {org.taxCode ? ` (MST: ${org.taxCode})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label required>Người đại diện</Label>
            <select
              value={representativeId}
              onChange={(e) => setRepresentativeId(e.target.value)}
              required
              className={inputCls}
            >
              <option value="">Chọn từ danh sách liên hệ...</option>
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
        <SectionHeading number={6} title="Thông tin hợp đồng" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <Label>Số hợp đồng</Label>
            <input
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value)}
              placeholder="Ví dụ: 01/2024/HĐKT"
              className={inputCls}
            />
          </div>
          <div>
            <Label>Ngày ký hợp đồng</Label>
            <input
              type="date"
              value={contractSignDate}
              onChange={(e) => setContractSignDate(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <Label>Chức danh/Vị trí</Label>
            <input
              value={contractJobTitle}
              onChange={(e) => setContractJobTitle(e.target.value)}
              placeholder="Giám đốc dự án"
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {/* ══════ Section 7: Tài liệu đính kèm ══════ */}
      <section>
        <SectionHeading number={7} title="Tài liệu đính kèm" />
        <div className="space-y-4">
          <div>
            <Label>Ghi chú</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Các lưu ý đặc biệt khác..."
              className={inputCls}
            />
          </div>
          <div>
            <Label>Tệp đính kèm (Hồ sơ dự thầu, Quyết định phê duyệt...)</Label>
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
              <p className="text-sm font-semibold text-text-muted">Kéo và thả tệp vào đây</p>
              <p className="text-xs text-text-placeholder mt-1">Hoặc nhấp để duyệt file từ máy tính</p>
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
                            alert("Xem file thất bại");
                          }
                        }}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"
                        title="Xem trực tiếp"
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
                        className="p-1.5 text-primary hover:bg-primary/10 rounded transition-colors"
                        title="Tải xuống"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </button>
                      <button 
                        type="button" 
                        onClick={async () => {
                          if (window.confirm(`Bạn có chắc chắn muốn xóa tệp "${file.name}" không? Thao tác này không thể hoàn tác.`)) {
                            try {
                              await fileItemApi.delete(file.id);
                              setExistingFiles(prev => prev.filter(f => f.id !== file.id));
                            } catch (err) {
                              console.error("Xóa file thất bại", err);
                              alert("Xóa file thất bại, vui lòng thử lại sau.");
                            }
                          }
                        }}
                        className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded transition-colors"
                        title="Xóa file"
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
          Hủy bỏ
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
          {loading ? 'Đang tạo...' : 'Lưu gói thầu'}
        </button>
      </div>

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
    </form>
  );
}
