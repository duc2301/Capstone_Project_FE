import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { ApprovalListItem, ApprovalSigner } from '@/entities/approval';
import { isTeamPermissionError } from '@/entities/approval';
import type { Certificate, SignatureInfo, SignatureTransactionStatus, SignedFileInfo, TransactionStatusInfo } from '@/entities/smartca';
import { smartcaApi, smartcaErrorMessage } from '@/entities/smartca';
import { t } from '@/shared/lib/i18n';

import { formatDateTime } from '../model/approvalFormat';
import { useApprovalRealtime } from '../model/useApprovalRealtime';

interface SmartCaSignModalProps {
  approval: ApprovalListItem;
  /* Dùng để xác định người dùng hiện tại đã tự ký xong phần của mình chưa (khi hồ sơ cần nhiều
   * người ký) — nếu đã ký rồi thì không cho tạo yêu cầu ký lại, chỉ hiện trạng thái chờ người khác. */
  currentAccountId?: string;
  onClose: () => void;
  onSigned: () => void;
  onToast: (message: string, type?: 'success' | 'error') => void;
}

function statusLabel(status: SignatureTransactionStatus): string {
  switch (status) {
    case 'Created':
      return t('smartca.status.created');
    case 'WaitingConfirm':
      return t('smartca.status.waitingConfirm');
    case 'Signed':
      return t('smartca.status.signed');
    case 'Expired':
      return t('smartca.status.expired');
    case 'Failed':
    default:
      return t('smartca.status.failed');
  }
}

function statusClassName(status: SignatureTransactionStatus): string {
  if (status === 'Signed') return 'bg-success-light text-success';
  if (status === 'Failed' || status === 'Expired') return 'bg-danger-light text-danger';
  return 'bg-warning-light text-warning';
}

function isSignedFileGeneratedMessage(message?: string | null): boolean {
  const normalized = message?.trim().toLowerCase() ?? '';
  return normalized.startsWith('signed file generated')
    || normalized.startsWith('signed pdf generated');
}

// BE tra loi nay khi nguoi dung hien tai da ky xong nhung ho so can nhieu nguoi ky (explicit signer)
// va nhung nguoi con lai chua ky - day khong phai loi that, chi la trang thai dang cho, can hien thi
// khac voi 1 loi thuc su (vd sai PIN, mat ket noi VNPT...).
function isWaitingForOtherSignersMessage(message?: string | null): boolean {
  const normalized = message?.trim().toLowerCase() ?? '';
  return normalized.includes('all required digital signers must sign');
}

