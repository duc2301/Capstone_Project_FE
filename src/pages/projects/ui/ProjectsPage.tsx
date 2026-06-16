import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { isAccountAdmin, useSession } from '@/entities/session';
import { CreateProjectForm, useProjectInvite, useProjects } from '@/features/projects';
import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';

const STATUS_KEYS: Record<number, TranslationKey> = {
  0: 'projects.status.planning',
  1: 'projects.status.active',
  2: 'projects.status.onHold',
  3: 'projects.status.completed',
  4: 'projects.status.closed',
};
const PHASE_KEYS: Record<number, TranslationKey> = {
  0: 'projects.phase.concept',
  1: 'projects.phase.design',
  2: 'projects.phase.construction',
  3: 'projects.phase.handover',
  4: 'projects.phase.operation',
};

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}
function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl animate-scale-in rounded-[var(--radius-card-lg)] bg-card shadow-modal">
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
        <div className="max-h-[70vh] overflow-y-auto px-7 py-6">{children}</div>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────── */
export function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, loading, error, createProject } = useProjects();
  const { accounts } = useProjectInvite();
  const { currentUser } = useSession();
  const isAdmin = isAccountAdmin(currentUser?.role);

  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const accountNameById = useMemo(() => {
    const map = new Map<string, string>();
    accounts.forEach((a) => map.set(a.id, a.userName));
    return map;
  }, [accounts]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreate = async (payload: Parameters<typeof createProject>[0]) => {
    try {
      await createProject(payload);
      setCreating(false);
      showToast(t('projects.toast.created'));
    } catch {
      showToast(t('common.error'), 'error');
    }
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
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex shrink-0 items-center gap-2 rounded-[var(--radius-button)] bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-primary-hover"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t('projects.createNew')}
          </button>
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
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-text-muted">{t('projects.col.status')}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-text-muted">{t('projects.col.phase')}</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-text-muted">{t('projects.col.manager')}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-text-muted">{t('projects.col.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-sm text-text-muted">
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
                      <td className="px-6 py-4 font-semibold text-text">{p.projectName}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block rounded-[var(--radius-badge)] bg-info-light px-2.5 py-1 text-xs font-semibold text-info">
                          {t(STATUS_KEYS[p.status] ?? 'projects.status.planning')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {t(PHASE_KEYS[p.phase] ?? 'projects.phase.concept')}
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
        <Modal title={t('projects.modal.createTitle')} onClose={() => setCreating(false)}>
          <CreateProjectForm onSubmit={handleCreate} onCancel={() => setCreating(false)} />
        </Modal>
      )}
    </div>
  );
}
