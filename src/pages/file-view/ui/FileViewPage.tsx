import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import type { ApprovalListItem, ApprovalStatus } from '@/entities/approval';
import { approvalApi } from '@/entities/approval';
import type { FileListItem, FileVersion, FileViewInfo } from '@/entities/file-item';
import { fileItemApi, FileItemStatus, FileType, ModelViewerStatus } from '@/entities/file-item';
import { smartcaApi, smartcaErrorMessage } from '@/entities/smartca';
import { formatSize } from '@/features/folders/model/fileFormat';
import { SmartCaSignModal } from '@/features/folders/ui/SmartCaSignModal';
import { ModelCommentsPanel } from '@/features/model-markup';
import { t } from '@/shared/lib/i18n';
import { ModelViewer } from '@/widgets/ModelViewer';

const POLL_INTERVAL_MS = 3000;
// Fallback khi chua lay duoc kich thuoc trang PDF thuc te (A4). Dung kich thuoc thuc te
// (smartcaApi.getPdfPageInfo) de tinh ty le dat vi tri ky, tranh lech vi tri tren cac trang khong phai A4/landscape.
const FALLBACK_PDF_PAGE_SIZE: PdfPageSize = {
  width: 595,
  height: 842,
};

interface PdfPageSize {
  width: number;
  height: number;
}

