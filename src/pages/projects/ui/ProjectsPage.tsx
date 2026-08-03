import { isAxiosError } from 'axios';
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { BepParseResult } from '@/entities/project';
import { projectApi } from '@/entities/project';
import { isAccountAdmin, useSession } from '@/entities/session';
import { CreatePackageForm } from '@/features/packages';
import type { ProjectFilter } from '@/features/projects';
import {
  CreateProjectStepper,
  filterLabel,
  matchesFilter,
  PROJECT_FILTERS,
  ProjectCard,
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
    } catch (err) {
      const message = isAxiosError(err) ? (err.response?.data as { message?: string })?.message : null;
      showToast(message || t('projects.bep.failed'), 'error');
    } finally {
      setParsing(false);
    }
  };

  const { toast, showToast } = useToast();

  const handleStepperComplete = (projectId: string) => {
    setCreating(false);
    showToast(t('projects.toast.created'));
    window.location.href = `/projects/${projectId}`;
  };

  const filtered = useMemo(
    () => projects.filter((p) => matchesFilter(p, filter)),
    [projects, filter],
  );

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

      {!loading && !error && (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {PROJECT_FILTERS.map((item) => (
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
                <p className="text-sm text-text-muted">{t('projects.empty')}</p>
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
      {creating && (
        <Modal title={t('projects.modal.createTitle')} onClose={closeCreate} maxWidth="max-w-5xl" flush>
          <CreateProjectStepper
            key={bepData ? 'bep' : 'blank'}
            initialData={bepData}
            onComplete={handleStepperComplete}
            onCancel={closeCreate}
            renderPackageForm={(ctx) => (
              <CreatePackageForm
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
