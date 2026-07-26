import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { BepParseResult } from '@/entities/project';
import { projectApi } from '@/entities/project';
import { isAccountAdmin, useSession } from '@/entities/session';
import { CreateProjectStepper, useProjectInvite, useProjects } from '@/features/projects';
import { t } from '@/shared/lib/i18n';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}
function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-5xl animate-scale-in rounded-[var(--radius-card-lg)] bg-card shadow-modal">
        <div className="flex items-center justify-between border-b border-card-border px-7 py-5">
          <h2 className="font-heading text-lg font-bold text-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-content-bg hover:text-text"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────── */
export function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, loading, error } = useProjects();
  const { accounts } = useProjectInvite();
  const { currentUser } = useSession();
  const isAdmin = isAccountAdmin(currentUser?.role);

  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  /* ── Khởi tạo nhanh từ BEP ── */
  const bepInputRef = useRef<HTMLInputElement>(null);
  const [bepData, setBepData] = useState<BepParseResult | undefined>(undefined);
  const [parsing, setParsing] = useState(false);

  const openBlankCreate = () => {
    setBepData(undefined);
    setCreating(true);
  };

  const closeCreate = () => {
    setCreating(false);
    setBepData(undefined);
  };

  const runBepParse = async (file: File) => {
    setParsing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await projectApi.parseBep(formData);
      const result = data.result;
      if (!result) throw new Error(t('projects.bep.failed'));
      if (result.extractionEmpty) showToast(t('projects.bep.empty'), 'error');
      setBepData(result);
      setCreating(true);
    } catch (err: any) {
      showToast(err?.response?.data?.message || t('projects.bep.failed'), 'error');
    } finally {
      setParsing(false);
    }
  };

  const accountNameById = useMemo(() => {
    const map = new Map<string, string>();
    accounts.forEach((a) => map.set(a.id, a.userName));
    return map;
  }, [accounts]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStepperComplete = (projectId: string) => {
    setCreating(false);
    showToast(t('projects.toast.created'));
    window.location.href = `/projects/${projectId}`;
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-20 right-6 z-[60] animate-slide-up rounded-xl border px-5 py-3 shadow-dropdown ${toast.type === 'success' ? 'border-success/30 bg-success-light' : 'border-danger/30 bg-danger-light'}`}>
          <p className={`text-sm font-medium ${toast.type === 'success' ? 'text-success' : 'text-danger'}`}>{toast.msg}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text lg:text-3xl">{t('projects.title')}</h1>
          <p className="mt-1 text-sm text-text-muted">{t('projects.subtitle')}</p>
        </div>
        {isAdmin && (
          <div className="flex shrink-0 items-center gap-3">
            <input
              ref={bepInputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) runBepParse(f);
              }}
            />
            <button
              type="button"
              onClick={() => bepInputRef.current?.click()}
              disabled={parsing}
              className="flex items-center gap-2 rounded-[var(--radius-button)] border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition-all duration-200 hover:bg-primary-ghost disabled:opacity-50"
            >
              {parsing ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                  {t('projects.bep.parsing')}
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {t('projects.bep.quickCreate')}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={openBlankCreate}
              className="flex items-center gap-2 rounded-[var(--radius-button)] bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-primary-hover"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {t('projects.createNew')}
            </button>
          </div>
        )}
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
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-card-border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-input-bg">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-text-muted">{t('projects.col.name')}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-text-muted">{t('projects.col.manager')}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-text-muted">{t('projects.col.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-16 text-center text-sm text-text-muted">
                      {t('projects.empty')}
                    </td>
                  </tr>
                ) : (
                  projects.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/projects/${p.id}`)}
                      className="cursor-pointer transition-colors duration-150 hover:bg-primary-ghost"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {p.projectImageUrl ? (
                            <img src={p.projectImageUrl} alt={p.projectName} className="w-10 h-10 rounded-md object-cover border border-card-border" />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
                              {p.projectName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-text">{p.projectName}</div>
                            {p.projectCode && <div className="text-xs text-text-muted mt-0.5">{p.projectCode}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-muted">
                        {p.managerAccountId
                          ? accountNameById.get(p.managerAccountId) ?? p.managerAccountId
                          : <span className="italic text-text-placeholder">{t('projects.noManager')}</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/projects/${p.id}`);
                          }}
                          className="rounded-[var(--radius-button)] border border-primary px-4 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary-ghost"
                        >
                          {t('projects.manage')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create modal */}
      {creating && (
        <Modal title={t('projects.modal.createTitle')} onClose={closeCreate}>
          <CreateProjectStepper
            key={bepData ? 'bep' : 'blank'}
            initialData={bepData}
            onComplete={handleStepperComplete}
            onCancel={closeCreate}
          />
        </Modal>
      )}
    </div>
  );
}
