import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Account } from '@/entities/account';
import { accountApi } from '@/entities/account';
import type { ContractPackage, CreateContractPackagePayload } from '@/entities/contractPackage';
import { contractPackageApi } from '@/entities/contractPackage';
import { fileItemApi } from '@/entities/file-item';
import type { FolderTreeNodeDto } from '@/entities/folder';
import { folderApi } from '@/entities/folder';
import { groupApi } from '@/entities/group';
import type { Organization } from '@/entities/organization';
import { organizationApi } from '@/entities/organization';
import type { BepParseResult } from '@/entities/project';
import { projectApi, ProjectParticipantRole } from '@/entities/project';
import { getApiErrorMessage } from '@/shared/api';
import { ActionIconButton, DeleteIcon, EditIcon, RowActions } from '@/shared/components';
import { numberToWordsVN } from '@/shared/lib/format';
import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';
import { sortByNewest } from '@/shared/lib/sort';
import { AddressField } from './AddressField';
import { ManagerAccountPicker } from './ManagerAccountPicker';

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
  projectImage: File | null;
  projectDescription: string;
  ownerOrganizationId: string;
  contactAddress: string;
  address: string;
  latitude: string;
  longitude: string;
  /* Step 2 */
  mandatoryFiles: File[];
  /* Step 3 */
  packages: StepperPackage[];
  /* Step 4 & 5 */
  groups: GroupDraft[];
  managerAccountId: string;
}

/* ══════════════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════════════ */

const STEP_COUNT = 6;

const STEP_LABEL_KEYS: TranslationKey[] = [
  'projects.stepper.step1',
  'projects.stepper.step2',
  'projects.stepper.step3',
  'projects.stepper.step4',
  'projects.stepper.step5',
  'projects.stepper.step6',
];

/** Thư mục hệ thống nhận hồ sơ pháp lý — do FolderBootstrapService (BE) tạo sẵn. */
const LEGAL_FOLDER_NAME = 'Hồ sơ pháp lý';
const LEGAL_FOLDER_PATH = `/Published/${LEGAL_FOLDER_NAME}`;

const DEFAULT_GROUP_KEYS: TranslationKey[] = [
  'projects.defaultGroup.owner',
  'projects.defaultGroup.design',
  'projects.defaultGroup.verification',
  'projects.defaultGroup.contractor',
  'projects.defaultGroup.supervision',
];

const newKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `g-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const buildDefaultGroups = (): GroupDraft[] =>
  DEFAULT_GROUP_KEYS.map((key) => ({ key: newKey(), name: t(key), description: '', organizationId: null }));

/* ── Khởi tạo nhanh từ BEP: seed state + match tên tổ chức -> Guid ── */
const buildInitialState = (bep?: BepParseResult): StepperState => {
  const groups: GroupDraft[] =
    bep && bep.groups.length > 0
      ? bep.groups.map((g) => ({
          key: newKey(),
          name: g.name,
          description: g.description ?? '',
          organizationId: null,
        }))
      : buildDefaultGroups();

  const packages: StepperPackage[] =
    bep && bep.packages.length > 0
      ? bep.packages.map((p) => ({
          id: newKey(),
          payload: {
            projectId: '',
            name: p.name,
            description: p.description ?? undefined,
            contractValue: p.contractValue ?? undefined,
            currency: p.currency ?? undefined,
            isDefault: true,
          },
          files: [],
        }))
      : [];

  return {
    projectName: bep?.projectName ?? '',
    projectCode: bep?.projectCode ?? '',
    projectImage: null,
    projectDescription: bep?.projectDescription ?? '',
    ownerOrganizationId: '',
    contactAddress: bep?.contactAddress ?? '',
    address: bep?.address ?? '',
    latitude: '',
    longitude: '',
    mandatoryFiles: [],
    packages,
    groups,
    managerAccountId: '',
  };
};

// Chuẩn hoá tiếng Việt (bỏ dấu, đ->d, gộp khoảng trắng) để so khớp tên tổ chức.
const stripVN = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const matchOrg = (name: string | null | undefined, orgs: Organization[]): Organization | undefined => {
  if (!name) return undefined;
  const target = stripVN(name);
  if (!target) return undefined;
  return orgs.find((o) => {
    const dn = stripVN(o.displayName || '');
    const ln = stripVN(o.legalName || '');
    const hit = (v: string) => v.length > 0 && (v === target || v.includes(target) || target.includes(v));
    return hit(dn) || hit(ln);
  });
};

const inputCls =
  'w-full rounded-[var(--radius-input)] border border-input-border bg-input-bg px-4 py-3 text-sm text-text outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20';

const selectCls = 'field-select py-3';

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
    <label className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-text-secondary">
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
        <p className="text-sm font-semibold text-text-muted">{t('projects.stepper.dropzone.drag')}</p>
        <p className="text-xs text-text-placeholder mt-1">{t('projects.stepper.dropzone.browse')}</p>
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

/* Form gói thầu nằm ở feature khác — trang cha dựng rồi truyền vào qua slot này. */
export interface PackageFormSlotContext {
  accounts: Account[];
  initialData?: ContractPackage;
  onSubmit: (payload: CreateContractPackagePayload, files: File[]) => Promise<void>;
  onCancel: () => void;
}

export interface CreateProjectStepperProps {
  onComplete: (projectId: string) => void;
  onCancel: () => void;
  /** Kết quả AI đọc BEP để prefill sẵn các bước (khởi tạo nhanh). */
  initialData?: BepParseResult;
  renderPackageForm: (ctx: PackageFormSlotContext) => React.ReactNode;
}

export function CreateProjectStepper({ onComplete, onCancel, initialData, renderPackageForm }: CreateProjectStepperProps) {
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
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
        setOrganizations(sortByNewest(orgRes.data.result ?? [], (o) => o.createdAt));
        setAccounts(sortByNewest(accRes.data.result ?? [], (a) => a.createdAt));
      })
      .catch(() => { })
      .finally(() => setOrgsLoading(false));
  }, []);

  /* ── Form state (prefill từ BEP nếu có) ── */
  const [state, setState] = useState<StepperState>(() => buildInitialState(initialData));

  const update = useCallback(<K extends keyof StepperState>(key: K, value: StepperState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  /* ── Match tên tổ chức (BEP chỉ có text) -> Guid, chạy 1 lần sau khi orgs load ── */
  const orgMatchedRef = useRef(false);
  useEffect(() => {
    if (orgMatchedRef.current || !initialData || organizations.length === 0) return;
    orgMatchedRef.current = true;
    setState((prev) => ({
      ...prev,
      ownerOrganizationId:
        matchOrg(initialData.ownerOrganizationName, organizations)?.id ?? prev.ownerOrganizationId,
      groups: prev.groups.map((g, i) => {
        const org = matchOrg(initialData.groups[i]?.partnerOrganizationName, organizations);
        return org ? { ...g, organizationId: org.id } : g;
      }),
      packages: prev.packages.map((p, i) => {
        const org = matchOrg(initialData.packages[i]?.contractorOrganizationName, organizations);
        return org
          ? { ...p, payload: { ...p.payload, contractorOrganizationId: org.id } }
          : p;
      }),
    }));
  }, [organizations, initialData]);

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

  const goToStep = (target: number) => {
    setStep(target);
    setMaxStep((m) => Math.max(m, target));
  };

  const next = () => {
    if (step < STEP_COUNT - 1 && canProceed) {
      goToStep(step + 1);
    }
  };
  const prev = () => { if (step > 0) setStep(step - 1); };


  /* ══════════════════════════════════════════════════════════
     SUBMIT – Cascade of API calls
     ══════════════════════════════════════════════════════════ */
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    let createdProjectId: string | null = null;
    
    try {
      /* 1. Create project */
      setSubmitProgress(t('projects.stepper.progress.creatingProject'));
      const lat = Number.parseFloat(state.latitude);
      const lng = Number.parseFloat(state.longitude);
      const { data: projectRes } = await projectApi.create({
        projectName: state.projectName.trim(),
        projectCode: state.projectCode.trim() || undefined,
        projectDescription: state.projectDescription.trim() || undefined,
        ownerOrganizationId: state.ownerOrganizationId || undefined,
        contactAddress: state.contactAddress.trim() || undefined,
        address: state.address.trim() || undefined,
        latitude: Number.isFinite(lat) ? lat : undefined,
        longitude: Number.isFinite(lng) ? lng : undefined,
      });
      const project = projectRes.result;
      if (!project) throw new Error(t('projects.stepper.error.createFailed'));
      createdProjectId = project.id;

      if (state.projectImage) {
        await projectApi.uploadImage(project.id, state.projectImage);
      }

      if (state.managerAccountId) {
        setSubmitProgress(t('projects.stepper.progress.assigningManager'));
        await projectApi.assignManager(project.id, { accountId: state.managerAccountId });
      }

      /* 2. Upload mandatory files to /Published/Hồ sơ pháp lý */
      if (state.mandatoryFiles.length > 0) {
        setSubmitProgress(t('projects.stepper.progress.uploadingLegal'));
        // Find the Published > Hồ sơ pháp lý folder
        const { data: treeRes } = await folderApi.getTree(project.id, 2); // area=Published
        const tree = treeRes.result ?? [];
        const legalFolderId = findFolderByName(tree, LEGAL_FOLDER_NAME);

        const detectFileType = (fileName: string): number => {
          const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
          if (ext === 'pdf') return 0;
          if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) return 2;
          if (ext === 'ifc') return 1;
          if (['dwg', 'dxf', 'rvt', 'nwc', 'nwd', 'dgn'].includes(ext)) return 3;
          if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'txt'].includes(ext)) return 4;
          return 5;
        };

        if (legalFolderId) {
          for (const file of state.mandatoryFiles) {
            const formData = new FormData();
            formData.append('FolderId', legalFolderId);
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
        setSubmitProgress(t('projects.stepper.progress.creatingGroups'));
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
          setSubmitProgress(t('projects.stepper.progress.addingGroups'));
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
        setSubmitProgress(t('projects.stepper.progress.creatingPackages'));

        const detectFileType = (fileName: string): number => {
          const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
          if (ext === 'pdf') return 0;
          if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) return 2;
          if (ext === 'ifc') return 1;
          if (['dwg', 'dxf', 'rvt', 'nwc', 'nwd', 'dgn'].includes(ext)) return 3;
          if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'txt'].includes(ext)) return 4;
          return 5;
        };

        for (const [index, pkgItem] of state.packages.entries()) {
          setSubmitProgress(t('projects.stepper.progress.creatingPackage') + ` ${pkgItem.payload.name}...`);
          const pkgPayload: CreateContractPackagePayload = {
            // isDefault: chỉ gói ĐẦU TIÊN là gói mặc định của dự án.
            ...pkgItem.payload,
            projectId: project.id,
            isDefault: index === 0,
          };
          const pkgRes = await contractPackageApi.create(pkgPayload);
          const documentFolderId = pkgRes.data?.result?.documentFolderId;

          if (documentFolderId && pkgItem.files.length > 0) {
            setSubmitProgress(`${t('projects.stepper.progress.uploadingPackageFiles')} ${pkgItem.payload.name}...`);

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

      setSubmitProgress(t('projects.stepper.progress.done'));
      onComplete(createdProjectId!);
    } catch (err) {
      if (createdProjectId) {
        try {
          await projectApi.delete(createdProjectId);
        } catch (deleteErr) {
          console.error("Failed to rollback project creation", deleteErr);
        }
      }
      setSubmitError(getApiErrorMessage(err, t('common.error')));
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
    <div className="flex h-full min-h-0 flex-col">
      {/* ── Stepper Header ── */}
      <div className="shrink-0 px-8 pt-6 pb-7">
        <div className="flex items-start">
          {STEP_LABEL_KEYS.map((labelKey, i) => {
            const isActive = i === step;
            const isDone = i < step;
            const isVisited = i <= maxStep;
            const canJump = isDone || (isVisited && canProceed);
            return (
              <React.Fragment key={i}>
                {i > 0 && (
                  <div className={`mt-4 h-0.5 min-w-4 flex-1 transition-colors duration-300 ${i <= maxStep ? 'bg-primary' : 'bg-card-border'}`} />
                )}
                <button
                  type="button"
                  onClick={() => { if (canJump) goToStep(i); }}
                  disabled={!canJump && !isActive}
                  className={`flex w-24 shrink-0 flex-col items-center gap-2 ${canJump && !isActive ? 'cursor-pointer' : isActive ? 'cursor-default' : 'cursor-not-allowed'}`}
                >
                  <span className="relative">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${isActive ? 'bg-primary text-white' :
                      isVisited ? 'bg-primary/15 text-primary' :
                        'bg-content-bg text-text-placeholder'
                      }`}>
                      {isDone ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      ) : i + 1}
                    </span>
                    {isActive && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent-amber" />}
                  </span>
                  <span className={`text-center text-xs leading-tight transition-colors ${isActive ? 'font-semibold text-text' : isVisited ? 'text-primary' : 'text-text-muted'
                    }`}>{t(labelKey)}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Step Content ── */}
      <div className="admin-scrollbar min-h-0 flex-1 overflow-y-auto px-8 py-6">
        {step === 0 && (
          <Step1ProjectInfo
            state={state}
            update={update}
            organizations={organizations}
            orgsLoading={orgsLoading}
          />
        )}
        {step === 1 && <Step2MandatoryFiles state={state} update={update} />}
        {step === 2 && (
          <Step3PackageInfo
            state={state}
            update={update}
            accounts={accounts}
            organizations={organizations}
            renderPackageForm={renderPackageForm}
          />
        )}
        {step === 3 && <Step4Groups state={state} update={update} accounts={accounts} />}
        {step === 4 && <Step5Partners state={state} update={update} organizations={organizations} orgsLoading={orgsLoading} />}
        {step === 5 && (
          <Step6Summary
            state={state}
            organizations={organizations}
            accounts={accounts}
            submitting={submitting}
            submitProgress={submitProgress}
            submitError={submitError}
          />
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex shrink-0 items-center justify-between border-t border-card-border/60 px-8 py-5 bg-card">
        <button
          type="button"
          onClick={step === 0 ? onCancel : prev}
          disabled={submitting}
          className="flex items-center gap-2 rounded-[var(--radius-button)] px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-content-bg hover:text-text disabled:opacity-50"
        >
          {step === 0 ? (
            t('account.cancel')
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
              {t('projects.stepper.back')}
            </>
          )}
        </button>

        {step < STEP_COUNT - 1 ? (
          <button
            type="button"
            onClick={next}
            disabled={!canProceed}
            className="flex items-center gap-2 rounded-[var(--radius-button)] bg-primary px-7 py-3 text-sm font-semibold text-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] transition-all duration-200 hover:bg-primary-hover disabled:opacity-50 disabled:shadow-none"
          >
            {t('projects.stepper.next')}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 rounded-[var(--radius-button)] bg-primary px-7 py-3 text-sm font-semibold text-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] transition-all duration-200 hover:bg-primary-hover disabled:opacity-50 disabled:shadow-none"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" /></svg>
                {submitProgress}
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                {t('projects.stepper.submit')}
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
function Step1ProjectInfo({
  state, update, organizations, orgsLoading,
}: {
  state: StepperState;
  update: <K extends keyof StepperState>(k: K, v: StepperState[K]) => void;
  organizations: Organization[];
  orgsLoading: boolean;
}) {
  const [projectImagePreview, setProjectImagePreview] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const pickProjectImage = (file: File | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = file ? URL.createObjectURL(file) : null;
    setProjectImagePreview(previewUrlRef.current);
    update('projectImage', file);
  };

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  return (
    <div className="grid animate-fade-in gap-8 lg:grid-cols-2">
      <div className="space-y-5">
        <div>
          <SectionLabel required>{t('projects.form.name')}</SectionLabel>
          <input
            value={state.projectName}
            onChange={(e) => update('projectName', e.target.value)}
            placeholder={t('projects.stepper.s1.namePlaceholder')}
            required
            className={inputCls}
          />
        </div>

        <div>
          <SectionLabel>{t('projects.stepper.s1.code')}</SectionLabel>
          <input
            value={state.projectCode}
            onChange={(e) => update('projectCode', e.target.value)}
            placeholder={t('projects.stepper.s1.codePlaceholder')}
            className={inputCls}
          />
        </div>

        <div>
          <SectionLabel>{t('projects.form.description')}</SectionLabel>
          <textarea
            value={state.projectDescription}
            onChange={(e) => update('projectDescription', e.target.value)}
            placeholder={t('projects.stepper.s1.descPlaceholder')}
            rows={3}
            className={inputCls}
          />
        </div>

        {/* Chủ đầu tư — trường thông tin đầu tiên của BEP, lưu FK sang Organizations */}
        <div>
          <SectionLabel>{t('projects.form.owner')}</SectionLabel>
          <select
            value={state.ownerOrganizationId}
            onChange={(e) => update('ownerOrganizationId', e.target.value)}
            disabled={orgsLoading}
            className={selectCls}
          >
            <option value="">{orgsLoading ? t('common.loading') : t('projects.form.ownerSelect')}</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.displayName || org.legalName}{org.taxCode ? ` (MST: ${org.taxCode})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Địa chỉ liên hệ — TÁCH khỏi địa điểm công trình bên dưới */}
        <div>
          <SectionLabel>{t('projects.form.contactAddress')}</SectionLabel>
          <input
            value={state.contactAddress}
            onChange={(e) => update('contactAddress', e.target.value)}
            placeholder={t('projects.form.contactAddress')}
            className={inputCls}
          />
          <p className="mt-1.5 text-xs text-text-muted">{t('projects.form.contactAddressHint')}</p>
        </div>

        <AddressField
          value={{ address: state.address, latitude: state.latitude, longitude: state.longitude }}
          onChange={(loc) => {
            update('address', loc.address);
            update('latitude', loc.latitude);
            update('longitude', loc.longitude);
          }}
        />
      </div>

      <div className="flex flex-col">
        <SectionLabel>{t('projects.stepper.s1.image')}</SectionLabel>
        <div className="group relative flex min-h-[260px] flex-1 items-center justify-center overflow-hidden rounded-[var(--radius-card)] border-2 border-dashed border-card-border bg-content-bg/60">
            {projectImagePreview ? (
              <>
                <img src={projectImagePreview} alt={t('projects.stepper.s1.image')} className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => pickProjectImage(null)}
                    title={t('projects.stepper.s1.removeImage')}
                    className="rounded-full bg-black/50 p-2 text-white transition-colors hover:text-danger"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                  </button>
                </div>
              </>
            ) : (
              <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 p-4 text-text-muted transition-colors hover:text-primary">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary/50">
                  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                  <polyline points="12 16 12 10" />
                  <polyline points="9 13 12 10 15 13" />
                </svg>
                <span className="text-sm font-semibold">{t('projects.stepper.s1.addImage')}</span>
                <span className="text-xs text-text-placeholder">{t('projects.stepper.s1.imageHint')}</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    pickProjectImage(file ?? null);
                  }}
                />
              </label>
          )}
        </div>
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
        <h3 className="heading-section mb-1">{t('projects.stepper.step2')}</h3>
        <p className="text-sm text-text-muted">
          {t('projects.stepper.s2.desc')}{' '}
          {t('projects.stepper.s2.savedToPrefix')}{' '}
          <span className="font-semibold text-primary">{LEGAL_FOLDER_PATH}</span>{' '}
          {t('projects.stepper.s2.savedToSuffix')}
        </p>
      </div>

      <FileDropzone
        files={state.mandatoryFiles}
        onAdd={(newFiles) => update('mandatoryFiles', [...state.mandatoryFiles, ...newFiles])}
        onRemove={(idx) => update('mandatoryFiles', state.mandatoryFiles.filter((_, i) => i !== idx))}
        label={t('projects.stepper.s2.uploadLabel')}
        hint={t('projects.stepper.s2.hint')}
      />

      {state.mandatoryFiles.length === 0 && (
        <div className="rounded-xl border border-dashed border-card-border bg-content-bg p-6 text-center">
          <p className="text-sm text-text-muted">{t('projects.stepper.s2.empty')}</p>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Step 3: Gói thầu & Hợp đồng
   ══════════════════════════════════════════════════════════════ */
function Step3PackageInfo({
  state, update, accounts, organizations, renderPackageForm,
}: {
  state: StepperState;
  update: <K extends keyof StepperState>(k: K, v: StepperState[K]) => void;
  accounts: Account[];
  organizations: Organization[];
  renderPackageForm: (ctx: PackageFormSlotContext) => React.ReactNode;
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
        <h3 className="heading-section mb-1">{t('projects.stepper.s3.title')}</h3>
        <p className="text-sm text-text-muted">{t('projects.stepper.s3.subtitle')}</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-card-border pb-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">1</span>
          <h4 className="heading-label text-primary">{t('projects.stepper.s3.listTitle')}</h4>
        </div>

        {state.packages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-card-border bg-content-bg p-6 text-center">
            <p className="text-sm text-text-muted">{t('projects.stepper.s3.empty')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {state.packages.map((pkgItem) => (
              <div key={pkgItem.id} className="flex items-center justify-between p-4 rounded-[var(--radius-card)] border border-card-border bg-card">
                <div>
                  <h5 className="font-bold text-text text-lg">{pkgItem.payload.name}</h5>
                  <div className="text-sm text-text-muted mt-2 space-y-1">
                    <p>
                      {t('projects.stepper.s3.value')}: <span className="font-semibold text-text">{pkgItem.payload.contractValue ? new Intl.NumberFormat('vi-VN').format(pkgItem.payload.contractValue) + ' ' + (pkgItem.payload.currency || 'VND') : t('projects.stepper.s3.notEntered')}</span>
                    </p>
                    {pkgItem.payload.contractValue ? (
                      <p className="italic">
                        {t('projects.stepper.s3.inWords')}: <span className="font-semibold text-text not-italic">{numberToWordsVN(pkgItem.payload.contractValue)}</span>
                      </p>
                    ) : null}

                    {pkgItem.payload.contractorOrganizationId && (() => {
                      const org = organizations.find(o => o.id === pkgItem.payload.contractorOrganizationId);
                      return (
                        <div className="flex items-center gap-1.5 flex-wrap mt-2 pt-2 border-t border-card-border/50">
                          <span className="text-text-muted">{t('projects.stepper.s3.partner')}:</span>
                          <span className="inline-flex items-center gap-1 rounded-md bg-content-bg px-2 py-0.5 text-xs font-medium text-text border border-input-border">
                            {org ? (org.displayName || org.legalName) : t('projects.stepper.s3.unknownOrg')}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <RowActions>
                  <ActionIconButton
                    tone="primary"
                    label={t('projects.stepper.s3.edit')}
                    icon={<EditIcon />}
                    onClick={() => {
                      setEditingPackageId(pkgItem.id);
                      setIsFormOpen(true);
                    }}
                  />
                  <ActionIconButton
                    tone="danger"
                    label={t('projects.stepper.s3.delete')}
                    icon={<DeleteIcon />}
                    onClick={() => removePackage(pkgItem.id)}
                  />
                </RowActions>
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
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border-2 border-dashed border-primary/30 bg-primary/5 py-4 font-semibold text-primary transition-colors hover:border-primary/50 hover:bg-primary/10"
        >
          + {t('projects.stepper.s3.add')}
        </button>
      </section>

      {/* Package Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-4xl animate-scale-in flex-col overflow-hidden rounded-[var(--radius-card-lg)] bg-card shadow-modal">
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-card-border px-7 py-5">
              <h3 className="heading-entity">{editingPackageId ? t('projects.stepper.s3.modalEdit') : t('projects.stepper.s3.modalAdd')}</h3>
              <button onClick={() => setIsFormOpen(false)} className="rounded-full p-2 text-text-muted transition-colors hover:bg-content-bg hover:text-text">
                &times;
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6">
              {renderPackageForm({
                accounts,
                initialData: editingPackageId
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
                    } as unknown as ContractPackage;
                  })()
                  : undefined,
                onSubmit: handlePackageSubmit,
                onCancel: () => setIsFormOpen(false),
              })}
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
function Step4Groups({
  state, update, accounts,
}: {
  state: StepperState;
  update: <K extends keyof StepperState>(k: K, v: StepperState[K]) => void;
  accounts: Account[];
}) {
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
          <h3 className="heading-section mb-1">{t('projects.stepper.s4.title')}</h3>
          <p className="text-sm text-text-muted">{t('projects.stepper.s4.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={addGroup}
          className="flex shrink-0 items-center gap-1.5 rounded-[var(--radius-button)] border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-ghost"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          {t('projects.stepper.s4.add')}
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-[var(--radius-button)] border border-dashed border-card-border bg-content-bg p-6 text-center">
          <p className="text-sm text-text-muted">{t('projects.stepper.s4.empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group, idx) => (
            <div key={group.key} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-[var(--radius-card)] border border-card-border bg-card shadow-sm hover:border-primary/40 hover:shadow-md transition-all group/item">
              <div className="flex w-8 h-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold shadow-sm">
                {idx + 1}
              </div>
              <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                <input
                  value={group.name}
                  onChange={(e) => updateGroup(group.key, { name: e.target.value })}
                  placeholder={t('projects.stepper.s4.namePlaceholder')}
                  className="w-full rounded-[var(--radius-card)] border border-transparent bg-input-bg/60 px-3.5 py-2 text-sm text-text outline-none transition-all hover:bg-input-bg focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20 placeholder:text-text-placeholder font-medium"
                />
                <input
                  value={group.description}
                  onChange={(e) => updateGroup(group.key, { description: e.target.value })}
                  placeholder={t('projects.stepper.s4.descPlaceholder')}
                  className="w-full rounded-[var(--radius-card)] border border-transparent bg-input-bg/60 px-3.5 py-2 text-sm text-text outline-none transition-all hover:bg-input-bg focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20 placeholder:text-text-placeholder"
                />
              </div>
              <button
                type="button"
                onClick={() => removeGroup(group.key)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-muted transition-all duration-150 hover:bg-danger/10 hover:text-danger sm:opacity-0 group-hover/item:opacity-100 focus:opacity-100"
                title={t('projects.stepper.s4.remove')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <section className="rounded-[var(--radius-card)] border border-card-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="heading-card">{t('projects.stepper.s4.managerTitle')}</h3>
          <span className="field-hint">{t('projects.stepper.s4.managerOptional')}</span>
        </div>
        <p className="mt-1 text-sm text-text-muted">{t('projects.stepper.s4.managerHint')}</p>

        <div className="mt-4">
          <ManagerAccountPicker
            accounts={accounts}
            value={state.managerAccountId}
            onChange={(accountId) => update('managerAccountId', accountId)}
            name="stepper-manager"
            allowClear
          />
        </div>
      </section>
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
        <h3 className="heading-section mb-1">{t('projects.stepper.s5.title')}</h3>
        <p className="text-sm text-text-muted">{t('projects.stepper.s5.subtitle')}</p>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-card-border bg-content-bg p-6 text-center">
          <p className="text-sm text-text-muted">{t('projects.stepper.s5.noGroups')}</p>
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
              <div key={group.key} className="rounded-[var(--radius-card)] border border-card-border bg-card transition-all hover:border-primary/30 shadow-sm overflow-hidden flex flex-col md:flex-row md:items-center">
                <div className="flex items-center gap-3 p-4 md:w-5/12 md:border-r border-card-border bg-content-bg/50">
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                  </span>
                  <div>
                    <p className="text-sm font-bold text-text">{group.name}</p>
                    <p className="text-xs text-text-muted mt-0.5">{t('projects.stepper.s5.partnerGroup')}</p>
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
                      <button type="button" onClick={() => setOrgForGroup(group.key, '')} className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors" title={t('projects.stepper.s5.changePartner')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                      </button>
                    </div>
                  ) : (
                    <select
                      value={group.organizationId || ''}
                      onChange={(e) => setOrgForGroup(group.key, e.target.value)}
                      className={selectCls}
                    >
                      <option value="">{t('projects.stepper.s5.select')}</option>
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
  state, organizations, accounts, submitting, submitProgress, submitError,
}: {
  state: StepperState;
  organizations: Organization[];
  accounts: Account[];
  submitting: boolean;
  submitProgress: string;
  submitError: string | null;
}) {
  const validGroups = state.groups.filter((g) => g.name.trim());
  const manager = accounts.find((a) => a.id === state.managerAccountId);
  const getOrgName = (id: string) => {
    const org = organizations.find((o) => o.id === id);
    return org ? (org.displayName || org.legalName) : '—';
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      <div>
        <h3 className="heading-section mb-1">{t('projects.stepper.s6.title')}</h3>
        <p className="text-sm text-text-muted">{t('projects.stepper.s6.subtitle')}</p>
      </div>

      {/* Project Info */}
      <div className="rounded-[var(--radius-card)] border border-card-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
          {t('projects.stepper.step1')}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-text-muted">{t('projects.form.name')}:</span> <span className="font-semibold text-text">{state.projectName}</span></div>
          {state.ownerOrganizationId && <div><span className="text-text-muted">{t('projects.form.owner')}:</span> <span className="font-semibold text-text">{getOrgName(state.ownerOrganizationId)}</span></div>}
          {state.projectDescription && <div className="col-span-2"><span className="text-text-muted">{t('projects.form.description')}:</span> <span className="text-text">{state.projectDescription}</span></div>}
          {state.contactAddress && <div className="col-span-2"><span className="text-text-muted">{t('projects.form.contactAddress')}:</span> <span className="text-text">{state.contactAddress}</span></div>}
          {state.address && <div className="col-span-2"><span className="text-text-muted">{t('projects.stepper.s6.address')}:</span> <span className="text-text">{state.address}</span></div>}
        </div>
      </div>

      {/* Mandatory files */}
      <div className="rounded-[var(--radius-card)] border border-card-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
          {t('projects.stepper.s6.legalFiles')}
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
          <p className="text-sm text-text-muted italic">{t('projects.stepper.s6.noFiles')}</p>
        )}
      </div>

      {/* Packages info */}
      {state.packages.length > 0 && (
        <div className="rounded-[var(--radius-card)] border border-card-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
            {t('projects.stepper.s6.packages')} ({state.packages.length})
          </div>
          <div className="space-y-3">
            {state.packages.map((pkgItem, i) => {
              const vat = pkgItem.payload.contractValue ? (Number(pkgItem.payload.contractValue) * (pkgItem.payload.taxRate ?? 10)) / 100 : 0;
              const total = pkgItem.payload.contractValue ? Number(pkgItem.payload.contractValue) + vat : 0;

              return (
                <div key={pkgItem.id} className="border border-card-border rounded-lg p-3 bg-input-bg">
                  <div className="font-semibold text-text mb-2">{i + 1}. {pkgItem.payload.name}</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {pkgItem.payload.startDate && <div><span className="text-text-muted">{t('projects.stepper.s6.startDate')}:</span> <span className="text-text">{pkgItem.payload.startDate}</span></div>}
                    {pkgItem.payload.endDate && <div><span className="text-text-muted">{t('projects.stepper.s6.endDate')}:</span> <span className="text-text">{pkgItem.payload.endDate}</span></div>}
                    {pkgItem.payload.contractValue !== undefined && pkgItem.payload.contractValue !== 0 && (
                      <div className="col-span-2 rounded-lg bg-content-bg mt-1 p-3 space-y-2 border border-card-border/50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div><span className="text-text-muted block sm:inline mb-1 sm:mb-0">{t('projects.stepper.s6.contractValue')}:</span> <span className="text-text font-semibold whitespace-nowrap">{fmtCurrency(Number(pkgItem.payload.contractValue), pkgItem.payload.currency ?? 'VND')}</span></div>
                          <div><span className="text-text-muted block sm:inline mb-1 sm:mb-0">{t('projects.stepper.s6.totalAfterVat')}:</span> <span className="text-primary font-bold whitespace-nowrap">{fmtCurrency(total, pkgItem.payload.currency ?? 'VND')}</span></div>
                        </div>
                        <p className="text-sm italic text-text-muted border-t border-card-border/50 pt-2">
                          {t('projects.stepper.s6.inWordsTotal')}: <span className="font-semibold text-text not-italic">{numberToWordsVN(total)}</span>
                        </p>
                      </div>
                    )}
                  </div>
                  {pkgItem.files.length > 0 && (
                    <div className="col-span-full mt-2 pt-3 border-t border-card-border">
                      <span className="text-text-muted text-sm block mb-2">{t('projects.stepper.s6.attachments')}:</span>
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
      <div className="rounded-[var(--radius-card)] border border-card-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
          {t('projects.stepper.s6.groups')} ({validGroups.length})
        </div>
        <div className="flex items-center justify-between rounded-lg bg-content-bg px-4 py-2.5 text-sm">
          <span className="text-text-muted">{t('projects.stepper.s6.manager')}</span>
          {manager ? (
            <span className="font-semibold text-text">{manager.userName}</span>
          ) : (
            <span className="text-xs italic text-text-placeholder">{t('projects.stepper.s6.noManager')}</span>
          )}
        </div>
        {validGroups.length > 0 ? (
          <div className="space-y-2">
            {validGroups.map((g) => (
              <div key={g.key} className="flex items-center justify-between rounded-lg bg-content-bg px-4 py-2.5 text-sm">
                <span className="font-medium text-text">{g.name}</span>
                {g.organizationId ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{getOrgName(g.organizationId)}</span>
                ) : (
                  <span className="text-xs text-text-placeholder italic">{t('projects.stepper.s6.noPartner')}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted italic">{t('projects.stepper.s6.noGroups')}</p>
        )}
      </div>

      {/* Submit status */}
      {submitting && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 flex items-center gap-4">
          <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" /></svg>
          <div>
            <p className="text-sm font-semibold text-primary">{submitProgress}</p>
            <p className="text-xs text-text-muted mt-0.5">{t('projects.stepper.s6.doNotClose')}</p>
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
