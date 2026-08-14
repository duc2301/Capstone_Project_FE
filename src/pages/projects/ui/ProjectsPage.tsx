import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { isAccountAdmin, useSession } from '@/entities/session';
import { CreatePackageForm } from '@/features/packages';
import type { ProjectFilter } from '@/features/projects';
import {
  CreateProjectStepper,
  filterLabel,
  matchesFilter,
  PROJECT_FILTERS,
  ProjectCard,
  useBepTask,
  useProjects,
} from '@/features/projects';
import { Modal, PaginationBar, Toast, useToast } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

const PAGE_SIZE = 6;

/* ── Main page ────────────────────────────────────────── */
export function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, loading, error } = useProjects();
  const { currentUser } = useSession();
  const isAdmin = isAccountAdmin(currentUser?.role);

  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<ProjectFilter>('all');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const bepInputRef = useRef<HTMLInputElement>(null);
  const bepTask = useBepTask();
  const bepData = bepTask.status === 'opened' ? bepTask.result ?? undefined : undefined;
  const stepperOpen = creating || bepData !== undefined;
  const parsing = bepTask.status === 'running';

  const clearOpenedBepTask = () => {
    if (bepTask.status === 'opened') bepTask.dismiss();
  };

  const openBlankCreate = () => {
    clearOpenedBepTask();
    setCreating(true);
  };

  const closeCreate = () => {
    setCreating(false);
    clearOpenedBepTask();
  };

  const { toast, showToast } = useToast();

  const handleStepperComplete = (projectId: string) => {
    setCreating(false);
    clearOpenedBepTask();
    showToast(t('projects.toast.created'));
    window.location.href = `/projects/${projectId}`;
  };

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return projects.filter((p) => {
      if (!matchesFilter(p, filter)) return false;
      if (!query) return true;
      const haystack = [p.projectName, p.projectCode].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [projects, filter, searchQuery]);

  const changeFilter = (next: ProjectFilter) => {
    setFilter(next);
    setPage(1);
  };

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className="flex h-full flex-col gap-5">
      <Toast toast={toast} className="z-[60]" />

      {/* Header */}
      <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="heading-page">{t('projects.title')}</h1>
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
                if (f) bepTask.start(f);
              }}
            />
            <button
              type="button"
              onClick={() => bepInputRef.current?.click()}
              disabled={parsing}
              className="flex items-center gap-2 rounded-[var(--radius-button)] border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-ghost disabled:cursor-not-allowed disabled:opacity-50"
            >
              {parsing ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              )}
              {parsing ? t('projects.bep.parsing') : t('projects.bep.quickCreate')}
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

      {!loading && !error && (
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-3">
            {PROJECT_FILTERS.filter((item) => item === 'all').map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => changeFilter(item)}
                aria-pressed={filter === item}
                className={`rounded-[var(--radius-button)] px-6 py-2 text-sm font-semibold transition-colors ${
                  filter === item
                    ? 'bg-primary text-white shadow-sm'
                    : 'border border-card-border bg-card text-text-secondary hover:bg-content-bg'
                }`}
              >
                {filterLabel(item)}
              </button>
            ))}
          </div>

          <div className="relative w-full max-w-sm">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder={t('projects.search')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-[var(--radius-input)] border border-card-border bg-card py-2.5 pl-10 pr-4 text-sm text-text shadow-card outline-none transition-colors focus:border-primary"
            />
          </div>
        </div>
      )}

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
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="admin-scrollbar min-h-0 flex-1 overflow-y-auto pb-1 pr-1">
            {pageItems.length === 0 ? (
              <div className="flex h-full min-h-[240px] items-center justify-center rounded-[var(--radius-card-lg)] border border-card-border bg-card shadow-card">
                <p className="text-sm text-text-muted">{searchQuery ? t('projects.noResults') : t('projects.empty')}</p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {pageItems.map((p) => (
                  <ProjectCard key={p.id} project={p} onOpen={(id) => navigate(`/projects/${id}`)} />
                ))}
              </div>
            )}
          </div>

          <PaginationBar
            page={currentPage}
            pageCount={pageCount}
            pageSize={PAGE_SIZE}
            total={filtered.length}
            unit={t('projects.pagination.projects')}
            onChange={setPage}
          />
        </div>
      )}

      {/* Create modal */}
      {stepperOpen && (
        <Modal title={t('projects.modal.createTitle')} onClose={closeCreate} maxWidth="max-w-5xl" flush>
          <CreateProjectStepper
            key={bepData ? 'bep' : 'blank'}
            initialData={bepData}
            onComplete={handleStepperComplete}
            onCancel={closeCreate}
            renderPackageForm={(ctx) => (
              <CreatePackageForm
                key={ctx.initialData?.id ?? 'new'}
                accounts={ctx.accounts}
                initialData={ctx.initialData}
                onSubmit={ctx.onSubmit}
                onCancel={ctx.onCancel}
              />
            )}
          />
        </Modal>
      )}
    </div>
  );
}
