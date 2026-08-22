import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { ProjectImportPreview } from '@/entities/project';
import { isAccountAdmin, useSession } from '@/entities/session';
import { CreatePackageForm } from '@/features/packages';
import {
  CreateProjectMethodPicker,
  CreateProjectStepper,
  ProjectCard,
  useBepTask,
  useProjects,
} from '@/features/projects';
import { Modal, PaginationBar, SearchField, Toast, useToast } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

const PAGE_SIZE = 6;

/* ── Main page ────────────────────────────────────────── */
export function ProjectsPage() {
  const navigate = useNavigate();
  const { projects, loading, error } = useProjects();
  const { currentUser } = useSession();
  const isAdmin = isAccountAdmin(currentUser?.role);

  const [createStage, setCreateStage] = useState<'picker' | 'form' | null>(null);
  const [importData, setImportData] = useState<ProjectImportPreview | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const bepTask = useBepTask();
  const bepData = bepTask.status === 'opened' ? bepTask.result ?? undefined : undefined;
  const createOpen = createStage !== null || bepData !== undefined;
  const stepperOpen = createStage === 'form' || bepData !== undefined;
  const stepperSource = bepData ? 'bep' : importData ? 'import' : 'blank';

  const clearOpenedBepTask = () => {
    if (bepTask.status === 'opened') bepTask.dismiss();
  };

  const openCreate = () => {
    clearOpenedBepTask();
    setImportData(null);
    setCreateStage('picker');
  };

  const closeCreate = () => {
    setCreateStage(null);
    setImportData(null);
    clearOpenedBepTask();
  };

  const startFromImport = (preview: ProjectImportPreview) => {
    setImportData(preview);
    setCreateStage('form');
  };

  const startFromBep = (file: File) => {
    setCreateStage(null);
    bepTask.start(file);
  };

  const { toast, showToast } = useToast();

  const handleStepperComplete = (projectId: string) => {
    setCreateStage(null);
    setImportData(null);
    clearOpenedBepTask();
    showToast(t('projects.toast.created'));
    window.location.href = `/projects/${projectId}`;
  };

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((p) => {
      const haystack = [p.projectName, p.projectCode].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [projects, searchQuery]);

  const changeSearch = (value: string) => {
    setSearchQuery(value);
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
            <button
              type="button"
              onClick={openCreate}
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
        <div className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <SearchField
            value={searchQuery}
            onChange={changeSearch}
            placeholder={t('projects.search')}
            className="w-full lg:max-w-[420px]"
          />
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
      {createOpen && (
        <Modal title={t('projects.modal.createTitle')} onClose={closeCreate} maxWidth="max-w-5xl" flush={stepperOpen}>
          {stepperOpen ? (
            <CreateProjectStepper
              key={stepperSource}
              initialData={bepData}
              importData={importData ?? undefined}
              onComplete={handleStepperComplete}
              onCancel={closeCreate}
              renderPackageForm={(ctx) => (
                <CreatePackageForm
                  key={ctx.initialData?.id ?? 'new'}
                  accounts={ctx.accounts}
                  initialData={ctx.initialData}
                  pendingFiles={ctx.pendingFiles}
                  onSubmit={ctx.onSubmit}
                  onCancel={ctx.onCancel}
                />
              )}
            />
          ) : (
            <CreateProjectMethodPicker
              onManual={() => setCreateStage('form')}
              onImported={startFromImport}
              onBepSelected={startFromBep}
              bepBusy={bepTask.status === 'running'}
            />
          )}
        </Modal>
      )}
    </div>
  );
}