export function SmartCaSignModal({ approval: initialApproval, currentAccountId, onClose, onSigned, onToast }: SmartCaSignModalProps) {
  const navigate = useNavigate();
  // Bản sao "sống" của approval — vá lại qua realtime (SignalR) khi người ký khác vừa ký xong,
  // để "Danh sách người ký" cập nhật ngay mà không cần đóng/mở lại modal.
  const [approval, setApproval] = useState(initialApproval);
  useEffect(() => setApproval(initialApproval), [initialApproval]);
  useApprovalRealtime((updated) => {
    if (updated.id === initialApproval.id) setApproval(updated);
  });

  const [userId, setUserId] = useState('');
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [certificateSerial, setCertificateSerial] = useState('');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<SignatureTransactionStatus | null>(null);
  const [signatureInfo, setSignatureInfo] = useState<SignatureInfo | null>(null);
  const [signedFile, setSignedFile] = useState<SignedFileInfo | null>(null);
  const [signedPdfReady, setSignedPdfReady] = useState(Boolean(approval.signedVersionId));
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [creatingRequest, setCreatingRequest] = useState(false);
  const [generatingSignedPdf, setGeneratingSignedPdf] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorIsPermissionIssue, setErrorIsPermissionIssue] = useState(false);
  const [waitingForOtherSigners, setWaitingForOtherSigners] = useState(false);
  const generatingSignedPdfRef = useRef(false);

  const selectedCertificate = useMemo(
    () => certificates.find((item) => item.serialNumber === certificateSerial) ?? null,
    [certificateSerial, certificates],
  );

  const finalizeSignedTransaction = async (statusInfo?: TransactionStatusInfo) => {
    if (generatingSignedPdfRef.current) return;

    generatingSignedPdfRef.current = true;
    setGeneratingSignedPdf(true);
    setError(null);
    setWaitingForOtherSigners(false);
    try {
      let file: SignedFileInfo | null = null;
      let latestStatusInfo = statusInfo;
      const signedTransactionId = statusInfo?.transactionId ?? transactionId ?? signatureInfo?.transactionId;

      if (
        signedTransactionId
        && (!latestStatusInfo
          || (latestStatusInfo.status === 'Signed' && !isSignedFileGeneratedMessage(latestStatusInfo.message)))
      ) {
        latestStatusInfo = await smartcaApi.getTransactionStatus(approval.id, signedTransactionId);
      }

      if (latestStatusInfo && isSignedFileGeneratedMessage(latestStatusInfo.message)) {
        file = await smartcaApi.getSignedFile(approval.fileItemId).catch(() => null);
      } else {
        file = await smartcaApi.getSignedFile(approval.fileItemId).catch(() => null);
        if (!file) file = await smartcaApi.generateSignedPdf(approval.id);
      }

      setSignedFile(file);
      setSignedPdfReady(true);
      setTransactionStatus('Signed');
      onToast(t('smartca.toast.signed'));
      await fetchSignatureInfo(false);
      onSigned();
    } catch (err) {
      const message = smartcaErrorMessage(err, t('smartca.error.status'));
      if (isWaitingForOtherSignersMessage(message)) {
        // Ban than nguoi dung hien tai da ky xong roi - chi la ho so can nhieu nguoi ky, chua du nguoi.
        // Khong phai loi, hien banner thong tin thay vi banner do.
        setWaitingForOtherSigners(true);
        setTransactionStatus('Signed');
      } else {
        setError(message);
      }
    } finally {
      generatingSignedPdfRef.current = false;
      setGeneratingSignedPdf(false);
    }
  };

  const fetchSignatureInfo = async (autoGenerateSignedPdf = true) => {
    try {
      const info = await smartcaApi.getSignatureInfo(approval.id);
      setSignatureInfo(info);
      setTransactionId(info.transactionId);
      setTransactionStatus(info.status);
      if (info.status === 'Signed') {
        if (approval.signedVersionId) {
          setSignedFile(await smartcaApi.getSignedFile(approval.fileItemId).catch(() => null));
          setSignedPdfReady(true);
          onSigned();
        } else if (autoGenerateSignedPdf) {
          await finalizeSignedTransaction({
            transactionId: info.transactionId,
            status: info.status,
            message: null,
            rawResponse: null,
          });
        }
      }
    } catch {
      setSignatureInfo(null);
    }
  };

  useEffect(() => {
    setSignedPdfReady(Boolean(approval.signedVersionId));
    void fetchSignatureInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approval.id]);

  useEffect(() => {
    if (!transactionId || transactionStatus === 'Signed' || transactionStatus === 'Failed' || transactionStatus === 'Expired') {
      setPolling(false);
      return;
    }

    setPolling(true);
    const timer = window.setInterval(async () => {
      try {
        const data = await smartcaApi.getTransactionStatus(approval.id, transactionId);
        const completed = data.status === 'Signed' || isSignedFileGeneratedMessage(data.message);

        if (completed) {
          window.clearInterval(timer);
          setPolling(false);
          await finalizeSignedTransaction(data);
        } else {
          setTransactionStatus(data.status);
        }

        if (data.status === 'Failed' || data.status === 'Expired') {
          window.clearInterval(timer);
          setPolling(false);
          onToast(t('smartca.toast.signFailed'), 'error');
        }
      } catch (err) {
        window.clearInterval(timer);
        setPolling(false);
        setError(smartcaErrorMessage(err, t('smartca.error.status')));
      }
    }, 5000);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approval.id, transactionId, transactionStatus]);

  const handleGetCertificates = async () => {
    const trimmedUserId = userId.trim();
    if (!trimmedUserId) {
      setError(t('smartca.error.userIdRequired'));
      return;
    }

    setLoadingCertificates(true);
    setError(null);
    try {
      const data = await smartcaApi.getCertificates(approval.id, trimmedUserId);
      setCertificates(data);
      setCertificateSerial(data[0]?.serialNumber ?? '');
      if (data.length === 0) setError(t('smartca.error.noCertificates'));
    } catch (err) {
      setError(smartcaErrorMessage(err, t('smartca.error.certificates')));
    } finally {
      setLoadingCertificates(false);
    }
  };

  const handleCreateSignRequest = async () => {
    const trimmedUserId = userId.trim();
    if (!trimmedUserId) {
      setError(t('smartca.error.userIdRequired'));
      return;
    }
    if (!certificateSerial) {
      setError(t('smartca.error.certificateRequired'));
      return;
    }

    setCreatingRequest(true);
    setError(null);
    setErrorIsPermissionIssue(false);
    try {
      const data = await smartcaApi.createSignRequest(approval.id, trimmedUserId, certificateSerial);
      setTransactionId(data.transactionId);
      setTransactionStatus(data.status);
      onToast(t('smartca.toast.requestCreated'));
    } catch (err) {
      setError(
        isTeamPermissionError(err)
          ? t('smartca.error.notRequiredSigner')
          : smartcaErrorMessage(err, t('smartca.error.signRequest')),
      );
      setErrorIsPermissionIssue(isTeamPermissionError(err));
    } finally {
      setCreatingRequest(false);
    }
  };

  const hasSignedSuccessfully =
    Boolean(signedFile) ||
    signedPdfReady ||
    Boolean(approval.signedVersionId && (transactionStatus === 'Signed' || signatureInfo?.status === 'Signed'));
  // Bản thân người dùng hiện tại đã ký xong phần của mình, nhưng hồ sơ vẫn cần thêm người khác ký ->
  // không cho tạo yêu cầu ký lại, chỉ hiện trạng thái chờ. Gộp 2 nguồn tín hiệu: (1) waitingForOtherSigners
  // — BE xác nhận trực tiếp ngay sau khi ký (đáng tin cậy nhất, không phải chờ realtime); (2) signers
  // list (approval.signers, có thể vá qua realtime) — dùng khi mở lại modal ở phiên sau, sau khi đã ký
  // từ trước, lúc BE không còn trả lại thông báo "vừa ký xong" nữa.
  const myOwnSignerRecord = currentAccountId
    ? approval.signers.find((s) => s.signerAccountId === currentAccountId)
    : undefined;
  const hasAlreadySignedButWaitingForOthers =
    !hasSignedSuccessfully && (waitingForOtherSigners || myOwnSignerRecord?.status === 'Signed');
  const canCreateSignRequest = !!userId.trim() && !!certificateSerial && !creatingRequest && !generatingSignedPdf;

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-[#dcdad2]/60 p-4 backdrop-blur-sm">
      <div className="absolute inset-0 animate-fade-in" onClick={creatingRequest ? undefined : onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-[600px] animate-scale-in flex-col overflow-hidden rounded-3xl border border-card-border bg-card shadow-modal">
        <div className="border-b border-card-border/70 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold text-text">{t('smartca.signModal.title')}</h2>
            <button type="button" onClick={onClose} disabled={creatingRequest} className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-content-bg hover:text-text disabled:opacity-40">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {hasSignedSuccessfully ? (
            <SmartCaSuccessView approval={approval} signatureInfo={signatureInfo} signedFile={signedFile} />
          ) : hasAlreadySignedButWaitingForOthers ? (
            <SmartCaWaitingForOthersView approval={approval} />
          ) : (
            <>
              <section className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted">{t('smartca.signModal.document')}</p>
                <p className="truncate text-base font-medium text-primary">{approval.fileName}</p>
              </section>

              <section className="grid gap-4 sm:grid-cols-2">
                <InfoBlock label={t('smartca.signModal.approvalStep')} value={t('smartca.signModal.defaultApprovalStep')} />
                <InfoBlock label={t('smartca.signModal.signer')} value={approval.approvedByName ?? t('smartca.signModal.currentLeader')} />
              </section>

              <section className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted">{t('smartca.signModal.signMethod')}</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <MethodButton active label={t('smartca.signModal.methodSmartCa')} />
                  <MethodButton disabled label={t('smartca.signModal.methodUsbToken')} />
                  <MethodButton disabled label={t('smartca.signModal.methodHsm')} />
                </div>
              </section>

              <section className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{t('smartca.signModal.userId')}</span>
                  <input
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder={t('smartca.signModal.userIdPlaceholder')}
                    className="h-11 rounded-lg border border-input-border bg-input-bg px-3 text-sm text-text outline-none focus:border-input-focus"
                  />
                </label>
                <button
                  type="button"
                  disabled={loadingCertificates}
                  onClick={handleGetCertificates}
                  className="self-end rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingCertificates ? t('common.loading') : t('smartca.signModal.getCertificates')}
                </button>
              </section>

              <section className="space-y-4">
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{t('smartca.signModal.certificate')}</span>
                  <select
                    value={certificateSerial}
                    onChange={(e) => setCertificateSerial(e.target.value)}
                    disabled={certificates.length === 0}
                    className="h-11 rounded-lg border border-input-border bg-input-bg px-3 text-sm font-semibold text-text outline-none focus:border-input-focus disabled:opacity-60"
                  >
                    <option value="">{t('smartca.signModal.selectCertificate')}</option>
                    {certificates.map((certificate) => (
                      <option key={certificate.serialNumber} value={certificate.serialNumber}>
                        {certificate.subject ? `${certificate.subject} - ${certificate.serialNumber}` : certificate.serialNumber}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedCertificate && (
                  <div className="rounded-xl border border-card-border bg-[#f6f4ec] p-4 text-xs text-text-secondary">
                    <p className="font-semibold text-text">{selectedCertificate.subject ?? selectedCertificate.serialNumber}</p>
                    <p className="mt-1">{t('smartca.signModal.validTo')}: {formatDateTime(selectedCertificate.validTo)}</p>
                    <p className="mt-1">{t('smartca.signModal.certificateStatus')}: {selectedCertificate.status ?? '-'}</p>
                  </div>
                )}
              </section>

              {(transactionId || transactionStatus) && (
                <div className="rounded-xl border border-card-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-text">{t('smartca.signModal.transactionStatus')}</p>
                    {transactionStatus && (
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClassName(transactionStatus)}`}>
                        {statusLabel(transactionStatus)}
                      </span>
                    )}
                  </div>
                  {transactionId && <p className="mt-2 break-all text-xs text-text-muted">{transactionId}</p>}
                  {(polling || generatingSignedPdf) && (
                    <p className="mt-2 text-sm text-warning">
                      {generatingSignedPdf ? t('smartca.signModal.generatingSignedPdf') : t('smartca.signModal.waitingConfirm')}
                    </p>
                  )}
                </div>
              )}

              {approval.currentZone === 'Shared' &&
                approval.targetZone === 'Published' &&
                approval.signers.length > 1 && <SignersListPanel signers={approval.signers} />}

              <SignatureInfoPanel signatureInfo={signatureInfo} />

              {error && (
                <div className="space-y-2 rounded-xl border border-danger/30 bg-danger-light px-4 py-3">
                  <p className="text-sm font-medium text-danger">{error}</p>
                  {errorIsPermissionIssue && approval.projectId && (
                    <button
                      type="button"
                      onClick={() => navigate(`/projects/${approval.projectId}?tab=teams`)}
                      className="rounded-lg bg-danger/10 px-3 py-1.5 text-xs font-bold text-danger transition-colors hover:bg-danger/20"
                    >
                      {t('documents.goToTeamsTab')}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex gap-3 border-t border-card-border bg-[#f6f4ec]/70 p-6">
          {!hasSignedSuccessfully && !hasAlreadySignedButWaitingForOthers && (
            <button
              type="button"
              disabled={!canCreateSignRequest}
              onClick={handleCreateSignRequest}
              className="h-12 flex-1 rounded-xl bg-primary px-5 text-base font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creatingRequest || generatingSignedPdf ? t('common.loading') : t('smartca.signModal.createSignRequest')}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={creatingRequest}
            className={`${hasSignedSuccessfully || hasAlreadySignedButWaitingForOthers ? 'flex-1 bg-primary text-white hover:bg-primary-hover' : 'border border-card-border text-text-secondary hover:bg-content-bg'} h-12 rounded-xl px-6 text-base font-medium transition-colors disabled:opacity-40`}
          >
            {hasSignedSuccessfully || hasAlreadySignedButWaitingForOthers ? t('smartca.success.close') : t('smartca.signModal.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

function SmartCaSuccessView({
  approval,
  signatureInfo,
  signedFile,
}: {
  approval: ApprovalListItem;
  signatureInfo: SignatureInfo | null;
  signedFile: SignedFileInfo | null;
}) {
  const signerName = signatureInfo?.signedBy ?? approval.approvedByName ?? t('smartca.signModal.currentLeader');

  return (
    <section className="flex flex-col items-center text-center">
      <div className="relative mt-3 flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary/20 bg-[#f6f4ec] text-primary">
        <span className="absolute -inset-6 rounded-full bg-primary/10" />
        <svg className="relative z-10" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>

      <h3 className="mt-8 font-display text-2xl font-semibold text-primary">{t('smartca.success.title')}</h3>
      <p className="mt-2 max-w-md text-base text-text-secondary">{t('smartca.success.desc')}</p>

      <div className="mt-8 w-full rounded-2xl border border-card-border bg-[#f6f4ec] p-5 text-left">
        <InfoRow label={t('smartca.success.fileName')} value={approval.fileName} />
        {signedFile && (
          <>
            <div className="my-3 h-px bg-card-border/70" />
            <InfoRow
              label={t('smartca.success.signedFile')}
              value={signedFile.fileName ?? `V${signedFile.versionNumber} - ${signedFile.signedVersionId}`}
            />
          </>
        )}
        <div className="my-3 h-px bg-card-border/70" />
        <InfoRow label={t('smartca.success.signedAt')} value={formatDateTime(signatureInfo?.signedAt)} />
        <div className="my-3 h-px bg-card-border/70" />
        <InfoRow label={t('smartca.success.signedBy')} value={signerName} />
      </div>
    </section>
  );
}

// Bản thân người dùng hiện tại đã ký xong, hồ sơ đang chờ những signer còn lại — không cho tạo yêu
// cầu ký lại, chỉ hiện trạng thái + danh sách người ký (realtime) để theo dõi.
function SmartCaWaitingForOthersView({ approval }: { approval: ApprovalListItem }) {
  return (
    <section className="flex flex-col items-center text-center">
      <div className="relative mt-3 flex h-24 w-24 items-center justify-center rounded-full border-2 border-warning/30 bg-[#f6f4ec] text-warning">
        <span className="absolute -inset-6 rounded-full bg-warning/10" />
        <svg className="relative z-10" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      </div>

      <h3 className="mt-8 font-display text-2xl font-semibold text-warning">{t('smartca.waiting.title')}</h3>
      <p className="mt-2 max-w-md text-base text-text-secondary">{t('smartca.waiting.desc')}</p>

      <div className="mt-8 w-full">
        <SignersListPanel signers={approval.signers} />
      </div>
    </section>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</p>
      <p className="text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

function MethodButton({ label, active = false, disabled = false }: { label: string; active?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`h-10 rounded-lg border px-3 text-sm font-semibold transition-colors ${
        active
          ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
          : 'border-card-border text-text-secondary hover:bg-content-bg'
      } disabled:cursor-not-allowed disabled:opacity-45`}
    >
      {label}
    </button>
  );
}

// Hien danh sach nguoi ky bat buoc + trang thai tung nguoi, chi hien khi approval can nhieu hon 1 nguoi ky.
function SignersListPanel({ signers }: { signers: ApprovalSigner[] }) {
  const signedCount = signers.filter((s) => s.status === 'Signed').length;

  return (
    <div className="rounded-xl border border-card-border bg-content-bg/40 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-text">{t('smartca.signers.title')}</p>
        <span className="text-xs font-semibold text-text-muted">{signedCount}/{signers.length}</span>
      </div>
      <ul className="mt-3 space-y-2">
        {signers.map((signer) => (
          <li key={signer.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-text">
              {signer.signerAccountName ?? signer.signerGroupName ?? '-'}
            </span>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                signer.status === 'Signed' ? 'bg-success-light text-success' : 'bg-warning-light text-warning'
              }`}
            >
              {signer.status === 'Signed' ? t('smartca.signers.signed') : t('smartca.signers.pending')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SignatureInfoPanel({ signatureInfo }: { signatureInfo: SignatureInfo | null }) {
  if (!signatureInfo) {
    return null;
  }

  return (
    <div className="rounded-xl border border-card-border bg-content-bg/40 p-4">
      <p className="text-sm font-semibold text-text">{t('smartca.signature.title')}</p>
      <div className="mt-3 space-y-2 text-sm">
        <InfoRow label={t('smartca.signature.transactionId')} value={signatureInfo.transactionId} />
        <InfoRow label={t('smartca.signature.certificateSerial')} value={signatureInfo.certificateSerial ?? '-'} />
        <InfoRow label={t('smartca.signature.signedBy')} value={signatureInfo.signedBy ?? '-'} />
        <InfoRow label={t('smartca.signature.signedAt')} value={formatDateTime(signatureInfo.signedAt)} />
        <InfoRow label={t('smartca.signature.status')} value={statusLabel(signatureInfo.status)} />
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 md:grid-cols-[160px_1fr]">
      <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</span>
      <span className="break-all text-text-secondary">{value}</span>
    </div>
  );
}