interface SignaturePlacementValue {
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Vi tri mac dinh ty le theo kich thuoc trang thuc te (goc duoi-phai trang), thay vi toa do tuyet doi co dinh theo A4.
function getDefaultSignaturePosition(pageSize: PdfPageSize): SignaturePlacementValue {
  const width = Math.round(pageSize.width * 0.27);
  const height = Math.round(pageSize.height * 0.083);
  return {
    pageNumber: 1,
    x: Math.round(pageSize.width * 0.605),
    y: Math.round(pageSize.height * 0.808),
    width,
    height,
  };
}

function Spinner() {
  return (
    <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  );
}

function FileIcon({ danger = false }: { danger?: boolean }) {
  return (
    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${danger ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'}`}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    </span>
  );
}

function InlineContent({ info }: { info: FileViewInfo }) {
  if (!info.url) return null;

  if (info.contentType?.startsWith('image/')) {
    return (
      <div className="flex h-full items-center justify-center overflow-auto bg-[#dcdad2] p-8">
        <img src={info.url} alt={info.fileName} className="max-h-full max-w-full rounded-xl object-contain shadow-lg" />
      </div>
    );
  }

  return (
    <iframe
      src={info.url}
      title={info.fileName}
      className="h-full w-full border-0 bg-white"
    />
  );
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusMeta(info: FileViewInfo | null, isModelProcessing: boolean, isModelFailed: boolean) {
  if (isModelFailed) {
    return { label: t('fileView.status.failed'), className: 'border-danger/20 bg-danger-light text-danger' };
  }
  if (isModelProcessing) {
    return { label: t('fileView.status.processing'), className: 'border-warning/20 bg-warning-light text-warning' };
  }
  if (!info || info.kind === 'download') {
    return { label: t('fileView.status.downloadOnly'), className: 'border-card-border bg-content-bg text-text-secondary' };
  }
  return { label: t('fileView.status.ready'), className: 'border-primary/20 bg-primary/10 text-primary' };
}

function isWordFormat(format: string) {
  return format === 'DOC' || format === 'DOCX';
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</p>
      <div className="break-words text-sm font-medium text-text">{value}</div>
    </div>
  );
}

type FilePanelTab = 'properties' | 'signatureHistory' | 'markup';

export function FileViewPage() {
  const { projectId, fileId } = useParams<{ projectId: string; fileId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const folderId = searchParams.get('folder');

  const [info, setInfo] = useState<FileViewInfo | null>(null);
  const [versions, setVersions] = useState<FileVersion[]>([]);
  const [fileListItem, setFileListItem] = useState<FileListItem | null>(null);
  const [fileApprovals, setFileApprovals] = useState<ApprovalListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [activePanelTab, setActivePanelTab] = useState<FilePanelTab>('properties');
  const [signaturePlacementMode, setSignaturePlacementMode] = useState(false);
  const [signaturePlacementConfirmed, setSignaturePlacementConfirmed] = useState(false);
  const [savingSignaturePosition, setSavingSignaturePosition] = useState(false);
  const [pdfPageSize, setPdfPageSize] = useState<PdfPageSize>(FALLBACK_PDF_PAGE_SIZE);
  const [pdfPageCount, setPdfPageCount] = useState(1);
  const [signaturePosition, setSignaturePosition] = useState<SignaturePlacementValue>(
    getDefaultSignaturePosition(FALLBACK_PDF_PAGE_SIZE),
  );
  const [signFor, setSignFor] = useState<ApprovalListItem | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [modelViewer, setModelViewer] = useState<Autodesk.Viewing.GuiViewer3D | null>(null);
  const handleViewerReady = useCallback(
    (v: Autodesk.Viewing.GuiViewer3D | null) => setModelViewer(v),
    [],
  );

  const latestVersion = versions[0] ?? null;

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
        const currentFilePromise = folderId
          ? fileItemApi
            .getByFolder(folderId)
            .then((res) => res.data.result?.find((file) => file.id === fileId) ?? null)
            .catch(() => null)
          : Promise.resolve(null);
        const fileApprovalsPromise = approvalApi
          .getApprovals()
          .then((items) => items.filter((item) => item.fileItemId === fileId))
          .catch(() => []);

        const [viewResult, versionsResult, currentFileResult, fileApprovalsResult] = await Promise.all([
          fetchView(),
          fileItemApi.getVersions(fileId),
          currentFilePromise,
          fileApprovalsPromise,
        ]);

        if (!cancelled) {
          setInfo(viewResult);
          setVersions(versionsResult.data.result ?? []);
          setFileListItem(currentFileResult);
          setFileApprovals(fileApprovalsResult);
        }
      } catch {
        if (!cancelled) setError(t('fileView.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fileId, folderId, fetchView]);

  const status = info?.kind === 'model' ? info.viewerStatus : null;
  const isModelProcessing =
    status === ModelViewerStatus.Pending ||
    status === ModelViewerStatus.Processing ||
    status === ModelViewerStatus.None;

  useEffect(() => {
    if (!fileId || !isModelProcessing) return;

    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const result = await fetchView();
        if (!cancelled) setInfo(result);
      } catch {
        // Transient polling errors keep the current viewer state.
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [fileId, isModelProcessing, fetchView]);

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

  const handleRetranslate = useCallback(async () => {
    if (!fileId) return;

    setRetrying(true);
    try {
      await fileItemApi.retranslate(fileId);
      const result = await fetchView();
      setInfo(result);
    } catch {
      setError(t('fileView.error'));
    } finally {
      setRetrying(false);
    }
  }, [fileId, fetchView]);

  const isModelReady =
    info?.kind === 'model' && status === ModelViewerStatus.Ready && !!info.urn;
  const isModelFailed = info?.kind === 'model' && status === ModelViewerStatus.Failed;

  const canMarkup = Boolean(info?.kind === 'model' && isModelReady);

  const statusMeta = useMemo(
    () => getStatusMeta(info, isModelProcessing, isModelFailed),
    [info, isModelProcessing, isModelFailed],
  );

  const fileTitle = info?.fileName ?? t('fileView.untitled');
  const format = (info?.format ?? latestVersion?.format ?? '').toUpperCase() || '-';
  const isPdfFile = format === 'PDF';
  const isWordFile = isWordFormat(format);
  const isVisualSignableFile = isPdfFile || isWordFile;
  const fileSize = latestVersion ? formatSize(latestVersion.fileSizeBytes) : '-';
  const uploadedBy = latestVersion?.uploadedByName ?? '-';
  const uploadedAt = formatDateTime(latestVersion?.uploadedAt);
  const signatureApprovals = useMemo(
    () => fileApprovals.filter((approval) => approval.requiresSignature),
    [fileApprovals],
  );
  const signableApproval = useMemo(
    () => signatureApprovals.find((approval) =>
      approval.status === 'PendingApproval' && !approval.isSigned) ?? null,
    [signatureApprovals],
  );
  const canSignCurrentApproval = Boolean(signableApproval && isVisualSignableFile);
  const requiresSignature = Boolean(
    info?.requiresSignature ||
    fileListItem?.requiresSignature ||
    signatureApprovals.length > 0,
  );
  const isSigned = Boolean(
    info?.isSigned ||
    fileListItem?.isSigned ||
    signatureApprovals.some((approval) => approval.isSigned),
  );

  const openSignaturePlacement = useCallback(async () => {
    if (!requiresSignature) return;
    if (!isVisualSignableFile) {
      setToast({ msg: t('smartca.error.pdfOnly'), type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    if (!signableApproval) {
      setToast({ msg: t('fileView.signatureHistory.noPendingSignature'), type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      const pageInfo = await smartcaApi.getPdfPageInfo(signableApproval.fileItemId, 1);
      const realPageSize: PdfPageSize = { width: pageInfo.width, height: pageInfo.height };
      setPdfPageSize(realPageSize);
      setPdfPageCount(Math.max(1, pageInfo.pageCount));
      if (!signaturePlacementConfirmed) {
        setSignaturePosition(getDefaultSignaturePosition(realPageSize));
      }
    } catch {
      // Khong lay duoc kich thuoc trang thuc -> giu fallback A4, van cho dat vi tri (se duoc BE validate boundary lai).
    }

    setActivePanelTab('signatureHistory');
    setSignaturePlacementMode(true);
  }, [requiresSignature, signableApproval, isVisualSignableFile, signaturePlacementConfirmed]);

  // Chuyen trang khi dat vi tri ky: tai lai kich thuoc trang moi (co the khac trang dau) va giu vi tri trong bien trang moi.
  const handleSignaturePageChange = useCallback(async (nextPage: number) => {
    if (!signableApproval) return;
    const clamped = Math.max(1, Math.min(pdfPageCount, nextPage));
    if (clamped === signaturePosition.pageNumber) return;

    try {
      const pageInfo = await smartcaApi.getPdfPageInfo(signableApproval.fileItemId, clamped);
      const newSize: PdfPageSize = { width: pageInfo.width, height: pageInfo.height };
      setPdfPageSize(newSize);
      setSignaturePosition((prev) => ({
        ...prev,
        pageNumber: clamped,
        x: Math.max(0, Math.min(newSize.width - prev.width, prev.x)),
        y: Math.max(0, Math.min(newSize.height - prev.height, prev.y)),
      }));
    } catch {
      setSignaturePosition((prev) => ({ ...prev, pageNumber: clamped }));
    }
  }, [signableApproval, pdfPageCount, signaturePosition.pageNumber]);

  const refreshFileApprovals = useCallback(async () => {
    if (!fileId) return;
    const items = await approvalApi.getApprovals();
    setFileApprovals(items.filter((item) => item.fileItemId === fileId));
  }, [fileId]);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleConfirmSignaturePlacement = useCallback(async (position: SignaturePlacementValue) => {
    if (!signableApproval) {
      showToast(t('fileView.signatureHistory.noPendingSignature'), 'error');
      return;
    }

    setSavingSignaturePosition(true);
    try {
      await smartcaApi.saveSignaturePosition(signableApproval.fileItemId, position);
      setSignaturePosition(position);
      setSignaturePlacementConfirmed(true);
      setSignaturePlacementMode(false);
      setSignFor(signableApproval);
      showToast(t('smartca.toast.positionSaved'));
    } catch (err) {
      showToast(smartcaErrorMessage(err, t('smartca.error.placementSave')), 'error');
    } finally {
      setSavingSignaturePosition(false);
    }
  }, [showToast, signableApproval]);

  useEffect(() => {
    if (requiresSignature) return;
    setSignaturePlacementMode(false);
  }, [requiresSignature]);

  return (
    <div className="min-h-[calc(100vh-96px)] bg-[#fbf9f1] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-5 xl:flex-row">
        <main className="min-w-0 flex-1 space-y-5">
          <header className="flex flex-col gap-4 rounded-3xl border border-card-border/70 bg-card/80 px-5 py-4 shadow-card backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <FileIcon danger={format === 'PDF'} />
              <div className="min-w-0">
                <h1 className="truncate font-display text-2xl font-semibold text-text sm:text-3xl">{fileTitle}</h1>
                <p className="mt-1 text-sm text-text-muted">
                  {format} {latestVersion ? `- V${latestVersion.versionNumber}` : ''}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>
                {statusMeta.label}
              </span>
              <button
                type="button"
                onClick={goBack}
                className="rounded-full border border-card-border px-4 py-2 text-sm font-semibold text-text transition-colors hover:bg-content-bg"
              >
                {t('fileView.back')}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!info}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('fileView.download.button')}
              </button>
            </div>
          </header>

          <section className="relative h-[calc(100vh-250px)] min-h-[560px] overflow-hidden rounded-3xl border border-card-border bg-card shadow-card">
            <div className="absolute inset-0 bg-[#dcdad2]" />

            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <Spinner />
                <p className="font-jakarta text-sm text-text-muted">{t('common.loading')}</p>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <p className="font-jakarta text-sm font-medium text-danger">{error}</p>
              </div>
            ) : isModelReady ? (
              <div className="absolute inset-0 bg-card">
                <ModelViewer
                  urn={info!.urn!}
                  className="h-full w-full"
                  onViewerReady={handleViewerReady}
                />
              </div>
            ) : isModelProcessing ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                <Spinner />
                <h3 className="font-display text-lg font-semibold text-text">{t('fileView.model.processing.title')}</h3>
                <p className="max-w-md font-jakarta text-sm text-text-muted">{t('fileView.model.processing.desc')}</p>
                {info?.viewerProgress ? (
                  <p className="font-jakarta text-sm font-medium text-primary">{info.viewerProgress}</p>
                ) : null}
              </div>
            ) : isModelFailed ? (
              <div className="absolute inset-0 flex items-center justify-center px-6">
                <EmptyViewerState
                  danger
                  title={t('fileView.model.failed.title')}
                  desc={t('fileView.model.failed.desc')}
                  primaryLabel={retrying ? t('fileView.model.retrying') : t('fileView.model.failed.retry')}
                  onPrimary={handleRetranslate}
                  secondaryLabel={t('fileView.download.button')}
                  onSecondary={handleDownload}
                  disabled={retrying}
                />
              </div>
            ) : info && info.kind === 'inline' && info.url ? (
              <div className="absolute inset-0 p-5">
                <div className="h-full overflow-hidden rounded-2xl bg-white shadow-sm">
                  <InlineContent info={info} />
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center px-6">
                <EmptyViewerState
                  title={t('fileView.download.title')}
                  desc={t('fileView.download.desc')}
                  primaryLabel={t('fileView.download.button')}
                  onPrimary={handleDownload}
                />
              </div>
            )}

            {requiresSignature && signaturePlacementMode && (
              <SignaturePlacementOverlay
                fileName={fileTitle}
                pdfUrl={info?.url ?? null}
                pageSize={pdfPageSize}
                pageCount={pdfPageCount}
                confirmed={signaturePlacementConfirmed}
                busy={savingSignaturePosition}
                value={signaturePosition}
                onChange={setSignaturePosition}
                onChangePage={handleSignaturePageChange}
                onConfirm={handleConfirmSignaturePlacement}
                onClose={() => setSignaturePlacementMode(false)}
              />
            )}


            <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4">
              <div className="pointer-events-auto flex max-w-full items-center gap-3 rounded-full border border-card-border/70 bg-card/90 px-4 py-3 shadow-dropdown backdrop-blur">
                <button type="button" className="rounded-lg px-2 py-1 text-sm font-semibold text-text transition-colors hover:bg-content-bg">-</button>
                <span className="min-w-24 text-center text-sm font-semibold text-text">{format}</span>
                <button type="button" className="rounded-lg px-2 py-1 text-sm font-semibold text-text transition-colors hover:bg-content-bg">+</button>
                <span className="h-4 w-px bg-card-border" />
                <button type="button" onClick={handleDownload} className="rounded-lg px-2 py-1 text-sm font-semibold text-primary transition-colors hover:bg-primary/10">
                  {t('fileView.download.button')}
                </button>
              </div>
            </div>
          </section>
        </main>

        <aside className="w-full shrink-0 overflow-hidden rounded-3xl border border-card-border bg-card shadow-card xl:w-[360px]">
          <div className={`grid ${canMarkup && info?.kind === 'model' ? 'grid-cols-3' : 'grid-cols-2'} border-b border-card-border`}>
            <PanelTabButton
              active={activePanelTab === 'properties'}
              label={t('fileView.tabs.properties')}
              onClick={() => setActivePanelTab('properties')}
            />
            <PanelTabButton
              active={activePanelTab === 'signatureHistory'}
              label={t('fileView.tabs.signatureHistory')}
              badge={requiresSignature && !isSigned ? '0' : undefined}
              onClick={() => setActivePanelTab('signatureHistory')}
            />
            {canMarkup && info?.kind === 'model' && (
              <PanelTabButton
                active={activePanelTab === 'markup'}
                label={t('markup.model.tabLabel')}
                onClick={() => setActivePanelTab('markup')}
              />
            )}
          </div>

          <div className="max-h-[calc(100vh-170px)] overflow-y-auto p-6">
            {activePanelTab === 'properties' ? (
              <FilePropertiesPanel
                info={info}
                fileListItem={fileListItem}
                latestVersion={latestVersion}
                format={format}
                fileSize={fileSize}
                uploadedBy={uploadedBy}
                uploadedAt={uploadedAt}
                statusMeta={statusMeta}
                versions={versions}
              />
            ) : activePanelTab === 'markup' ? (
              modelViewer && fileId ? (
                <ModelCommentsPanel
                  viewer={modelViewer}
                  fileItemId={fileId}
                  fileVersionId={fileListItem?.currentVersionId ?? null}
                />
              ) : (
                <p className="py-8 text-center text-sm text-text-muted">{t('markup.model.viewerLoading')}</p>
              )
            ) : (
              <SignatureHistoryPanel
                requiresSignature={requiresSignature}
                canSign={canSignCurrentApproval}
                signatureApprovals={signatureApprovals}
                placementActive={signaturePlacementMode}
                placementConfirmed={signaturePlacementConfirmed}
                onStartPlacement={openSignaturePlacement}
              />
            )}
          </div>
        </aside>
      </div>

      {toast && (
        <div className={`fixed right-6 top-20 z-[80] animate-slide-up rounded-xl border px-5 py-3 shadow-dropdown ${toast.type === 'success' ? 'border-success/30 bg-success-light' : 'border-danger/30 bg-danger-light'}`}>
          <p className={`text-sm font-medium ${toast.type === 'success' ? 'text-success' : 'text-danger'}`}>{toast.msg}</p>
        </div>
      )}

      {signFor && (
        <SmartCaSignModal
          approval={signFor}
          onClose={() => setSignFor(null)}
          onToast={showToast}
          onSigned={() => {
            void refreshFileApprovals();
            void fetchView().then(setInfo).catch(() => undefined);
            if (fileId) {
              void fileItemApi.getVersions(fileId).then((res) => setVersions(res.data.result ?? [])).catch(() => undefined);
            }
          }}
        />
      )}
    </div>
  );
}

function PanelTabButton({
  active,
  label,
  badge,
  onClick,
}: {
  active: boolean;
  label: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex h-14 items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors ${active ? 'text-primary' : 'text-text-muted hover:bg-content-bg hover:text-text'
        }`}
    >
      {label}
      {badge ? (
        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? 'bg-primary text-white' : 'bg-danger text-white'}`}>
          {badge}
        </span>
      ) : null}
      {active && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />}
    </button>
  );
}

function fileTypeLabel(type: FileType | undefined): string {
  switch (type) {
    case FileType.Pdf: return t('fileView.fileType.pdf');
    case FileType.Ifc: return t('fileView.fileType.ifc');
    case FileType.Image: return t('fileView.fileType.image');
    case FileType.Cad: return t('fileView.fileType.cad');
    case FileType.Office: return t('fileView.fileType.office');
    default: return t('fileView.fileType.other');
  }
}

function itemStatusMeta(status: FileItemStatus | undefined): { label: string; className: string } {
  switch (status) {
    case FileItemStatus.Approved:
      return { label: t('fileView.itemStatus.approved'), className: 'bg-success-light text-success' };
    case FileItemStatus.Rejected:
      return { label: t('fileView.itemStatus.rejected'), className: 'bg-danger-light text-danger' };
    case FileItemStatus.PendingApproval:
      return { label: t('fileView.itemStatus.pending'), className: 'bg-warning-light text-warning' };
    default:
      return { label: t('fileView.itemStatus.draft'), className: 'bg-content-bg text-text-secondary' };
  }
}

function FilePropertiesPanel({
  info,
  fileListItem,
  latestVersion,
  format,
  fileSize,
  uploadedBy,
  uploadedAt,
  statusMeta,
  versions,
}: {
  info: FileViewInfo | null;
  fileListItem: FileListItem | null;
  latestVersion: FileVersion | null;
  format: string;
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
  statusMeta: { label: string; className: string };
  versions: FileVersion[];
}) {
  const name = info?.fileName ?? fileListItem?.name ?? '-';
  const currentVersionNumber = fileListItem?.currentVersionNumber ?? latestVersion?.versionNumber ?? 0;
  const updatedAt = formatDateTime(fileListItem?.updatedAt);
  const requiresSignature = Boolean(info?.requiresSignature || fileListItem?.requiresSignature);
  const isSigned = Boolean(info?.isSigned || fileListItem?.isSigned);
  const checksum = latestVersion?.checksum ?? null;
  const status = itemStatusMeta(fileListItem?.status);
  const yesNo = (v: boolean) => (v ? t('fileView.info.yes') : t('fileView.info.no'));

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold text-text">{t('fileView.details.title')}</h2>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>{statusMeta.label}</span>
      </div>

      <div className="mt-6 space-y-5">
        <DetailItem label={t('fileView.info.name')} value={<span className="break-all">{name}</span>} />
        <DetailItem label={t('fileView.info.type')} value={fileTypeLabel(fileListItem?.fileType)} />
        <DetailItem label={t('fileView.details.format')} value={format} />
        <DetailItem label={t('fileView.details.size')} value={fileSize} />
        <DetailItem
          label={t('fileView.info.status')}
          value={<span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}>{status.label}</span>}
        />
        <DetailItem label={t('fileView.info.currentVersion')} value={currentVersionNumber ? `V${currentVersionNumber}` : '-'} />
        <DetailItem label={t('fileView.info.versionCount')} value={String(versions.length)} />
        <DetailItem
          label={t('fileView.details.owner')}
          value={
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                {uploadedBy !== '-' ? uploadedBy.slice(0, 2).toUpperCase() : 'NA'}
              </span>
              <span>{uploadedBy}</span>
            </div>
          }
        />
        <DetailItem label={t('fileView.details.uploadedAt')} value={uploadedAt} />
        <DetailItem label={t('fileView.info.updatedAt')} value={updatedAt} />
        <DetailItem label={t('fileView.info.requiresSignature')} value={yesNo(requiresSignature)} />
        <DetailItem
          label={t('fileView.info.isSigned')}
          value={<span className={isSigned ? 'font-semibold text-success' : ''}>{yesNo(isSigned)}</span>}
        />
        {checksum && <DetailItem label={t('fileView.info.checksum')} value={<span className="break-all text-xs text-text-secondary">{checksum}</span>} />}
      </div>

      <div className="mt-6 border-t border-card-border/70 pt-5">
        <h3 className="text-sm font-bold text-text">{t('fileView.details.history')}</h3>
        <div className="mt-4 space-y-4">
          {versions.slice(0, 4).map((version, index) => (
            <div key={version.id} className="flex gap-3">
              <span className={`mt-0.5 h-9 w-1 rounded-full ${index === 0 ? 'bg-primary' : 'bg-card-border'}`} />
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-text">
                  V{version.versionNumber} - {version.format.toUpperCase()}
                </p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {version.uploadedByName ?? '-'} - {formatDateTime(version.uploadedAt)}
                </p>
              </div>
            </div>
          ))}

          {versions.length === 0 && (
            <p className="text-sm text-text-muted">{t('fileView.details.noHistory')}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SignatureHistoryPanel({
  requiresSignature,
  canSign,
  signatureApprovals,
  placementActive,
  placementConfirmed,
  onStartPlacement,
}: {
  requiresSignature: boolean;
  canSign: boolean;
  signatureApprovals: ApprovalListItem[];
  placementActive: boolean;
  placementConfirmed: boolean;
  onStartPlacement: () => void;
}) {
  return (
    <div>
      <h2 className="font-heading text-lg font-bold text-text">{t('fileView.signatureHistory.title')}</h2>
      <p className="mt-1 text-sm text-text-muted">{t('fileView.signatureHistory.desc')}</p>

      {requiresSignature && canSign && (
        <button
          type="button"
          onClick={onStartPlacement}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#8a5100] px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#744500]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          {placementActive ? t('fileView.signatureHistory.signing') : t('fileView.signatureHistory.signNow')}
        </button>
      )}

      <div className="relative mt-6 space-y-5">
        <div className="absolute bottom-12 left-4 top-4 w-0.5 bg-card-border/70" />
        {signatureApprovals.length > 0 ? (
          signatureApprovals.map((approval) => (
            <SignatureApprovalTimelineItem key={approval.id} approval={approval} />
          ))
        ) : (
          <SignatureTimelineItem
            title={placementConfirmed ? t('fileView.signatureHistory.placementConfirmed') : t('fileView.signatureHistory.waitingTitle')}
            body={placementConfirmed ? t('fileView.signatureHistory.placementConfirmedDesc') : t('fileView.signatureHistory.waitingDesc')}
            muted={!placementConfirmed}
          />
        )}

        <div className="flex flex-col items-center pt-4 text-center opacity-60">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-card-border text-text-muted">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <p className="mt-3 text-xs font-bold uppercase tracking-wider text-text-muted">
            {t('fileView.signatureHistory.nextWaiting')}
          </p>
        </div>
      </div>
    </div>
  );
}

function approvalStatusLabel(status: ApprovalStatus): string {
  if (status === 'Approved') return t('documents.status.approved');
  if (status === 'Rejected') return t('documents.status.rejected');
  return t('documents.status.pending');
}

function SignatureApprovalTimelineItem({ approval }: { approval: ApprovalListItem }) {
  const isSigned = approval.isSigned;
  const isRejected = approval.status === 'Rejected';
  const title = isSigned
    ? t('fileView.signatureHistory.signedApprovalTitle')
    : isRejected
      ? t('fileView.signatureHistory.rejectedApprovalTitle')
      : t('fileView.signatureHistory.pendingApprovalTitle');
  const body = isSigned
    ? t('fileView.signatureHistory.signedApprovalDesc')
    : isRejected
      ? approval.rejectReason || t('fileView.signatureHistory.rejectedApprovalDesc')
      : t('fileView.signatureHistory.pendingApprovalDesc');
  const toneClass = isSigned
    ? 'bg-success-light text-success'
    : isRejected
      ? 'bg-danger-light text-danger'
      : 'bg-warning-light text-warning';

  return (
    <div className="relative flex gap-4">
      <span className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${isSigned ? 'bg-primary/10 text-primary' : 'bg-content-bg text-text-muted'}`}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <div className="flex-1 rounded-2xl border border-card-border bg-white/80 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-bold text-text">{title}</h3>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${toneClass}`}>
            {approvalStatusLabel(approval.status)}
          </span>
        </div>
        <p className="mt-2 text-xs font-medium text-text-secondary">{body}</p>
        <div className="mt-3 space-y-1 border-t border-card-border/60 pt-3 text-xs text-text-muted">
          <p>{t('approvals.detail.requestedBy')}: {approval.requestedByName || '-'}</p>
          <p>{t('approvals.detail.createdAt')}: {formatDateTime(approval.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}

function SignaturePlacementOverlay({
  fileName,
  pdfUrl,
  pageSize,
  pageCount,
  confirmed,
  busy,
  value,
  onChange,
  onChangePage,
  onConfirm,
  onClose,
}: {
  fileName: string;
  pdfUrl: string | null;
  pageSize: PdfPageSize;
  pageCount: number;
  confirmed: boolean;
  busy: boolean;
  value: SignaturePlacementValue;
  onChange: (value: SignaturePlacementValue) => void;
  onChangePage: (page: number) => void;
  onConfirm: (value: SignaturePlacementValue) => void;
  onClose: () => void;
}) {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
  } | null>(null);

  const boxStyle = {
    left: `${(value.x / pageSize.width) * 100}%`,
    top: `${(value.y / pageSize.height) * 100}%`,
    width: `${(value.width / pageSize.width) * 100}%`,
    height: `${(value.height / pageSize.height) * 100}%`,
  };

  const clampPosition = useCallback((next: SignaturePlacementValue): SignaturePlacementValue => ({
    ...next,
    x: Math.max(0, Math.min(pageSize.width - next.width, next.x)),
    y: Math.max(0, Math.min(pageSize.height - next.height, next.y)),
  }), [pageSize]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (busy) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: value.x,
      startY: value.y,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const page = pageRef.current;
    if (!drag || !page || drag.pointerId !== event.pointerId) return;

    const rect = page.getBoundingClientRect();
    const deltaX = ((event.clientX - drag.startClientX) / rect.width) * pageSize.width;
    const deltaY = ((event.clientY - drag.startClientY) / rect.height) * pageSize.height;
    onChange(clampPosition({
      ...value,
      x: Math.round(drag.startX + deltaX),
      y: Math.round(drag.startY + deltaY),
    }));
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  return (
    <div className="absolute inset-0 z-20 overflow-hidden bg-[#dcdad2]/95">
      <div className="absolute left-6 right-6 top-5 z-20 flex flex-wrap items-center gap-4 rounded-2xl border border-white/60 bg-card/80 px-5 py-3 shadow-dropdown backdrop-blur">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">{t('smartca.placement.toolbarLabel')}</span>
        <SignatureToolButton label={t('smartca.placement.insertSignature')} />
        <SignatureToolButton
          label={t('smartca.placement.resetPosition')}
          onClick={() => onChange(getDefaultSignaturePosition(pageSize))}
        />

        {pageCount > 1 && (
          <div className="flex items-center gap-1.5 rounded-lg border border-card-border bg-content-bg/60 px-2 py-1">
            <button
              type="button"
              disabled={busy || value.pageNumber <= 1}
              onClick={() => onChangePage(value.pageNumber - 1)}
              aria-label={t('smartca.placement.prevPage')}
              className="flex h-6 w-6 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-content-bg disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="min-w-16 text-center text-xs font-semibold text-text">
              {t('smartca.placement.page')} {value.pageNumber}/{pageCount}
            </span>
            <button
              type="button"
              disabled={busy || value.pageNumber >= pageCount}
              onClick={() => onChangePage(value.pageNumber + 1)}
              aria-label={t('smartca.placement.nextPage')}
              className="flex h-6 w-6 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-content-bg disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="ml-auto rounded-full border border-card-border px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-content-bg"
        >
          {t('smartca.signModal.cancel')}
        </button>
      </div>

      <div className="absolute inset-0 flex justify-center overflow-auto px-8 pb-8 pt-24">
        <div
          ref={pageRef}
          style={{ aspectRatio: `${pageSize.width} / ${pageSize.height}` }}
          className="relative h-[calc(100vh-170px)] min-h-[760px] max-h-[1040px] bg-white shadow-card"
        >
          <div className="absolute left-7 right-7 top-5 z-10 flex items-center justify-between rounded-xl border border-white/70 bg-[#fbf9f1]/90 px-5 py-3 shadow-sm backdrop-blur">
            <div className="min-w-0">
              <p className="truncate font-display text-base font-bold text-primary">{fileName}</p>
              <p className="text-xs text-text-muted">{t('smartca.placement.previewDocument')}</p>
            </div>
            <span className="rounded-full bg-success-light px-3 py-1 text-xs font-semibold text-success">
              {confirmed ? t('smartca.placement.confirmed') : t('smartca.placement.pending')}
            </span>
          </div>

          {pdfUrl ? (
            <iframe
              key={value.pageNumber}
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&page=${value.pageNumber}&view=FitH`}
              title={fileName}
              className="pointer-events-none absolute inset-0 h-full w-full border-0 bg-white"
            />
          ) : (
            <div className="absolute inset-10 flex items-center justify-center rounded-2xl border border-card-border bg-[#f6f4ec] text-sm font-semibold text-text-muted">
              {t('smartca.placement.noPreview')}
            </div>
          )}

          <div
            role="button"
            tabIndex={0}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="absolute flex touch-none cursor-grab select-none items-center justify-center border-2 border-dashed border-primary bg-primary/5 text-center backdrop-blur-sm active:cursor-grabbing"
            style={boxStyle}
          >
            <span className="absolute -left-4 -top-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-card">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <p className="text-base font-bold tracking-wide text-primary">{t('smartca.placement.positionLabel')}</p>
            <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-sm bg-primary" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 z-30 w-[288px] rounded-3xl border border-white bg-white/75 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.12)] backdrop-blur">
        <h3 className="font-display text-lg font-semibold text-text">{t('smartca.placement.confirmTitle')}</h3>
        <p className="mt-2 text-xs font-medium leading-5 tracking-wide text-text-secondary">{t('smartca.placement.confirmDesc')}</p>
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => onConfirm(value)}
            disabled={busy}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? t('common.loading') : confirmed ? t('smartca.placement.confirmed') : t('smartca.placement.confirmPosition')}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="w-full rounded-xl border border-card-border px-4 py-3 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg"
          >
            {t('smartca.signModal.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

function SignatureToolButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg px-3 py-1.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg hover:text-text"
    >
      {label}
    </button>
  );
}

function SignatureTimelineItem({ title, body, muted = false }: { title: string; body: string; muted?: boolean }) {
  return (
    <div className="relative flex gap-4">
      <span className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${muted ? 'bg-content-bg text-text-muted' : 'bg-primary/10 text-primary'}`}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <div className="flex-1 rounded-2xl border border-card-border bg-white/80 p-4 shadow-sm">
        <h3 className="text-sm font-bold text-text">{title}</h3>
        <p className="mt-2 text-xs font-medium text-text-secondary">{body}</p>
      </div>
    </div>
  );
}

interface EmptyViewerStateProps {
  title: string;
  desc: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  danger?: boolean;
  disabled?: boolean;
}

function EmptyViewerState({
  title,
  desc,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  danger = false,
  disabled = false,
}: EmptyViewerStateProps) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl bg-card/90 p-8 text-center shadow-card">
      <FileIcon danger={danger} />
      <h3 className="font-display text-lg font-semibold text-text">{title}</h3>
      <p className="font-jakarta text-sm text-text-muted">{desc}</p>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onPrimary}
          disabled={disabled}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {primaryLabel}
        </button>
        {secondaryLabel && onSecondary && (
          <button
            type="button"
            onClick={onSecondary}
            className="rounded-full border border-primary px-6 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-ghost"
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
