import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { contractPackageApi } from '@/entities/contractPackage';
import type { CreateContractPackagePayload } from '@/entities/contractPackage';
import type { FolderTreeNodeDto } from '@/entities/folder';
import { folderApi } from '@/entities/folder';
import { groupApi } from '@/entities/group';
import type { Organization } from '@/entities/organization';
import { organizationApi } from '@/entities/organization';
import { projectApi, ProjectParticipantRole } from '@/entities/project';
import { fileItemApi } from '@/entities/file-item';
import { accountApi } from '@/entities/account/api/accountApi';
import type { Account } from '@/entities/account';
import { t } from '@/shared/lib/i18n';
import { numberToWordsVN } from '@/shared/lib/format/numberToWords';
import { AddressField } from './AddressField';
import { CreatePackageForm } from '../../packages/ui/CreatePackageForm';

/* ══════════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════════ */

interface GroupDraft {
  key: string;
  name: string;
  description: string;
  organizationId: string | null;
}

interface StepperPackage {
  id: string; // generated client-side id
  payload: CreateContractPackagePayload;
  files: File[];
}

interface StepperState {
  /* Step 1 */
  projectName: string;
  projectCode: string;
  projectImageUrl: string;
  projectDescription: string;
  address: string;
  latitude: string;
  longitude: string;
  /* Step 2 */
  mandatoryFiles: File[];
  /* Step 3 */
  packages: StepperPackage[];
  /* Step 4 & 5 */
  groups: GroupDraft[];
}

/* ══════════════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════════════ */

const STEP_COUNT = 6;

const STEP_LABELS = [
  'Thông tin dự án',
  'Hồ sơ dự án bắt buộc',
  'Gói thầu & Hợp đồng',
  'Quản lý nhóm',
  'Thêm đối tác',
  'Khởi tạo dự án',
];

const STEP_ICONS = [
  // 1 - info
  <svg key="s1" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>,
  // 2 - upload
  <svg key="s2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>,
  // 3 - file-text
  <svg key="s3" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
  // 4 - users
  <svg key="s4" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  // 5 - building
  <svg key="s5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><line x1="9" y1="22" x2="9" y2="2" /><line x1="15" y1="22" x2="15" y2="2" /></svg>,
  // 6 - check-circle
  <svg key="s6" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
];

const DEFAULT_GROUP_NAMES = [
  'Chủ đầu tư',
  'Tư vấn thiết kế',
  'Tư vấn thẩm tra',
  'Nhà thầu thi công',
  'Tư vấn giám sát',
];

const newKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `g-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const buildDefaultGroups = (): GroupDraft[] =>
  DEFAULT_GROUP_NAMES.map((name) => ({ key: newKey(), name, description: '', organizationId: null }));

const inputCls =
  'w-full rounded-[var(--radius-input)] border border-input-border bg-input-bg px-4 py-3 text-sm text-text outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20';

// removed emptyPkg()

function fmtCurrency(value: number, currency: string): string {
  const isVnd = currency === 'VND';
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: isVnd ? 0 : 2,
  }).format(value) + ' ' + currency;
}

function fmtFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/* ══════════════════════════════════════════════════════════════
   Sub-components
   ══════════════════════════════════════════════════════════════ */

function SectionLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-text-secondary mb-1.5">
      {children}
      {required && <span className="text-danger ml-1">*</span>}
    </label>
  );
}

/* ── File Dropzone ── */
function FileDropzone({
  files,
  onAdd,
  onRemove,
  label,
  hint,
}: {
  files: File[];
  onAdd: (newFiles: File[]) => void;
  onRemove: (index: number) => void;
  label: string;
  hint?: string;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) onAdd(Array.from(e.dataTransfer.files));
    },
    [onAdd],
  );

  return (
    <div className="space-y-3">
      <SectionLabel>{label}</SectionLabel>
      {hint && <p className="text-xs text-text-muted -mt-1 mb-2">{hint}</p>}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-200 cursor-pointer ${isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-input-border bg-content-bg hover:border-primary/40'}`}
      >
        <input
          type="file"
          multiple
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          onChange={(e) => {
            if (e.target.files?.length) onAdd(Array.from(e.target.files));
            e.target.value = '';
          }}
        />
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary/50 mb-2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p className="text-sm font-semibold text-text-muted">Kéo và thả tệp vào đây</p>
        <p className="text-xs text-text-placeholder mt-1">Hoặc nhấp để duyệt file từ máy tính</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2 mt-3">
          {files.map((file, idx) => (
            <div key={`${file.name}-${idx}`} className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary shrink-0">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text truncate">{file.name}</p>
                  <p className="text-xs text-text-muted">{fmtFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════════ */

export interface CreateProjectStepperProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function CreateProjectStepper({ onComplete, onCancel }: CreateProjectStepperProps) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  /* ── Shared data (loaded once) ── */
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    Promise.all([
      organizationApi.getAll(),
      accountApi.getAll()
    ])
      .then(([orgRes, accRes]) => {
        setOrganizations(orgRes.data.result ?? []);
        setAccounts(accRes.data.result ?? []);
      })
      .catch(() => { })
      .finally(() => setOrgsLoading(false));
  }, []);

  /* ── Form state ── */
  const [state, setState] = useState<StepperState>({
    projectName: '',
    projectCode: '',
    projectImageUrl: '',
    projectDescription: '',
    address: '',
    latitude: '',
    longitude: '',
    mandatoryFiles: [],
    packages: [],
    groups: buildDefaultGroups(),
  });

  const update = useCallback(<K extends keyof StepperState>(key: K, value: StepperState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  /* ── Navigation ── */
  const canProceed = useMemo(() => {
    switch (step) {
      case 0: return state.projectName.trim().length > 0;
      case 1: return true; // files optional
      case 2: return true; // package optional
      case 3: return state.groups.some((g) => g.name.trim());
      case 4: return true; // org assignment optional
      case 5: return true; // summary
      default: return true;
    }
  }, [step, state]);

  const next = () => {
    if (step < STEP_COUNT - 1 && canProceed) {
      setStep(step + 1);
    }
  };
  const prev = () => { if (step > 0) setStep(step - 1); };


  /* ══════════════════════════════════════════════════════════
     SUBMIT – Cascade of API calls
     ══════════════════════════════════════════════════════════ */
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      /* 1. Create project */
      setSubmitProgress('Đang tạo dự án...');
      const lat = Number.parseFloat(state.latitude);
      const lng = Number.parseFloat(state.longitude);
      const { data: projectRes } = await projectApi.create({
        projectName: state.projectName.trim(),
        projectCode: state.projectCode.trim() || undefined,
        projectImageUrl: state.projectImageUrl.trim() || undefined,
        projectDescription: state.projectDescription.trim() || undefined,
        address: state.address.trim() || undefined,
        latitude: Number.isFinite(lat) ? lat : undefined,
        longitude: Number.isFinite(lng) ? lng : undefined,
      });
      const project = projectRes.result;
      if (!project) throw new Error('Tạo dự án thất bại');

      /* 2. Upload mandatory files to /WIP/Chủ đầu tư */
      if (state.mandatoryFiles.length > 0) {
        setSubmitProgress('Đang tải lên hồ sơ bắt buộc...');
        // Find the WIP > Chủ đầu tư folder
        const { data: treeRes } = await folderApi.getTree(project.id, 0); // area=WIP
        const tree = treeRes.result ?? [];
        const ownerFolderId = findFolderByName(tree, 'Chủ đầu tư');

        const detectFileType = (fileName: string): number => {
          const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
          if (ext === 'pdf') return 0;
          if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) return 2;
          if (ext === 'ifc') return 1;
          if (['dwg', 'dxf', 'rvt', 'nwc', 'nwd', 'dgn'].includes(ext)) return 3;
          if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'txt'].includes(ext)) return 4;
          return 5;
        };

        if (ownerFolderId) {
          for (const file of state.mandatoryFiles) {
            const formData = new FormData();
            formData.append('FolderId', ownerFolderId);
            formData.append('FileType', detectFileType(file.name).toString());
            formData.append('Name', file.name.replace(/\.[^/.]+$/, ''));
            formData.append('file', file);
            await fileItemApi.upload(formData);
          }
        }
      }

      /* 3. Create groups */
      const validGroups = state.groups.filter((g) => g.name.trim());
      if (validGroups.length > 0) {
        setSubmitProgress('Đang tạo nhóm...');
        const createdGroups = await Promise.all(
          validGroups.map((g) =>
            groupApi.create({
              name: g.name.trim(),
              description: g.description?.trim() || undefined,
              organizationId: g.organizationId || undefined,
            }),
          ),
        );
        const groupIds = createdGroups
          .map((res) => res.data.result?.id)
          .filter((id): id is string => Boolean(id));

        if (groupIds.length > 0) {
          setSubmitProgress('Đang thêm nhóm vào dự án...');
          await projectApi.addParticipantsBulk(project.id, {
            participants: groupIds.map((groupId) => ({
              groupId,
              role: ProjectParticipantRole.Member,
            })),
          });
        }
      }

      /* 4. Create packages */
      if (state.packages.length > 0) {
        setSubmitProgress('Đang tạo các gói thầu...');

        const detectFileType = (fileName: string): number => {
          const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
          if (ext === 'pdf') return 0;
          if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) return 2;
          if (ext === 'ifc') return 1;
          if (['dwg', 'dxf', 'rvt', 'nwc', 'nwd', 'dgn'].includes(ext)) return 3;
          if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'txt'].includes(ext)) return 4;
          return 5;
        };

        for (const pkgItem of state.packages) {

          setSubmitProgress(`Đang tạo gói thầu ${pkgItem.payload.name}...`);
          const pkgPayload: CreateContractPackagePayload = {
            ...pkgItem.payload,
            projectId: project.id,
            status: 1,
            isDefault: true,
          };
          const pkgRes = await contractPackageApi.create(pkgPayload);
          const documentFolderId = pkgRes.data?.result?.documentFolderId;

          if (documentFolderId && pkgItem.files.length > 0) {
            setSubmitProgress(`Đang tải lên hồ sơ gói thầu ${pkgItem.payload.name}...`);

            for (const file of pkgItem.files) {
              const formData = new FormData();
              formData.append('FolderId', documentFolderId);
              formData.append('FileType', detectFileType(file.name).toString());
              formData.append('Name', file.name.replace(/\.[^/.]+$/, ''));
              formData.append('file', file);
              await fileItemApi.upload(formData);
            }
          }
        }
      }

      setSubmitProgress('Hoàn tất!');
      onComplete();
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Helper: find folder by name recursively ── */
  function findFolderByName(nodes: FolderTreeNodeDto[], name: string): string | null {
    for (const node of nodes) {
      if (node.name === name) return node.id;
      const found = findFolderByName(node.children, name);
      if (found) return found;
    }
    return null;
  }

  /* ══════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════ */

  return (
    <div className="flex flex-col h-full">
      {/* ── Stepper Header ── */}
      <div className="px-8 pt-6 pb-4">
        <div className="flex items-center justify-between">
          {STEP_LABELS.map((label, i) => {
            const isActive = i === step;
            const isDone = i < step;
            return (
              <React.Fragment key={i}>
                {i > 0 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-colors duration-300 ${isDone ? 'bg-primary' : 'bg-card-border'}`} />
                )}
                <button
                  type="button"
                  onClick={() => { if (isDone) setStep(i); }}
                  disabled={!isDone && !isActive}
                  className={`flex flex-col items-center gap-1.5 group ${isDone ? 'cursor-pointer' : isActive ? 'cursor-default' : 'cursor-not-allowed'}`}
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${isActive ? 'border-primary bg-primary text-white shadow-lg shadow-primary/25 scale-110' :
                      isDone ? 'border-primary bg-primary/10 text-primary' :
                        'border-card-border bg-card text-text-muted'
                    }`}>
                    {isDone ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : STEP_ICONS[i]}
                  </div>
                  <span className={`text-[11px] font-medium whitespace-nowrap transition-colors ${isActive ? 'text-primary font-bold' : isDone ? 'text-primary' : 'text-text-muted'
                    }`}>{label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Step Content ── */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {step === 0 && <Step1ProjectInfo state={state} update={update} />}
        {step === 1 && <Step2MandatoryFiles state={state} update={update} />}
        {step === 2 && (
          <Step3PackageInfo
            state={state}
            update={update}
            accounts={accounts}
            organizations={organizations}
          />
        )}
        {step === 3 && <Step4Groups state={state} update={update} />}
        {step === 4 && <Step5Partners state={state} update={update} organizations={organizations} orgsLoading={orgsLoading} />}
        {step === 5 && (
          <Step6Summary
            state={state}
            organizations={organizations}
            submitting={submitting}
            submitProgress={submitProgress}
            submitError={submitError}
          />
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between border-t border-card-border px-8 py-5 bg-card">
        <button
          type="button"
          onClick={step === 0 ? onCancel : prev}
          disabled={submitting}
          className="flex items-center gap-2 rounded-xl border border-card-border bg-card px-6 py-2.5 text-sm font-semibold text-text-secondary transition-all duration-200 hover:bg-content-bg disabled:opacity-50"
        >
          {step === 0 ? (
            'Hủy'
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
              Quay lại
            </>
          )}
        </button>

        <div className="flex items-center gap-2 text-sm text-text-muted">
          Bước <span className="font-bold text-primary">{step + 1}</span> / {STEP_COUNT}
        </div>

        {step < STEP_COUNT - 1 ? (
          <button
            type="button"
            onClick={next}
            disabled={!canProceed}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-primary-hover disabled:opacity-50"
          >
            Tiếp tục
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-primary px-7 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-primary-hover disabled:opacity-50"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" /></svg>
                {submitProgress}
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                Khởi tạo dự án
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Step 1: Thông tin dự án
   ══════════════════════════════════════════════════════════════ */
function Step1ProjectInfo({ state, update }: { state: StepperState; update: <K extends keyof StepperState>(k: K, v: StepperState[K]) => void }) {
  // Demo images for user to pick (Auto-discover from assets folder)
  const imageModules = import.meta.glob('/src/assets/project-covers/*.{jpg,jpeg,png,webp,gif}', { eager: true, query: '?url', import: 'default' });
  const DEMO_IMAGES = Object.values(imageModules) as string[];

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-text mb-1">Thông tin dự án</h3>
        <p className="text-sm text-text-muted">Nhập thông tin cơ bản về dự án xây dựng.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <SectionLabel required>Tên dự án</SectionLabel>
          <input
            value={state.projectName}
            onChange={(e) => update('projectName', e.target.value)}
            placeholder="VD: Chung cư Sunrise Tower"
            required
            className={inputCls}
          />
        </div>
        <div className="space-y-1.5">
          <SectionLabel>Mã dự án</SectionLabel>
          <input
            value={state.projectCode}
            onChange={(e) => update('projectCode', e.target.value)}
            placeholder="VD: PJ-2026-001"
            className={inputCls}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <SectionLabel>Ảnh đại diện dự án</SectionLabel>
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="shrink-0 w-32 h-32 rounded-2xl border-2 border-dashed border-card-border overflow-hidden bg-content-bg flex items-center justify-center relative group">
            {state.projectImageUrl ? (
              <>
                <img src={state.projectImageUrl} alt="Avatar" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <button type="button" onClick={() => update('projectImageUrl', '')} className="text-white hover:text-danger bg-black/50 p-2 rounded-full transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                  </button>
                </div>
              </>
            ) : (
              <label className="cursor-pointer text-text-muted hover:text-primary transition-colors flex flex-col items-center justify-center w-full h-full gap-2 p-2">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                <span className="text-xs font-semibold text-center leading-tight">Thêm ảnh</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        update('projectImageUrl', reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            )}
          </div>

          <div className="flex-1 space-y-5 w-full">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                <span className="text-sm font-semibold text-text">Bộ sưu tập mẫu</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                {DEMO_IMAGES.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => update('projectImageUrl', url)}
                    className={`relative shrink-0 rounded-xl overflow-hidden border-2 transition-all w-24 h-16 snap-start shadow-sm hover:shadow-md ${state.projectImageUrl === url ? 'border-primary ring-2 ring-primary/20 scale-[1.02]' : 'border-transparent hover:border-primary/50'
                      }`}
                  >
                    <img src={url} alt={`Demo ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                    {state.projectImageUrl === url && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-[1px]">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white drop-shadow-md"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                    )}
                  </button>
                ))}
                {DEMO_IMAGES.length === 0 && (
                  <p className="text-sm text-text-muted italic py-2">Không tìm thấy ảnh mẫu nào.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <SectionLabel>Mô tả dự án</SectionLabel>
        <textarea
          value={state.projectDescription}
          onChange={(e) => update('projectDescription', e.target.value)}
          placeholder="Mô tả ngắn về dự án..."
          rows={3}
          className={inputCls}
        />
      </div>

      <div className="space-y-2 border-t border-card-border pt-5">
        <h4 className="font-heading text-sm font-bold text-text">{t('projects.form.location')}</h4>
        <AddressField
          value={{ address: state.address, latitude: state.latitude, longitude: state.longitude }}
          onChange={(loc) => {
            update('address', loc.address);
            update('latitude', loc.latitude);
            update('longitude', loc.longitude);
          }}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Step 2: Upload hồ sơ bắt buộc
   ══════════════════════════════════════════════════════════════ */
function Step2MandatoryFiles({ state, update }: { state: StepperState; update: <K extends keyof StepperState>(k: K, v: StepperState[K]) => void }) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-text mb-1">Hồ sơ dự án bắt buộc</h3>
        <p className="text-sm text-text-muted">
          Tải lên các tài liệu pháp lý bắt buộc cho dự án (Quyết định phê duyệt, Giấy phép xây dựng, ...).
          Các file sẽ được lưu vào thư mục <span className="font-semibold text-primary">/WIP/Chủ đầu tư</span> sau khi dự án được khởi tạo.
        </p>
      </div>

      <FileDropzone
        files={state.mandatoryFiles}
        onAdd={(newFiles) => update('mandatoryFiles', [...state.mandatoryFiles, ...newFiles])}
        onRemove={(idx) => update('mandatoryFiles', state.mandatoryFiles.filter((_, i) => i !== idx))}
        label="Tải lên tài liệu"
        hint="Hỗ trợ PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, DWG, IFC, RVT..."
      />

      {state.mandatoryFiles.length === 0 && (
        <div className="rounded-xl border border-dashed border-card-border bg-content-bg p-6 text-center">
          <p className="text-sm text-text-muted">Chưa có tài liệu nào. Bạn có thể bỏ qua bước này và tải lên sau.</p>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Step 3: Gói thầu & Hợp đồng
   ══════════════════════════════════════════════════════════════ */
function Step3PackageInfo({
  state, update, accounts, organizations,
}: {
  state: StepperState;
  update: <K extends keyof StepperState>(k: K, v: StepperState[K]) => void;
  accounts: Account[];
  organizations: Organization[];
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);

  const handlePackageSubmit = async (payload: CreateContractPackagePayload, files: File[]) => {
    if (editingPackageId) {
      update('packages', state.packages.map(p =>
        p.id === editingPackageId ? { ...p, payload, files } : p
      ));
    } else {
      update('packages', [...state.packages, { id: newKey(), payload, files }]);
    }
    setIsFormOpen(false);
  };

  const removePackage = (id: string) => {
    update('packages', state.packages.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-text mb-1">Thông tin gói thầu & Hợp đồng</h3>
        <p className="text-sm text-text-muted">Khởi tạo các gói thầu cho dự án. Bạn có thể thêm nhiều gói thầu hoặc bỏ qua bước này.</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-card-border pb-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">1</span>
          <h4 className="text-sm font-semibold text-primary">Danh sách Gói thầu</h4>
        </div>

        {state.packages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-card-border bg-content-bg p-6 text-center">
            <p className="text-sm text-text-muted">Chưa có gói thầu nào. Bạn có thể thêm gói thầu hoặc bỏ qua bước này.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {state.packages.map((pkgItem) => (
              <div key={pkgItem.id} className="flex items-center justify-between p-4 rounded-xl border border-card-border bg-card">
                <div>
                  <h5 className="font-bold text-text text-lg">{pkgItem.payload.name}</h5>
                  <div className="text-sm text-text-muted mt-2 space-y-1">
                    <p>
                      Giá trị: <span className="font-semibold text-text">{pkgItem.payload.contractValue ? new Intl.NumberFormat('vi-VN').format(pkgItem.payload.contractValue) + ' ' + (pkgItem.payload.currency || 'VND') : 'Chưa nhập'}</span>
                    </p>
                    {pkgItem.payload.contractValue ? (
                      <p className="italic">
                        Bằng chữ: <span className="font-semibold text-text not-italic">{numberToWordsVN(pkgItem.payload.contractValue)}</span>
                      </p>
                    ) : null}

                    {pkgItem.payload.contractorOrganizationId && (() => {
                      const org = organizations.find(o => o.id === pkgItem.payload.contractorOrganizationId);
                      return (
                        <div className="flex items-center gap-1.5 flex-wrap mt-2 pt-2 border-t border-card-border/50">
                          <span className="text-text-muted">Đối tác:</span>
                          <span className="inline-flex items-center gap-1 rounded-md bg-content-bg px-2 py-0.5 text-xs font-medium text-text border border-input-border">
                            {org ? (org.displayName || org.legalName) : 'Unknown'}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPackageId(pkgItem.id);
                      setIsFormOpen(true);
                    }}
                    className="p-2 text-text-muted hover:text-primary transition-colors"
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => removePackage(pkgItem.id)}
                    className="p-2 text-text-muted hover:text-danger transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setEditingPackageId(null);
            setIsFormOpen(true);
          }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 py-4 font-semibold text-primary transition-colors hover:border-primary/50 hover:bg-primary/10"
        >
          + Thêm gói thầu
        </button>
      </section>

      {/* Package Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-card-border bg-card/80 px-6 py-4 backdrop-blur-xl">
              <h3 className="text-xl font-bold text-text">{editingPackageId ? 'Chỉnh sửa Gói thầu' : 'Thêm Gói thầu mới'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="rounded-full p-2 text-text-muted transition-colors hover:bg-content-bg hover:text-text">
                &times;
              </button>
            </div>
            <div className="p-6">
              <CreatePackageForm
                accounts={accounts}
                initialData={
                  editingPackageId
                    ? (() => {
                      const pkgState = state.packages.find((p) => p.id === editingPackageId);
                      if (!pkgState) return undefined;
                      const p = pkgState.payload;
                      return {
                        ...p,
                        id: editingPackageId,
                        assignments: p.contractorOrganizationId ? [{
                          id: `draft-0`,
                          organizationId: p.contractorOrganizationId,
                          role: 0,
                          representativeAccountId: p.representativeAccountId,
                          contractNumber: p.contractNumber,
                          contractSignDate: p.contractSignDate,
                          position: p.contractJobTitle,
                        }] : []
                      } as any;
                    })()
                    : undefined
                }
                onSubmit={handlePackageSubmit}
                onCancel={() => setIsFormOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Step 4: Quản lý nhóm
   ══════════════════════════════════════════════════════════════ */
function Step4Groups({ state, update }: { state: StepperState; update: <K extends keyof StepperState>(k: K, v: StepperState[K]) => void }) {
  const groups = state.groups;
  const setGroups = (fn: (prev: GroupDraft[]) => GroupDraft[]) =>
    update('groups', fn(groups));

  const updateGroup = (key: string, patch: Partial<GroupDraft>) =>
    setGroups((prev) => prev.map((g) => (g.key === key ? { ...g, ...patch } : g)));

  const addGroup = () =>
    setGroups((prev) => [...prev, { key: newKey(), name: '', description: '', organizationId: '' }]);

  const removeGroup = (key: string) =>
    setGroups((prev) => prev.filter((g) => g.key !== key));

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-text mb-1">Quản lý nhóm trong dự án</h3>
          <p className="text-sm text-text-muted">Thiết lập các nhóm tham gia dự án. Nhóm mặc định đã được tạo sẵn.</p>
        </div>
        <button
          type="button"
          onClick={addGroup}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-ghost"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Thêm nhóm
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-card-border bg-content-bg p-6 text-center">
          <p className="text-sm text-text-muted">Chưa có nhóm nào. Bạn có thể thêm nhóm mới hoặc bỏ qua.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group, idx) => (
            <div key={group.key} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-xl border border-card-border bg-card shadow-sm hover:border-primary/40 hover:shadow-md transition-all group/item">
              <div className="flex w-8 h-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold shadow-sm">
                {idx + 1}
              </div>
              <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                <input
                  value={group.name}
                  onChange={(e) => updateGroup(group.key, { name: e.target.value })}
                  placeholder="Tên nhóm (VD: Tư vấn thiết kế) *"
                  className="w-full rounded-lg border border-transparent bg-input-bg/60 px-3.5 py-2 text-sm text-text outline-none transition-all hover:bg-input-bg focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20 placeholder:text-text-placeholder font-medium"
                />
                <input
                  value={group.description}
                  onChange={(e) => updateGroup(group.key, { description: e.target.value })}
                  placeholder="Mô tả nhóm (không bắt buộc)..."
                  className="w-full rounded-lg border border-transparent bg-input-bg/60 px-3.5 py-2 text-sm text-text outline-none transition-all hover:bg-input-bg focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20 placeholder:text-text-placeholder"
                />
              </div>
              <button
                type="button"
                onClick={() => removeGroup(group.key)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-muted transition-all duration-150 hover:bg-danger/10 hover:text-danger sm:opacity-0 group-hover/item:opacity-100 focus:opacity-100"
                title="Xóa nhóm"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Step 5: Thêm đối tác vào nhóm
   ══════════════════════════════════════════════════════════════ */
function Step5Partners({
  state, update, organizations, orgsLoading,
}: {
  state: StepperState;
  update: <K extends keyof StepperState>(k: K, v: StepperState[K]) => void;
  organizations: Organization[];
  orgsLoading: boolean;
}) {
  const groups = state.groups.filter((g) => g.name.trim());

  const setOrgForGroup = (groupKey: string, organizationId: string) =>
    update('groups', state.groups.map((g) => (g.key === groupKey ? { ...g, organizationId } : g)));

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-text mb-1">Thêm đối tác vào nhóm</h3>
        <p className="text-sm text-text-muted">Gán công ty / tổ chức (đối tác) cho từng nhóm trong dự án.</p>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-card-border bg-content-bg p-6 text-center">
          <p className="text-sm text-text-muted">Chưa có nhóm nào. Vui lòng quay lại bước trước để thêm nhóm.</p>
        </div>
      ) : orgsLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-text-muted">{t('common.loading')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const selectedOrg = organizations.find((o) => o.id === group.organizationId);
            return (
              <div key={group.key} className="rounded-xl border border-card-border bg-card transition-all hover:border-primary/30 shadow-sm overflow-hidden flex flex-col md:flex-row md:items-center">
                <div className="flex items-center gap-3 p-4 md:w-5/12 md:border-r border-card-border bg-content-bg/50">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                  </span>
                  <div>
                    <p className="text-sm font-bold text-text">{group.name}</p>
                    <p className="text-xs text-text-muted mt-0.5">Nhóm đối tác</p>
                  </div>
                </div>

                <div className="p-4 md:w-7/12 md:flex-1">
                  {selectedOrg ? (
                    <div className="flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-primary/5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white font-bold text-lg shadow-sm">
                          {(selectedOrg.displayName || selectedOrg.legalName).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-text leading-tight">{selectedOrg.displayName || selectedOrg.legalName}</p>
                          {selectedOrg.taxCode && <p className="text-xs text-text-muted mt-0.5">MST: {selectedOrg.taxCode}</p>}
                        </div>
                      </div>
                      <button type="button" onClick={() => setOrgForGroup(group.key, '')} className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors" title="Đổi đối tác">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                      </button>
                    </div>
                  ) : (
                    <select
                      value={group.organizationId || ''}
                      onChange={(e) => setOrgForGroup(group.key, e.target.value)}
                      className={inputCls}
                    >
                      <option value=""> Chọn đối tác cho nhóm này </option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.displayName || org.legalName}{org.taxCode ? ` (MST: ${org.taxCode})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Step 6: Tổng kết & Khởi tạo
   ══════════════════════════════════════════════════════════════ */
function Step6Summary({
  state, organizations, submitting, submitProgress, submitError,
}: {
  state: StepperState;
  organizations: Organization[];
  submitting: boolean;
  submitProgress: string;
  submitError: string | null;
}) {
  const validGroups = state.groups.filter((g) => g.name.trim());
  const getOrgName = (id: string) => {
    const org = organizations.find((o) => o.id === id);
    return org ? (org.displayName || org.legalName) : '—';
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      <div>
        <h3 className="text-lg font-bold text-text mb-1">Xác nhận khởi tạo dự án</h3>
        <p className="text-sm text-text-muted">Kiểm tra lại toàn bộ thông tin trước khi khởi tạo.</p>
      </div>

      {/* Project Info */}
      <div className="rounded-xl border border-card-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
          Thông tin dự án
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-text-muted">Tên dự án:</span> <span className="font-semibold text-text">{state.projectName}</span></div>
          {state.projectDescription && <div className="col-span-2"><span className="text-text-muted">Mô tả:</span> <span className="text-text">{state.projectDescription}</span></div>}
          {state.address && <div className="col-span-2"><span className="text-text-muted">Địa chỉ:</span> <span className="text-text">{state.address}</span></div>}
        </div>
      </div>

      {/* Mandatory files */}
      <div className="rounded-xl border border-card-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
          Hồ sơ bắt buộc
        </div>
        {state.mandatoryFiles.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {state.mandatoryFiles.map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-primary/5 border border-primary/20 px-3 py-1.5 text-xs font-medium text-text">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                {f.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted italic">Không có file nào</p>
        )}
      </div>

      {/* Packages info */}
      {state.packages.length > 0 && (
        <div className="rounded-xl border border-card-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
            Gói thầu ({state.packages.length})
          </div>
          <div className="space-y-3">
            {state.packages.map((pkgItem, i) => {
              const vat = pkgItem.payload.contractValue ? (Number(pkgItem.payload.contractValue) * (pkgItem.payload.taxRate ?? 10)) / 100 : 0;
              const total = pkgItem.payload.contractValue ? Number(pkgItem.payload.contractValue) + vat : 0;

              return (
                <div key={pkgItem.id} className="border border-card-border rounded-lg p-3 bg-input-bg">
                  <div className="font-semibold text-text mb-2">{i + 1}. {pkgItem.payload.name}</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {pkgItem.payload.startDate && <div><span className="text-text-muted">Khởi công:</span> <span className="text-text">{pkgItem.payload.startDate}</span></div>}
                    {pkgItem.payload.endDate && <div><span className="text-text-muted">Kết thúc:</span> <span className="text-text">{pkgItem.payload.endDate}</span></div>}
                    {pkgItem.payload.contractValue !== undefined && pkgItem.payload.contractValue !== 0 && (
                      <div className="col-span-2 rounded-lg bg-content-bg mt-1 p-3 space-y-2 border border-card-border/50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div><span className="text-text-muted block sm:inline mb-1 sm:mb-0">Giá trị hợp đồng:</span> <span className="text-text font-semibold whitespace-nowrap">{fmtCurrency(Number(pkgItem.payload.contractValue), pkgItem.payload.currency ?? 'VND')}</span></div>
                          <div><span className="text-text-muted block sm:inline mb-1 sm:mb-0">Tổng giá trị (sau VAT):</span> <span className="text-primary font-bold whitespace-nowrap">{fmtCurrency(total, pkgItem.payload.currency ?? 'VND')}</span></div>
                        </div>
                        <p className="text-sm italic text-text-muted border-t border-card-border/50 pt-2">
                          Bằng chữ (Tổng giá trị): <span className="font-semibold text-text not-italic">{numberToWordsVN(total)}</span>
                        </p>
                      </div>
                    )}
                  </div>
                  {pkgItem.files.length > 0 && (
                    <div className="col-span-full mt-2 pt-3 border-t border-card-border">
                      <span className="text-text-muted text-sm block mb-2">Tài liệu đính kèm:</span>
                      <div className="flex flex-wrap gap-2">
                        {pkgItem.files.map((f, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1.5 rounded-lg bg-primary/5 border border-primary/20 px-3 py-1.5 text-xs font-medium text-text">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                            {f.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Groups */}
      <div className="rounded-xl border border-card-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
          Nhóm ({validGroups.length})
        </div>
        {validGroups.length > 0 ? (
          <div className="space-y-2">
            {validGroups.map((g) => (
              <div key={g.key} className="flex items-center justify-between rounded-lg bg-content-bg px-4 py-2.5 text-sm">
                <span className="font-medium text-text">{g.name}</span>
                {g.organizationId ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{getOrgName(g.organizationId)}</span>
                ) : (
                  <span className="text-xs text-text-placeholder italic">Chưa gán đối tác</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted italic">Không có nhóm nào</p>
        )}
      </div>

      {/* Submit status */}
      {submitting && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 flex items-center gap-4">
          <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" /></svg>
          <div>
            <p className="text-sm font-semibold text-primary">{submitProgress}</p>
            <p className="text-xs text-text-muted mt-0.5">Vui lòng không đóng trang trong quá trình khởi tạo.</p>
          </div>
        </div>
      )}
      {submitError && (
        <div className="rounded-xl border border-danger/30 bg-danger-light p-5">
          <p className="text-sm font-medium text-danger">{submitError}</p>
        </div>
      )}
    </div>
  );
}
