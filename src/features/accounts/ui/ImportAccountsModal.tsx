import { useRef, useState } from 'react';

import type { AccountImportResult } from '@/entities/account';
import type { ToastType } from '@/shared/components';
import { t } from '@/shared/lib/i18n';
import { apiErrorMessage, blobApiErrorMessage } from '../model/accountError';
import { useImportAccounts } from '../model/useImportAccounts';

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPT = '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

interface Props {
  onClose: () => void;
  /** Gọi sau khi nhập xong (có tạo mới) để làm mới danh sách tài khoản. */
  onImported: () => void;
  showToast: (msg: string, type?: ToastType) => void;
}

const formatBytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

export function ImportAccountsModal({ onClose, onImported, showToast }: Props) {
  const { downloadingTemplate, importing, downloadTemplate, importFile } = useImportAccounts();

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<AccountImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Chọn / validate file ─────────────────────────── */
  const validate = (picked: File): string | null => {
    if (!picked.name.toLowerCase().endsWith('.xlsx')) return t('account.import.errorExtension');
    if (picked.size > MAX_BYTES) return t('account.import.errorSize');
    return null;
  };

  const pickFile = (picked: File | undefined) => {
    if (!picked) return;
    const error = validate(picked);
    setFileError(error);
    setResult(null);
    setFile(error ? null : picked);
  };

  const clearFile = () => {
    setFile(null);
    setFileError(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  /* ── Tải template ─────────────────────────────────── */
  const handleDownloadTemplate = async () => {
    try {
      await downloadTemplate();
    } catch (err) {
      showToast(await blobApiErrorMessage(err), 'error');
    }
  };

  /* ── Gửi file lên server ──────────────────────────── */
  const handleImport = async () => {
    if (!file) return;
    try {
      const res = await importFile(file);
      setResult(res);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      if (res.createdCount > 0) {
        onImported();
        showToast(
          t('account.import.toastSuccess')
            .replace('{created}', String(res.createdCount))
            .replace('{total}', String(res.totalRows)),
          'success',
        );
      }
    } catch (err) {
      // Lỗi phong bì (400/401/403): hiển thị message, GIỮ nguyên file để admin sửa & thử lại.
      setResult(null);
      showToast(apiErrorMessage(err), 'error');
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Bước 1: Tải template ─────────────────────── */}
      <div className="rounded-[var(--radius-card)] border border-card-border bg-content-bg/60 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-text">{t('account.import.step1Title')}</p>
            <p className="text-xs text-text-muted">{t('account.import.step1Hint')}</p>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            disabled={downloadingTemplate}
            className="flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius-input)] border border-primary/30 bg-primary-ghost px-4 py-2.5 text-sm font-semibold text-primary-deep transition-colors hover:bg-primary-tint disabled:opacity-60"
          >
            {downloadingTemplate ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            )}
            {t('account.import.downloadTemplate')}
          </button>
        </div>
      </div>

      {/* ── Hướng dẫn ────────────────────────────────── */}
      <p className="rounded-[var(--radius-card)] bg-primary-ghost/60 px-4 py-3 text-xs leading-relaxed text-text-secondary">
        {t('account.import.instructions')}
      </p>

      {/* ── Bước 2: Chọn file ────────────────────────── */}
      <div className="space-y-1.5">
        <p className="field-label">{t('account.import.step2Title')}</p>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pickFile(e.dataTransfer.files?.[0]);
          }}
          className={`flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed px-8 py-6 transition-colors ${
            dragging ? 'border-primary bg-primary-ghost' : 'border-card-border bg-input-bg'
          }`}
        >
          {file ? (
            <div className="flex w-full items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-tint text-primary-deep">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text">{file.name}</p>
                <p className="text-xs text-text-muted">{formatBytes(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="shrink-0 text-xs font-semibold text-danger transition-colors hover:underline"
              >
                {t('account.import.removeFile')}
              </button>
            </div>
          ) : (
            <>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-card">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 14.9A5 5 0 0 1 7 6a6 6 0 0 1 11.3 1.8A4 4 0 0 1 18 15.7" />
                  <polyline points="8 14 12 10 16 14" />
                  <line x1="12" y1="10" x2="12" y2="21" />
                </svg>
              </span>
              <p className="text-center text-sm text-text">
                {t('account.import.dropHint')}{' '}
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="font-semibold text-primary underline transition-colors hover:text-primary-hover"
                >
                  {t('account.import.browse')}
                </button>
              </p>
              <p className="text-xs text-text-muted">{t('account.import.constraints')}</p>
            </>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              pickFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>
        {fileError && <p className="text-xs font-medium text-danger">{fileError}</p>}
      </div>

      {/* ── Kết quả nhập ─────────────────────────────── */}
      {result && <ImportResultPanel result={result} />}

      {/* ── Actions ──────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 border-t border-card-border pt-5">
        <button type="button" onClick={onClose} className="btn-modal-ghost">
          {result ? t('account.import.close') : t('account.cancel')}
        </button>
        <button
          type="button"
          onClick={handleImport}
          disabled={!file || importing}
          className="btn-modal-primary"
        >
          {importing ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t('account.import.importing')}
            </span>
          ) : (
            t('account.import.submit')
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Bảng kết quả ───────────────────────────────────── */
function ImportResultPanel({ result }: { result: AccountImportResult }) {
  const [showCreated, setShowCreated] = useState(false);
  const hasErrors = result.errors.length > 0;

  return (
    <div className="space-y-4 rounded-[var(--radius-card)] border border-card-border bg-card p-4">
      {/* Tóm tắt */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-badge)] bg-primary-tint px-3 py-1 font-semibold text-primary-deep">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {t('account.import.summaryCreated')
            .replace('{created}', String(result.createdCount))
            .replace('{total}', String(result.totalRows))}
        </span>
        {result.skippedCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-badge)] bg-accent-amber-tint px-3 py-1 font-semibold text-accent-amber">
            {t('account.import.summarySkipped').replace('{skipped}', String(result.skippedCount))}
          </span>
        )}
      </div>

      {/* Bảng dòng lỗi — trọng tâm: admin biết dòng nào lỗi & vì sao */}
      {hasErrors && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-text">
            {t('account.import.errorsTitle').replace('{count}', String(result.errors.length))}
          </p>
          <div className="admin-scrollbar max-h-64 overflow-auto rounded-[var(--radius-card)] border border-card-border">
            <table className="table-list min-w-[420px]">
              <colgroup>
                <col className="w-[80px]" />
                <col className="w-[38%]" />
                <col />
              </colgroup>
              <thead className="sticky top-0 z-10">
                <tr className="table-head bg-content-bg">
                  <th className="px-4 py-2.5 text-left">{t('account.import.colRow')}</th>
                  <th className="px-4 py-2.5 text-left">{t('account.import.colEmail')}</th>
                  <th className="px-4 py-2.5 text-left">{t('account.import.colReason')}</th>
                </tr>
              </thead>
              <tbody>
                {result.errors.map((row, i) => (
                  <tr key={`${row.rowNumber}-${i}`} className="border-t border-card-border/60">
                    <td className="px-4 py-2.5 align-top font-medium text-text-secondary">{row.rowNumber}</td>
                    <td className="cell-wrap px-4 py-2.5 align-top text-text">{row.email || '—'}</td>
                    <td className="cell-wrap px-4 py-2.5 align-top text-danger">{row.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Danh sách tài khoản đã tạo (thu gọn) */}
      {result.created.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowCreated((v) => !v)}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
          >
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
              strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform ${showCreated ? 'rotate-90' : ''}`}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            {t('account.import.createdTitle').replace('{count}', String(result.created.length))}
          </button>
          {showCreated && (
            <div className="admin-scrollbar max-h-56 overflow-auto rounded-[var(--radius-card)] border border-card-border">
              <table className="table-list min-w-[420px]">
                <colgroup>
                  <col className="w-[80px]" />
                  <col />
                  <col className="w-[44%]" />
                </colgroup>
                <thead className="sticky top-0 z-10">
                  <tr className="table-head bg-content-bg">
                    <th className="px-4 py-2.5 text-left">{t('account.import.colRow')}</th>
                    <th className="px-4 py-2.5 text-left">{t('account.fullName')}</th>
                    <th className="px-4 py-2.5 text-left">{t('account.import.colEmail')}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.created.map((row, i) => (
                    <tr key={`${row.rowNumber}-${i}`} className="border-t border-card-border/60">
                      <td className="px-4 py-2.5 align-top font-medium text-text-secondary">{row.rowNumber}</td>
                      <td className="cell-wrap px-4 py-2.5 align-top text-text">{row.userName}</td>
                      <td className="cell-wrap px-4 py-2.5 align-top text-text-secondary">{row.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
