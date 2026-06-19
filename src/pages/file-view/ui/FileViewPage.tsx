import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import type { FileViewInfo } from '@/entities/file-item';
import { fileItemApi } from '@/entities/file-item';
import { t } from '@/shared/lib/i18n';
import { ModelViewer } from '@/widgets/ModelViewer';

function Spinner() {
  return (
    <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  );
}

/* Nội dung xem trực tiếp: ảnh dùng <img>, còn lại (PDF/text) nhúng <iframe> */
function InlineContent({ info }: { info: FileViewInfo }) {
  if (!info.url) return null;
  if (info.contentType?.startsWith('image/')) {
    return (
      <div className="absolute inset-0 flex items-center justify-center overflow-auto bg-content-bg p-6">
        <img src={info.url} alt={info.fileName} className="max-h-full max-w-full object-contain" />
      </div>
    );
  }
  return (
    <iframe
      src={info.url}
      title={info.fileName}
      className="absolute inset-0 h-full w-full border-0 bg-white"
    />
  );
}

export function FileViewPage() {
  const { projectId, fileId } = useParams<{ projectId: string; fileId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const folderId = searchParams.get('folder');

  const [info, setInfo] = useState<FileViewInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await fileItemApi.getView(fileId);
        if (cancelled) return;
        if (data.isSuccess && data.result) setInfo(data.result);
        else setError(data.message || t('fileView.error'));
      } catch {
        if (!cancelled) setError(t('fileView.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  const goBack = useCallback(() => {
    if (!projectId) {
      navigate('/projects');
      return;
    }
    const folderQuery = folderId ? `&folder=${folderId}` : '';
    navigate(`/projects/${projectId}?tab=documents${folderQuery}`);
  }, [navigate, projectId, folderId]);

  const handleDownload = useCallback(async () => {
    if (!fileId || !info) return;
    try {
      const res = await fileItemApi.download(fileId);
      const blobUrl = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = info.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      setError(t('common.error'));
    }
  }, [fileId, info]);

  const isModel = info?.kind === 'model' && !!info.urn;

  return (
    <div className="space-y-5">
      {/* Tiêu đề: nút Quay lại + tên tệp */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-ghost"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            {t('fileView.back')}
          </button>
          <h2 className="truncate font-display text-xl font-semibold text-text">
            {info?.fileName ?? ''}
          </h2>
        </div>
      </div>

      {/* Khung nội dung */}
      <div className="relative h-[calc(100vh-220px)] min-h-[480px] overflow-hidden rounded-(--radius-card) border border-card-border bg-card shadow-card">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Spinner />
            <p className="font-jakarta text-sm text-text-muted">{t('common.loading')}</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="font-jakarta text-sm font-medium text-danger">{error}</p>
          </div>
        ) : info && isModel ? (
          <ModelViewer urn={info.urn!} className="absolute inset-0" />
        ) : info && info.kind === 'inline' && info.url ? (
          <InlineContent info={info} />
        ) : (
          /* download / không xem trực tiếp được */
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
              </span>
              <h3 className="font-display text-lg font-semibold text-text">{t('fileView.download.title')}</h3>
              <p className="font-jakarta text-sm text-text-muted">{t('fileView.download.desc')}</p>
              <button
                type="button"
                onClick={handleDownload}
                className="mt-1 flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {t('fileView.download.button')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
