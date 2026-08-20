import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import type { ApprovalListItem, ApprovalStatus } from '@/entities/approval';
import { approvalApi } from '@/entities/approval';
import type { FileListItem, FileVersion, FileViewInfo } from '@/entities/file-item';
import { fileItemApi, FileItemStatus, FileType, InlineFileView, ModelViewerStatus, RelatedFileArea, useInlineFileContent } from '@/entities/file-item';
import { isAccountAdmin, useSession } from '@/entities/session';
import { smartcaApi, smartcaErrorMessage } from '@/entities/smartca';
import { FileActivitySection } from '@/features/audit-logs';
import { FileVersionsModal, formatSize, isRequiredSigner, RelatedFilesPanel, SmartCaSignModal, useFolderPermission } from '@/features/folders';
import { IssuesPanel } from '@/features/issues';
import { LoiCheckPanel } from '@/features/loi-check';
import { useProjectGroups } from '@/features/projects';
import { getApiErrorMessage } from '@/shared/api';
import { ActionIconButton, ConfirmDialog, EmptyViewerState, FileTypeIcon, Toast, ToolbarIconButton, useToast } from '@/shared/components';
import { downloadBlob } from '@/shared/lib/download';
import { t } from '@/shared/lib/i18n';
import { sortByNewest } from '@/shared/lib/sort';
import { useUrlTab } from '@/shared/lib/url';
import { ModelViewer } from '@/widgets/ModelViewer';

const POLL_INTERVAL_MS = 3000;
const VERSION_PREVIEW_COUNT = 5;
// Chữa cháy: lỡ không lấy được kích thước thật thì dùng tạm A4
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

