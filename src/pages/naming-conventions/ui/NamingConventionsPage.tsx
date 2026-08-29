import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { namingConventionApi } from '@/entities/naming-convention';
import { isAccountAdmin, useSession } from '@/entities/session';
import { useProjectDetail } from '@/features/projects';
import {
  ConventionDetail,
  CreateConventionModal,
  useNamingConventions,
} from '@/features/naming-conventions';
import { ListErrorCard, ListLoadingCard, Toast, ToolbarIconButton, useToast } from '@/shared/components';
import { downloadBlob } from '@/shared/lib/download';
import { t } from '@/shared/lib/i18n';

import { ConventionList } from './ConventionList';

export function NamingConventionsPage() {
  const { projectId, conventionId } = useParams<{ projectId: string; conventionId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useSession();
  const { project } = useProjectDetail(projectId);
  const { conventions, loading, error, refetch, upsert } = useNamingConventions(projectId ?? '');
  const { toast, showToast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);

  const canConfigure = isAccountAdmin(currentUser?.role)
    || (project != null && project.managerAccountId === currentUser?.accountId);

  const selected = conventionId ? conventions.find((c) => c.id === conventionId) ?? null : null;

  const listUrl = `/projects/${projectId}/naming-conventions`;

  const handleDownloadTemplate = async () => {
    if (!projectId) return;
    try {
      const res = await namingConventionApi.downloadTemplate(projectId);
      downloadBlob(res.data as Blob, 'naming-convention-template_ISO-19650.xlsx');
    } catch {
      showToast(t('common.error'), 'error');
    }
  };

  if (!projectId) return null;

  if (loading) {
    return (
      <div className="flex h-full flex-col gap-3">
        <h1 className="heading-page shrink-0">{t('naming.title')}</h1>
        <ListLoadingCard />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col gap-3">
        <h1 className="heading-page shrink-0">{t('naming.title')}</h1>
        <ListErrorCard message={error} />
      </div>
    );
  }

  if (conventionId && !selected) {
    return (
      <div className="flex h-full flex-col gap-3">
        <h1 className="heading-page shrink-0">{t('naming.title')}</h1>
        <ListErrorCard message={t('naming.detail.notFound')} />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <Toast toast={toast} className="z-[60]" />

      {selected ? (
        <ConventionDetail
          convention={selected}
          projectId={projectId}
          canConfigure={canConfigure}
          onBack={() => navigate(listUrl)}
          onMutated={upsert}
          onDeleted={() => navigate(listUrl)}
          refetch={refetch}
          showToast={showToast}
        />
      ) : (
        <>
          <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="heading-page">{t('naming.title')}</h1>
            {canConfigure && (
              <div className="flex flex-wrap items-center gap-3">
                <ToolbarIconButton
                  showLabel
                  label={t('naming.downloadTemplate')}
                  onClick={() => void handleDownloadTemplate()}
                  icon={
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  }
                />
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="flex items-center gap-2 rounded-[var(--radius-button)] bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  {t('naming.create')}
                </button>
              </div>
            )}
          </div>

          <ConventionList
            conventions={conventions}
            onOpen={(id) => navigate(`${listUrl}/${id}`)}
          />
        </>
      )}

      {createOpen && (
        <CreateConventionModal
          projectId={projectId}
          onClose={() => setCreateOpen(false)}
          onCreated={(conv) => {
            upsert(conv);
            setCreateOpen(false);
            navigate(`${listUrl}/${conv.id}`);
          }}
        />
      )}
    </div>
  );
}
