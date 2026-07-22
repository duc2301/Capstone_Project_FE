import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import type { FileVersion, FileViewInfo } from '@/entities/file-item';
import { fileItemApi, ModelViewerStatus } from '@/entities/file-item';
import { InlineCommentsPanel, InlineMarkupProvider, InlineMarkupStage } from '@/features/inline-markup';
import { IssueSidePanel } from '@/features/issues';
import { ModelCommentsPanel } from '@/features/model-markup';
import { t } from '@/shared/lib/i18n';
import { ModelViewer } from '@/widgets/ModelViewer';

const POLL_INTERVAL_MS = 3000;

function Spinner() {
  return (
    <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  );
}

function isInlineMarkupContentType(contentType: string | null | undefined): boolean {
  return (contentType ?? '').startsWith('image/') || contentType === 'application/pdf';
}

export function IssueDetailPage() {
  const { projectId, fileId, issueId } = useParams<{ projectId: string; fileId: string; issueId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const folderId = searchParams.get('folder');

  const [info, setInfo] = useState<FileViewInfo | null>(null);
  const [versions, setVersions] = useState<FileVersion[]>([]);
  // Suy ra `loading` từ id đã nạp (giống FileViewPage) — tránh setState trong thân effect.
  const [loadedFileId, setLoadedFileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loading = Boolean(fileId) && loadedFileId !== fileId;
  const [viewer, setViewer] = useState<Autodesk.Viewing.GuiViewer3D | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleViewerReady = useCallback((v: Autodesk.Viewing.GuiViewer3D | null) => setViewer(v), []);

  const fetchView = useCallback(async (): Promise<FileViewInfo> => {
    const { data } = await fileItemApi.getView(fileId!);
    if (data.isSuccess && data.result) return data.result;
    throw new Error(data.message || t('fileView.error'));
  }, [fileId]);

  useEffect(() => {
    if (!fileId) return;
    let cancelled = false;
    (async () => {
      try {
        const [viewResult, versionsResult] = await Promise.all([fetchView(), fileItemApi.getVersions(fileId)]);
        if (!cancelled) {
          setInfo(viewResult);
          setVersions(versionsResult.data.result ?? []);
          setError(null);
        }
      } catch {
        if (!cancelled) setError(t('fileView.error'));
      } finally {
        if (!cancelled) setLoadedFileId(fileId);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fileId, fetchView]);

  const status = info?.kind === 'model' ? info.viewerStatus : null;
  const isModelProcessing =
    status === ModelViewerStatus.Pending || status === ModelViewerStatus.Processing || status === ModelViewerStatus.None;

  useEffect(() => {
    if (!fileId || !isModelProcessing) return;
    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const result = await fetchView();
        if (!cancelled) setInfo(result);
      } catch {
        // Lỗi tạm thời khi poll -> giữ nguyên trạng thái viewer hiện tại.
      }
    }, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [fileId, isModelProcessing, fetchView]);

  const goBackToFile = useCallback(() => {
    if (!projectId || !fileId) {
      navigate('/projects');
      return;
    }
    const folderQuery = folderId ? `?folder=${folderId}` : '';
    navigate(`/projects/${projectId}/files/${fileId}/view${folderQuery}`);
  }, [navigate, projectId, fileId, folderId]);

  const latestVersion = versions.find((v) => v.isCurrent) ?? versions[0] ?? null;
  const fileVersionId = latestVersion?.id ?? null;
  const isModelReady = info?.kind === 'model' && status === ModelViewerStatus.Ready && !!info.urn;
  const isModelFailed = info?.kind === 'model' && status === ModelViewerStatus.Failed;
  const canMarkupInline = info?.kind === 'inline' && !!info.url && isInlineMarkupContentType(info.contentType);
  const fileName = info?.fileName ?? t('fileView.untitled');

  // Nội dung khung xem (cột trái) theo loại file.
  let viewerContent: React.ReactNode;
  if (loading) {
    viewerContent = (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <Spinner />
        <p className="font-jakarta text-sm text-text-muted">{t('common.loading')}</p>
      </div>
    );
  } else if (error) {
    viewerContent = (
      <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
        <p className="font-jakarta text-sm font-medium text-danger">{error}</p>
      </div>
    );
  } else if (isModelReady) {
    viewerContent = <ModelViewer urn={info!.urn!} className="h-full w-full" onViewerReady={handleViewerReady} />;
  } else if (isModelProcessing) {
    viewerContent = (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Spinner />
        <h3 className="font-display text-lg font-semibold text-text">{t('fileView.model.processing.title')}</h3>
        <p className="max-w-md font-jakarta text-sm text-text-muted">{t('fileView.model.processing.desc')}</p>
      </div>
    );
  } else if (isModelFailed) {
    viewerContent = (
      <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
        <p className="font-jakarta text-sm font-medium text-danger">{t('fileView.model.failed.desc')}</p>
      </div>
    );
  } else if (canMarkupInline) {
    viewerContent = <InlineMarkupStage />;
  } else if (info?.kind === 'inline' && info.url) {
    viewerContent = info.contentType?.startsWith('image/') ? (
      <div className="absolute inset-0 flex items-center justify-center overflow-auto bg-[#dcdad2] p-6">
        <img src={info.url} alt={fileName} className="max-h-full max-w-full rounded-xl object-contain shadow-lg" />
      </div>
    ) : (
      <iframe src={info.url} title={fileName} className="absolute inset-0 h-full w-full border-0 bg-white" />
    );
  } else {
    viewerContent = (
      <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
        <p className="font-jakarta text-sm text-text-muted">{t('issues.page.previewUnsupported')}</p>
      </div>
    );
  }

  // Nội dung tab "Ghi chú" (cột phải) — danh sách markup, khác nhau giữa model và inline.
  let markupSlot: React.ReactNode;
  if (info?.kind === 'model') {
    markupSlot = viewer && fileId
      ? <ModelCommentsPanel viewer={viewer} fileItemId={fileId} fileVersionId={fileVersionId} issueId={issueId} />
      : <p className="py-8 text-center text-sm text-text-muted">{t('markup.model.viewerLoading')}</p>;
  } else if (canMarkupInline) {
    markupSlot = <InlineCommentsPanel />;
  } else {
    markupSlot = <p className="py-8 text-center text-sm text-text-muted">{t('issues.page.markupUnsupported')}</p>;
  }

  const layout = (
    <div className="mx-auto flex h-[calc(100vh-140px)] max-w-[1600px] flex-col gap-4 xl:flex-row">
      <main className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-3xl border border-card-border bg-card shadow-card">
        <div className="absolute inset-0 bg-[#dcdad2]" />
        {viewerContent}
      </main>

      <aside className="flex min-h-0 w-full shrink-0 flex-col overflow-hidden rounded-3xl border border-card-border bg-card shadow-card xl:w-[420px]">
        {issueId && fileId ? (
          <IssueSidePanel issueId={issueId} fileItemId={fileId} onToast={showToast} markupSlot={markupSlot} />
        ) : null}
      </aside>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[#fbf9f1] px-4 py-5 sm:px-6 lg:px-8">
      <header className="mx-auto mb-4 flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={goBackToFile}
            className="flex items-center gap-1.5 rounded-full border border-card-border bg-card px-4 py-2 text-sm font-semibold text-text transition-colors hover:bg-content-bg"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            {t('issues.page.backToFile')}
          </button>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">{t('issues.detail.title')}</p>
            <h1 className="truncate font-display text-xl font-semibold text-text">{fileName}</h1>
          </div>
        </div>
      </header>

      {canMarkupInline && fileId ? (
        <InlineMarkupProvider
          fileItemId={fileId}
          fileVersionId={fileVersionId}
          fileName={fileName}
          url={info?.url ?? null}
          contentType={info?.contentType ?? null}
          enabled
          issueId={issueId}
        >
          {layout}
        </InlineMarkupProvider>
      ) : (
        layout
      )}

      {toast && (
        <div className={`fixed right-6 top-20 z-[80] animate-slide-up rounded-xl border px-5 py-3 shadow-dropdown ${toast.type === 'success' ? 'border-success/30 bg-success-light' : 'border-danger/30 bg-danger-light'}`}>
          <p className={`text-sm font-medium ${toast.type === 'success' ? 'text-success' : 'text-danger'}`}>{toast.msg}</p>
        </div>
      )}
    </div>
  );
}