// Chỗ mặc định để thả chữ ký vào (góc dưới bên phải)
function getDefaultSignaturePosition(pageSize: PdfPageSize): SignaturePlacementValue {
  const width = Math.round(pageSize.width * 0.27);
  const height = Math.round(pageSize.height * 0.083);
  return {
    pageNumber: 1,
    // Đặt giữa trang (theo cả 2 chiều) để người dùng thấy rõ vị trí ký khi đặt/xác nhận.
    x: Math.round((pageSize.width - width) / 2),
    y: Math.round((pageSize.height - height) / 2),
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

function isExcelFormat(format: string) {
  return format === 'XLS' || format === 'XLSX';
}

// Ban ve CAD 2D duoc convert sang PDF (qua ConvertAPI) de ho tro ky so truc quan.
function isCad2DFormat(format: string) {
  return format === 'DWG' || format === 'DWGX';
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</p>
      <div className="break-words text-sm font-medium text-text">{value}</div>
    </div>
  );
}

const PANEL_TABS = ['properties', 'signatureHistory', 'issues', 'loi', 'related'] as const;

export function FileViewPage() {
  const { projectId, fileId } = useParams<{ projectId: string; fileId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const folderId = searchParams.get('folder');
  const viewingVersionId = searchParams.get('version');
  const { currentUser } = useSession();
  const { groups: projectGroups } = useProjectGroups(projectId);

  const [info, setInfo] = useState<FileViewInfo | null>(null);
  const [versions, setVersions] = useState<FileVersion[]>([]);
  const [fileListItem, setFileListItem] = useState<FileListItem | null>(null);
  const [fileApprovals, setFileApprovals] = useState<ApprovalListItem[]>([]);
  // File đã nạp xong dữ liệu. Suy ra `loading` từ đây thay vì giữ cờ riêng: đổi file (bấm 1 tệp
  // liên quan) là id lệch ngay -> loading bật tức thì, không cần setState trong effect.
  // Trước đây cờ loading chỉ được bật lúc khởi tạo rồi tắt vĩnh viễn -> chuyển file KHÔNG hiện
  // loading và trang vẫn bày dữ liệu của file CŨ như thể đã tải xong.
  const [loadedViewKey, setLoadedViewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [confirmSetCurrent, setConfirmSetCurrent] = useState(false);
  const [settingCurrent, setSettingCurrent] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [activePanelTab, setActivePanelTab] = useUrlTab(PANEL_TABS, 'properties', 'panel');
  const [signaturePlacementMode, setSignaturePlacementMode] = useState(false);
  const [signaturePlacementConfirmed, setSignaturePlacementConfirmed] = useState(false);
  const [savingSignaturePosition, setSavingSignaturePosition] = useState(false);
  const [pdfPageSize, setPdfPageSize] = useState<PdfPageSize>(FALLBACK_PDF_PAGE_SIZE);
  const [pdfPageCount, setPdfPageCount] = useState(1);
  const [signaturePosition, setSignaturePosition] = useState<SignaturePlacementValue>(
    getDefaultSignaturePosition(FALLBACK_PDF_PAGE_SIZE),
  );
  const [signFor, setSignFor] = useState<ApprovalListItem | null>(null);
  // File model (CAD 2D) khong co info.inlineUrl (xem qua ModelViewer/URN) -> lay rieng URL ban PDF dung de dat vi tri ky.
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string | null>(null);
  const { toast, showToast } = useToast();

  const currentVersion = versions.find((v) => v.isCurrent) ?? versions[0] ?? null;
  const viewedVersion = viewingVersionId
    ? versions.find((v) => v.id === viewingVersionId) ?? null
    : null;
  const latestVersion = viewedVersion ?? currentVersion;
  const isVersionView = Boolean(viewingVersionId) && info?.isCurrentVersion === false;

  const viewKey = `${fileId ?? ''}::${viewingVersionId ?? 'current'}`;
  const loading = Boolean(fileId) && loadedViewKey !== viewKey;
  // Đang ĐỔI sang file khác (đã có nội dung file cũ trên màn) — khác với lần tải đầu (màn còn trống).
  // Lúc này màn vẫn bày dữ liệu file cũ nên phải chặn thao tác, tránh bấm nhầm ghi chú/ký số của file cũ.
  const switchingFile = loading && info !== null;

  const permissionFolderId = info?.folderId ?? fileListItem?.folderId ?? folderId ?? null;
  const { permission } = useFolderPermission(permissionFolderId, isAccountAdmin(currentUser?.role));
  const canManageVersions = Boolean(permission?.canEdit);
  const canRestoreVersion = canManageVersions && info?.area === RelatedFileArea.Wip;

  const openVersion = useCallback((versionId: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (versionId) next.set('version', versionId);
    else next.delete('version');
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const fetchView = useCallback(async (): Promise<FileViewInfo> => {
    const { data } = viewingVersionId
      ? await fileItemApi.getVersionView(fileId!, viewingVersionId)
      : await fileItemApi.getView(fileId!);
    if (data.isSuccess && data.result) return data.result;
    throw new Error(data.message || t('fileView.error'));
  }, [fileId, viewingVersionId]);

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
          setError(null);   // xoá lỗi còn sót của file trước khi chuyển sang file mới
          setInfo(viewResult);
          setVersions(sortByNewest(versionsResult.data.result ?? [], (v) => v.createdAt));
          setFileListItem(currentFileResult);
          setFileApprovals(fileApprovalsResult);
        }
      } catch {
        if (!cancelled) setError(t('fileView.error'));
      } finally {
        if (!cancelled) setLoadedViewKey(viewKey);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fileId, folderId, viewKey, fetchView]);

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

  const handleDownload = useCallback(async () => {
    if (!fileId || !info) return;

    try {
      const res = isVersionView && viewingVersionId
        ? await fileItemApi.downloadVersion(fileId, viewingVersionId)
        : await fileItemApi.download(fileId);
      downloadBlob(res.data as Blob, info.fileName);
    } catch (err) {
      showToast(getApiErrorMessage(err, t('common.error')), 'error');
    }
  }, [fileId, info, isVersionView, viewingVersionId, showToast]);

  const handleRetranslate = useCallback(async () => {
    if (!fileId) return;

    setRetrying(true);
    try {
      await fileItemApi.retranslate(fileId);
      const result = await fetchView();
      setInfo(result);
    } catch (err) {
      showToast(getApiErrorMessage(err, t('fileView.error')), 'error');
    } finally {
      setRetrying(false);
    }
  }, [fileId, fetchView, showToast]);

  const isModelReady =
    info?.kind === 'model' && status === ModelViewerStatus.Ready && !!info.urn;
  const isModelFailed = info?.kind === 'model' && status === ModelViewerStatus.Failed;

  const statusMeta = useMemo(
    () => getStatusMeta(info, isModelProcessing, isModelFailed),
    [info, isModelProcessing, isModelFailed],
  );

  const fileTitle = info?.fileName ?? t('fileView.untitled');
  const format = (info?.format ?? latestVersion?.format ?? '').toUpperCase() || '-';
  const isPdfFile = format === 'PDF';
  const isWordFile = isWordFormat(format);
  const isExcelFile = isExcelFormat(format);
  const isCad2DFile = isCad2DFormat(format);
  const isVisualSignableFile = isPdfFile || isWordFile || isExcelFile || isCad2DFile;
  const showLoiTab = format === 'IFC';
  const fileSize = latestVersion ? formatSize(latestVersion.fileSizeBytes) : '-';
  const uploadedBy = fileListItem?.authorName ?? '-';
  const uploadedAt = formatDateTime(latestVersion?.createdAt);
  const signatureApprovals = useMemo(
    () => fileApprovals.filter((approval) => approval.requiresSignature),
    [fileApprovals],
  );
  const signableApproval = useMemo(
    () => signatureApprovals.find((approval) =>
      approval.status === 'PendingApproval' && !approval.isSigned) ?? null,
    [signatureApprovals],
  );
  const isSignerForCurrentApproval = Boolean(
    signableApproval && isRequiredSigner(signableApproval.signers, currentUser?.accountId, projectGroups),
  );
  const canSignCurrentApproval = Boolean(signableApproval && isVisualSignableFile && isSignerForCurrentApproval);
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
      showToast(t('smartca.error.pdfOnly'), 'error');
      return;
    }
    if (!signableApproval) {
      showToast(t('fileView.signatureHistory.noPendingSignature'), 'error');
      return;
    }

    try {
      const pageInfo = await smartcaApi.getPdfPageInfo(signableApproval.fileItemId, 1);
      const realPageSize: PdfPageSize = { width: pageInfo.width, height: pageInfo.height };
      setPdfPageSize(realPageSize);
      setPdfPageCount(Math.max(1, pageInfo.pageCount));
      setSignaturePreviewUrl(pageInfo.previewUrl ?? null);
      if (!signaturePlacementConfirmed) {
        setSignaturePosition(getDefaultSignaturePosition(realPageSize));
      }
    } catch (err) {
      showToast(smartcaErrorMessage(err, t('smartca.error.placementSave')), 'error');
      return;
    }

    setActivePanelTab('signatureHistory');
    setSignaturePlacementMode(true);
  }, [requiresSignature, signableApproval, isVisualSignableFile, signaturePlacementConfirmed, showToast, setActivePanelTab]);

  // Đổi trang thì nhớ check lại kích thước trang mới để không bị lọt chữ ký ra ngoài
  const handleSignaturePageChange = useCallback(async (nextPage: number) => {
    if (!signableApproval) return;
    const clamped = Math.max(1, Math.min(pdfPageCount, nextPage));
    if (clamped === signaturePosition.pageNumber) return;

    try {
      const pageInfo = await smartcaApi.getPdfPageInfo(signableApproval.fileItemId, clamped);
      const newSize: PdfPageSize = { width: pageInfo.width, height: pageInfo.height };
      setPdfPageSize(newSize);
      setSignaturePreviewUrl(pageInfo.previewUrl ?? null);
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

  const handleSetCurrentVersion = useCallback(async () => {
    if (!fileId || !viewingVersionId) return;

    setSettingCurrent(true);
    try {
      const { data } = await fileItemApi.restoreVersion(fileId, viewingVersionId);
      setConfirmSetCurrent(false);
      openVersion(null);
      showToast(
        t('documents.versions.restoreSuccess').replace('{version}', data.result?.displayVersion ?? ''),
      );
    } catch (err) {
      showToast(getApiErrorMessage(err, t('common.error')), 'error');
    } finally {
      setSettingCurrent(false);
    }
  }, [fileId, viewingVersionId, openVersion, showToast]);

  const refreshFileApprovals = useCallback(async () => {
    if (!fileId) return;
    const items = await approvalApi.getApprovals();
    setFileApprovals(items.filter((item) => item.fileItemId === fileId));
  }, [fileId]);

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

  const placementActive = requiresSignature && signaturePlacementMode;

  return (
    // Nền + padding + max-width do AdminLayout lo; h-full để không cuộn trang
    <div className="flex h-full flex-col">
      {/* Chặn tương tác trong lúc đổi sang file khác: màn vẫn đang bày dữ liệu file CŨ, để bấm được
          thì ghi chú / ký số / phê duyệt sẽ chạy nhầm trên file cũ. z cao hơn mọi modal (60). */}
      {switchingFile && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/25 backdrop-blur-[2px]"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-card px-8 py-6 shadow-modal">
            <Spinner />
            <p className="text-sm font-medium text-text">{t('fileView.switching')}</p>
          </div>
        </div>
      )}

      {/* gap-4 + aside 400px: giữ đồng nhất với trang chi tiết issue */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 xl:flex-row">
        <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
          <header className="flex shrink-0 flex-col gap-3 rounded-[var(--radius-card)] border border-card-border/70 bg-card/80 px-4 py-3 shadow-card backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <FileTypeIcon fileName={fileTitle} format={format} size="sm" />
              <div className="min-w-0">
                <h1 className="heading-panel break-words">{fileTitle}</h1>
                <p className="mt-0.5 text-xs text-text-muted">
                  {format} {latestVersion ? `- ${latestVersion.displayVersion}` : ''}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusMeta.className}`}>
                {statusMeta.label}
              </span>
              <ToolbarIconButton
                size="sm"
                variant="solid"
                label={t('fileView.download.button')}
                onClick={handleDownload}
                disabled={!info}
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                }
              />
            </div>
          </header>

          {isVersionView && (
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-accent-amber/30 bg-accent-amber-tint px-4 py-2.5">
              <p className="text-xs font-semibold text-accent-amber-strong">
                {t('fileView.versionView.banner').replace('{version}', latestVersion?.displayVersion ?? '')}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openVersion(null)}
                  className="whitespace-nowrap rounded-[var(--radius-button)] border border-accent-amber-strong px-3 py-1.5 text-xs font-semibold text-accent-amber-strong transition-colors hover:bg-accent-amber-soft"
                >
                  {t('fileView.versionView.backToCurrent')}
                </button>
                {canRestoreVersion && (
                  <button
                    type="button"
                    onClick={() => setConfirmSetCurrent(true)}
                    className="whitespace-nowrap rounded-[var(--radius-button)] bg-accent-amber-strong px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    {t('fileView.versionView.setCurrent')}
                  </button>
                )}
              </div>
            </div>
          )}

          <section className="relative min-h-[420px] flex-1 overflow-hidden rounded-[var(--radius-card)] border border-card-border bg-card shadow-card xl:min-h-0">
            <div className="absolute inset-0 bg-viewer-canvas" />

            {loading ? (
              // Đang chuyển file thì overlay chặn ở trên đã báo rồi -> khỏi spinner thứ hai lấp ló dưới lớp mờ.
              switchingFile ? null : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Spinner />
                  <p className="text-sm text-text-muted">{t('common.loading')}</p>
                </div>
              )
            ) : error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                <p className="text-sm font-medium text-danger">{error}</p>
              </div>
            ) : isModelReady ? (
              <div className="absolute inset-0 bg-card">
                <ModelViewer
                  urn={info!.urn!}
                  className="h-full w-full"
                />
              </div>
            ) : isModelProcessing ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                <Spinner />
                <h3 className="heading-card text-text">{t('fileView.model.processing.title')}</h3>
                <p className="max-w-md text-sm text-text-muted">{t('fileView.model.processing.desc')}</p>
                {info?.viewerProgress ? (
                  <p className="text-sm font-medium text-primary">{info.viewerProgress}</p>
                ) : null}
              </div>
            ) : isModelFailed ? (
              <div className="absolute inset-0 flex items-center justify-center px-6">
                <EmptyViewerState
                  danger
                  fileName={fileTitle}
                  format={format}
                  title={t('fileView.model.failed.title')}
                  desc={t('fileView.model.failed.desc')}
                  detail={isAccountAdmin(currentUser?.role) ? info?.viewerError : null}
                  primaryLabel={
                    isVersionView
                      ? t('fileView.download.button')
                      : retrying ? t('fileView.model.retrying') : t('fileView.model.failed.retry')
                  }
                  onPrimary={isVersionView ? handleDownload : handleRetranslate}
                  secondaryLabel={isVersionView ? undefined : t('fileView.download.button')}
                  onSecondary={isVersionView ? undefined : handleDownload}
                  disabled={retrying}
                />
              </div>
            ) : info && info.kind === 'inline' && info.url ? (
              <div className="absolute inset-0 p-5">
                <div className="h-full overflow-hidden rounded-[var(--radius-card)] bg-white shadow-sm">
                  <InlineFileView url={info.url} contentType={info.contentType} fileName={info.fileName} />
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center px-6">
                <EmptyViewerState
                  fileName={fileTitle}
                  format={format}
                  title={t('fileView.download.title')}
                  desc={t('fileView.download.desc')}
                  primaryLabel={t('fileView.download.button')}
                  onPrimary={handleDownload}
                />
              </div>
            )}

            {placementActive && (
              <SignaturePlacementOverlay
                fileName={fileTitle}
                pdfUrl={signaturePreviewUrl ?? info?.url ?? null}
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


          </section>
        </main>

        {/* Panel cao bằng khung xem file, nội dung cuộn bên trong */}
        <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-card-border bg-card shadow-card xl:w-[400px]">
          <div className="flex shrink-0 items-stretch border-b border-card-border px-1">
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
            <PanelTabButton
              active={activePanelTab === 'issues'}
              label={t('issues.panel.tab')}
              onClick={() => setActivePanelTab('issues')}
            />
            <PanelTabButton
              active={activePanelTab === 'related'}
              label={t('relatedFiles.tab')}
              onClick={() => setActivePanelTab('related')}
            />
            {showLoiTab && (
              <PanelTabButton
                active={activePanelTab === 'loi'}
                label={t('loi.tab')}
                onClick={() => setActivePanelTab('loi')}
              />
            )}
          </div>

          <div className="admin-scrollbar min-h-0 flex-1 overflow-y-auto p-6">
            {activePanelTab === 'properties' ? (
              <>
                {info?.warnning === true && (
                  <AiCheckerWarningCard message={info.warnningMessage || t('fileWarn.tooltip')} />
                )}
                {info?.description && (
                  <AiSummaryCard summary={info.description} />
                )}
                {info != null && info.warnning == null && !info.description && (
                  <AiSummaryPendingCard />
                )}
                <FilePropertiesPanel
                  info={info}
                  fileListItem={fileListItem}
                  latestVersion={currentVersion}
                  format={format}
                  fileSize={fileSize}
                  uploadedBy={uploadedBy}
                  uploadedAt={uploadedAt}
                  statusMeta={statusMeta}
                  versions={versions}
                  viewingVersionId={viewingVersionId}
                  canManageVersions={canManageVersions}
                  onOpenVersion={openVersion}
                  onManageVersions={() => setVersionsOpen(true)}
                />
                {fileId && <FileActivitySection fileItemId={fileId} />}
              </>
            ) : activePanelTab === 'issues' ? (
              projectId && fileId ? (
                <IssuesPanel
                  projectId={projectId}
                  fileItemId={fileId}
                  area={info?.area}
                  folderId={fileListItem?.folderId ?? folderId}
                  readOnly={isVersionView}
                  onToast={showToast}
                />
              ) : null
            ) : activePanelTab === 'related' ? (
              projectId && fileId ? (
                <RelatedFilesPanel
                  projectId={projectId}
                  fileItemId={fileId}
                  // ?folder= có thể vắng (vào thẳng bằng link) -> lấy folder thật của file làm mốc phạm vi.
                  folderId={fileListItem?.folderId ?? folderId}
                  readOnly={isVersionView}
                />
              ) : null
            ) : activePanelTab === 'loi' ? (
              <LoiCheckPanel fileItemId={fileId ?? ''} projectId={projectId} readOnly={isVersionView} />
            ) : (
              <SignatureHistoryPanel
                requiresSignature={requiresSignature}
                canSign={canSignCurrentApproval && !isVersionView}
                isSignerForCurrentApproval={isSignerForCurrentApproval}
                signatureApprovals={signatureApprovals}
                placementActive={placementActive}
                placementConfirmed={signaturePlacementConfirmed}
                onStartPlacement={openSignaturePlacement}
              />
            )}
          </div>
        </aside>
      </div>

      <Toast toast={toast} className="z-[80]" />

      {versionsOpen && fileId && (
        <FileVersionsModal
          fileItemId={fileId}
          fileName={fileTitle}
          currentVersionId={currentVersion?.id ?? null}
          canRestore={canRestoreVersion}
          onViewVersion={(versionStateId, isCurrent) => {
            setVersionsOpen(false);
            openVersion(isCurrent ? null : versionStateId);
          }}
          onClose={() => setVersionsOpen(false)}
          onRestored={(displayVersion) => {
            void fileItemApi.getVersions(fileId)
              .then((res) => setVersions(sortByNewest(res.data.result ?? [], (v) => v.createdAt)))
              .catch(() => undefined);
            void fetchView().then(setInfo).catch(() => undefined);
            showToast(t('documents.versions.restoreSuccess').replace('{version}', displayVersion));
          }}
        />
      )}

      {confirmSetCurrent && (
        <ConfirmDialog
          title={t('fileView.versionView.setCurrent')}
          message={t('fileView.versionView.setCurrentConfirm').replace('{version}', latestVersion?.displayVersion ?? '')}
          confirmLabel={t('fileView.versionView.setCurrent')}
          tone="primary"
          busy={settingCurrent}
          onConfirm={() => void handleSetCurrentVersion()}
          onCancel={() => setConfirmSetCurrent(false)}
        />
      )}

      {signFor && (
        <SmartCaSignModal
          approval={signFor}
          currentAccountId={currentUser?.accountId}
          onClose={() => setSignFor(null)}
          onToast={showToast}
          onSigned={() => {
            void refreshFileApprovals();
            void fetchView().then(setInfo).catch(() => undefined);
            if (fileId) {
              void fileItemApi.getVersions(fileId).then((res) => setVersions(sortByNewest(res.data.result ?? [], (v) => v.createdAt))).catch(() => undefined);
            }
          }}
        />
      )}
    </div>
  );
}

/* Tóm tắt nội dung file do AI sinh sau khi upload — hỗ trợ đọc nhanh, chỉ mang tính tham khảo. */
function AiSummaryCard({ summary }: { summary: string }) {
  return (
    <div className="mb-4 rounded-xl border border-primary/25 bg-primary-ghost p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="13" y2="17" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-bold text-primary">{t('fileSummary.title')}</p>
          <p className="text-xs text-text-muted">{t('fileSummary.sender')}</p>
        </div>
      </div>
      <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-text">{summary}</p>
    </div>
  );
}

/* Trạng thái thứ ba của phân tích AI: chưa đọc được nội dung. Tách khỏi AiSummaryCard vì
   "không có tóm tắt" và "tóm tắt nói nội dung ổn" là hai kết luận khác hẳn nhau. */
function AiSummaryPendingCard() {
  return (
    <div className="mb-4 rounded-xl border border-card-border bg-surface-sand-light p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-text-muted/15 text-text-muted">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-bold text-text">{t('fileSummary.pendingTitle')}</p>
          <p className="text-xs text-text-muted">{t('fileSummary.sender')}</p>
        </div>
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-text-muted">{t('fileSummary.pendingBody')}</p>
    </div>
  );
}

function AiCheckerWarningCard({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-xl border border-danger/30 bg-danger-light p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-danger/15 text-danger">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-bold text-danger">{t('fileWarn.title')}</p>
          <p className="text-xs text-text-muted">{t('fileWarn.sender')}</p>
        </div>
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-text">{message}</p>
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
      className={`relative flex h-14 min-w-0 flex-auto items-center justify-center gap-1.5 px-2 text-xs font-bold uppercase transition-colors ${active ? 'text-primary' : 'text-text-muted hover:bg-content-bg hover:text-text'
        }`}
    >
      <span className="truncate leading-6">{label}</span>
      {badge ? (
        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-2xs font-bold ${active ? 'bg-primary text-white' : 'bg-danger text-white'}`}>
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

function itemStatusMeta(status: FileItemStatus | undefined, hasOpenIssue?: boolean): { label: string; className: string } {
  // File dang co issue mo thi thay the han trang thai duyet (uu tien cao nhat), giong FileList.tsx.
  if (hasOpenIssue) {
    return { label: t('documents.status.openIssue'), className: 'bg-danger-light text-danger' };
  }

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
  viewingVersionId,
  canManageVersions,
  onOpenVersion,
  onManageVersions,
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
  viewingVersionId: string | null;
  canManageVersions: boolean;
  onOpenVersion: (versionId: string | null) => void;
  onManageVersions: () => void;
}) {
  const name = info?.fileName ?? fileListItem?.name ?? '-';
  const currentVersionLabel = latestVersion?.displayVersion
    ?? (fileListItem?.currentVersionNumber ? `V${fileListItem.currentVersionNumber}` : '');
  const updatedAt = formatDateTime(fileListItem?.updatedAt);
  const requiresSignature = Boolean(info?.requiresSignature || fileListItem?.requiresSignature);
  const isSigned = Boolean(info?.isSigned || fileListItem?.isSigned);
  const status = itemStatusMeta(fileListItem?.status, fileListItem?.hasOpenIssue);
  const yesNo = (v: boolean) => (v ? t('fileView.info.yes') : t('fileView.info.no'));
  const visibleVersions = versions.slice(0, VERSION_PREVIEW_COUNT);
  const hiddenVersionCount = versions.length - visibleVersions.length;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="heading-card text-text">{t('fileView.details.title')}</h2>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>{statusMeta.label}</span>
      </div>

      {/* Tóm tắt AI + cảnh báo AI được hiển thị ở đầu tab (AiSummaryCard/AiCheckerWarningCard) — trước là ở tab Markup nay đã bỏ. */}

      <div className="mt-6 space-y-5">
        <DetailItem label={t('fileView.info.name')} value={<span className="break-all">{name}</span>} />
        <DetailItem label={t('fileView.info.type')} value={fileTypeLabel(fileListItem?.fileType)} />
        <DetailItem label={t('fileView.details.format')} value={format} />
        <DetailItem label={t('fileView.details.size')} value={fileSize} />
        <DetailItem
          label={t('fileView.info.status')}
          value={<span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}>{status.label}</span>}
        />
        <DetailItem label={t('fileView.info.currentVersion')} value={currentVersionLabel || '-'} />
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
      </div>

      <div className="mt-6 border-t border-card-border/70 pt-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="heading-label">{t('fileView.details.history')}</h3>
          {canManageVersions && (
            <ActionIconButton
              tone="primary"
              label={t('documents.fileMenu.versions')}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              }
              onClick={onManageVersions}
            />
          )}
        </div>

        <div className="mt-4 space-y-2">
          {visibleVersions.map((version) => {
            const active = version.id === viewingVersionId
              || (!viewingVersionId && version.isCurrent);
            return (
              <button
                key={version.id}
                type="button"
                onClick={() => onOpenVersion(version.isCurrent ? null : version.id)}
                className={`flex w-full gap-3 rounded-[var(--radius-input)] px-2 py-2 text-left transition-colors ${
                  active ? 'bg-primary-ghost' : 'hover:bg-content-bg'
                }`}
              >
                <span className={`mt-0.5 w-1 shrink-0 rounded-full ${version.isCurrent ? 'bg-primary' : 'bg-card-border'}`} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text">
                    {version.displayVersion} - {version.format.toUpperCase()}
                    {version.isCurrent && (
                      <span className="rounded-[var(--radius-badge)] bg-success-light px-2 py-0.5 text-2xs font-semibold normal-case tracking-normal text-success">
                        {t('documents.versions.current')}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {formatDateTime(version.uploadedAt ?? version.createdAt)}
                    {version.uploadedByName ? ` · ${version.uploadedByName}` : ''}
                  </p>
                </div>
              </button>
            );
          })}

          {hiddenVersionCount > 0 && (
            <button
              type="button"
              onClick={onManageVersions}
              className="px-2 text-xs font-semibold text-primary transition-colors hover:text-primary-hover"
            >
              {t('fileView.details.showAllVersions').replace('{count}', String(hiddenVersionCount))}
            </button>
          )}

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
  isSignerForCurrentApproval,
  signatureApprovals,
  placementActive,
  placementConfirmed,
  onStartPlacement,
}: {
  requiresSignature: boolean;
  canSign: boolean;
  isSignerForCurrentApproval: boolean;
  signatureApprovals: ApprovalListItem[];
  placementActive: boolean;
  placementConfirmed: boolean;
  onStartPlacement: () => void;
}) {
  return (
    <div>
      <h2 className="heading-card text-text">{t('fileView.signatureHistory.title')}</h2>
      <p className="mt-1 text-sm text-text-muted">{t('fileView.signatureHistory.desc')}</p>

      {requiresSignature && canSign && (
        <button
          type="button"
          onClick={onStartPlacement}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-accent-amber px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-accent-amber-strong"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          {placementActive ? t('fileView.signatureHistory.signing') : t('fileView.signatureHistory.signNow')}
        </button>
      )}

      {requiresSignature && !canSign && !isSignerForCurrentApproval && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-card-border bg-content-bg/60 px-3.5 py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-text-muted">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p className="text-xs font-medium text-text-secondary">{t('fileView.signatureHistory.leaderOnly')}</p>
        </div>
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
  const signerNames = approval.signers
    .map((s) => s.signerAccountName ?? s.signerGroupName)
    .filter((name): name is string => Boolean(name))
    .join(', ');
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
      <div className="flex-1 rounded-[var(--radius-card)] border border-card-border bg-white/80 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <h3 className="heading-label">{title}</h3>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-2xs font-bold uppercase tracking-wide ${toneClass}`}>
            {approvalStatusLabel(approval.status)}
          </span>
        </div>
        <p className="mt-2 text-xs font-medium text-text-secondary">{body}</p>
        <div className="mt-3 space-y-1 border-t border-card-border/60 pt-3 text-xs text-text-muted">
          {!isSigned && signerNames && (
            <p className="font-semibold text-text">{t('approvals.detail.signerNames')}: {signerNames}</p>
          )}
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
  // Bản PDF nền để đặt chữ ký có thể là previewUrl (link tuyệt đối) hoặc info.url (view-content tương
  // đối) — cả hai đều đi qua hook: link tuyệt đối dùng thẳng, view-content fetch KÈM token -> Object URL.
  const { src: resolvedPdfUrl, status: pdfStatus } = useInlineFileContent(pdfUrl, 'application/pdf');
  const pageRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
  } | null>(null);

  // Cac con cua trang (iframe, header, khung ky) deu la position:absolute -> div trang khong co kich
  // thuoc noi tai de tu tinh theo aspect-ratio/max-w/max-h thuan CSS -> phai tu do khong gian kha dung
  // va tinh kich thuoc vua khit (giu dung ty le trang) bang JS cho chac chan.
  const [fittedSize, setFittedSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const recompute = () => {
      const availableWidth = container.clientWidth;
      const availableHeight = container.clientHeight;
      if (availableWidth <= 0 || availableHeight <= 0) return;

      const ratio = pageSize.width / pageSize.height;
      let width = availableWidth;
      let height = width / ratio;
      if (height > availableHeight) {
        height = availableHeight;
        width = height * ratio;
      }
      setFittedSize({ width, height });
    };

    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(container);
    return () => observer.disconnect();
  }, [pageSize]);

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
    <div className="absolute inset-0 z-20 overflow-hidden bg-viewer-canvas/95">
      <div className="absolute left-6 right-6 top-5 z-20 flex flex-wrap items-center gap-4 rounded-[var(--radius-card)] border border-white/60 bg-card/80 px-5 py-3 shadow-dropdown backdrop-blur">
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{t('smartca.placement.toolbarLabel')}</span>
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
          className="ml-auto rounded-[var(--radius-button)] border border-card-border px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-content-bg"
        >
          {t('smartca.signModal.cancel')}
        </button>
      </div>

      <div ref={containerRef} className="absolute inset-0 flex items-center justify-center px-8 pb-8 pt-24">
        <div
          ref={pageRef}
          style={
            fittedSize
              ? { width: fittedSize.width, height: fittedSize.height }
              : { aspectRatio: `${pageSize.width} / ${pageSize.height}` }
          }
          className="relative max-h-full max-w-full bg-white shadow-card"
        >
          <div className="absolute left-7 right-7 top-5 z-10 flex items-center justify-between rounded-xl border border-white/70 bg-page-cream/90 px-5 py-3 shadow-sm backdrop-blur">
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-primary">{fileName}</p>
              <p className="text-xs text-text-muted">{t('smartca.placement.previewDocument')}</p>
            </div>
            <span className="rounded-full bg-success-light px-3 py-1 text-xs font-semibold text-success">
              {confirmed ? t('smartca.placement.confirmed') : t('smartca.placement.pending')}
            </span>
          </div>

          {resolvedPdfUrl ? (
            <iframe
              key={value.pageNumber}
              src={`${resolvedPdfUrl}#toolbar=0&navpanes=0&page=${value.pageNumber}&view=FitH`}
              title={fileName}
              className="absolute inset-0 h-full w-full border-0 bg-white"
            />
          ) : (
            <div className="absolute inset-10 flex items-center justify-center rounded-[var(--radius-card)] border border-card-border bg-page-cream-alt text-sm font-semibold text-text-muted">
              {pdfStatus === 'loading' ? t('common.loading') : t('smartca.placement.noPreview')}
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

      <div className="absolute bottom-6 right-6 z-30 w-[220px] rounded-[var(--radius-card)] border border-white bg-white/75 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.12)] backdrop-blur">
        <h3 className="heading-label">{t('smartca.placement.confirmTitle')}</h3>
        <p className="mt-1.5 text-xs font-medium leading-4 tracking-wide text-text-secondary">{t('smartca.placement.confirmDesc')}</p>
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={() => onConfirm(value)}
            disabled={busy}
            className="w-full rounded-[var(--radius-button)] bg-primary px-3 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? t('common.loading') : confirmed ? t('smartca.placement.confirmed') : t('smartca.placement.confirmPosition')}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="w-full rounded-[var(--radius-button)] border border-card-border px-3 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-content-bg"
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
      className="rounded-[var(--radius-button)] px-3 py-1.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg hover:text-text"
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
      <div className="flex-1 rounded-[var(--radius-card)] border border-card-border bg-white/80 p-4 shadow-sm">
        <h3 className="heading-label">{title}</h3>
        <p className="mt-2 text-xs font-medium text-text-secondary">{body}</p>
      </div>
    </div>
  );
}
