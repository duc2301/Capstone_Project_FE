import { useCallback, useRef, useState } from 'react';

import type { FileListItem, NameAvailability } from '@/entities/file-item';
import { NameConflictScope, UploadDuplicateAction, fileItemApi } from '@/entities/file-item';
import type { FolderTreeNode } from '@/entities/folder';
import type { FolderNamingConvention, NamingSelection, UploadNamingField } from '@/entities/naming-convention';
import { namingConventionApi } from '@/entities/naming-convention';
import { getApiErrorMessage } from '@/shared/api';
import { FileTypeIcon } from '@/shared/components';
import { useAsyncData } from '@/shared/lib/async';
import { t } from '@/shared/lib/i18n';

import { formatSize } from '../model/fileFormat';
import { useFileUpload } from '../model/useFileUpload';
import { RelatedFilesPicker } from './RelatedFilesPicker';

type Status = 'pending' | 'uploading' | 'done' | 'error';
interface UFile {
  id: string;
  file: File;
  status: Status;
  progress: number;
  // "Tệp liên quan" chọn riêng cho TỪNG file trong lô (không dùng chung cả lô).
  relatedFileItemIds: string[];
  errorMsg?: string;
  // Nhãn phiên bản BE vừa tạo (vd "P03.02"). Trùng tên với tệp đã có thì hệ thống lên phiên bản
  // chứ không tạo tài liệu mới — phải cho người dùng thấy, nếu không họ tưởng vừa thêm tệp mới.
  resultVersion?: string;
  // Tên BE chốt cho tài liệu. Chọn "tài liệu riêng" thì tên này khác tên tệp gốc (vd "Plan (2)").
  resultName?: string;
  // Kết quả hỏi BE "tên này còn trống không" + tên đã hỏi (tên đổi thì phải hỏi lại).
  availability?: NameAvailability;
  availabilityFor?: string;
  // Quyết định của người dùng cho ca trùng tên. undefined = chưa chọn -> chưa được tải lên.
  action?: UploadDuplicateAction;
}

// Nhãn khu vực CDE cho tài liệu đang chiếm tên (khớp Domain.Enum.Cde.CdeArea).
const AREA_LABEL_KEYS = [
  'documents.zone.wipShort',
  'documents.zone.sharedShort',
  'documents.zone.publishedShort',
  'documents.zone.archivedShort',
] as const;

interface UploadModalProps {
  targetFolder: FolderTreeNode;
  // Tệp đã có trong folder đích — dùng để cảnh báo trùng tên TRƯỚC khi tải lên.
  // Rỗng nghĩa là không có dữ liệu để so (mở upload cho folder không phải folder đang chọn),
  // khi đó bỏ qua cảnh báo và để BE làm chốt chặn cuối.
  existingFiles?: FileListItem[];
  onClose: () => void;
  onUploaded: () => void;
}

export function UploadModal({ targetFolder, existingFiles = [], onClose, onUploaded }: UploadModalProps) {
  const { uploadToFolder } = useFileUpload();
  const [items, setItems] = useState<UFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  // Đang hỏi BE xem các tên tệp còn trống không (chạy trước khi gửi bytes).
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [showConflict, setShowConflict] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Quy tắc đặt tên của folder đích (nếu có): render dropdown thay vì đặt tên tự do.
  const [selections, setSelections] = useState<Record<string, string>>({});
  // Field bắt buộc mà autofill từ tên gốc KHÔNG khớp được — viền đỏ bắt chọn tay.
  const [mismatchIds, setMismatchIds] = useState<Set<string>>(new Set());
  // Tệp ngoại lệ (văn bản hành chính: thông tư, nghị định...) — bỏ qua quy tắc, giữ tên gốc.
  const [bypass, setBypass] = useState(false);

  const fetchNaming = useCallback(async () => {
    const { data } = await namingConventionApi.getByFolder(targetFolder.id);
    return data.result;
  }, [targetFolder.id]);

  // Không đọc được quy tắc -> vẫn cho upload, BE là chốt chặn cuối.
  const { data: naming, loading: namingLoading } = useAsyncData<FolderNamingConvention | null>(
    targetFolder.id,
    fetchNaming,
    { fallback: null },
  );

  const hasConvention = !!naming?.hasNamingConvention && !!naming.fields;
  // Quy tắc thực sự áp cho lượt upload này (bật "tệp ngoại lệ" là thoát chế độ quy tắc).
  const namingEnforced = hasConvention && !bypass;
  const sortedFields: UploadNamingField[] = hasConvention
    ? [...naming!.fields!].sort((a, b) => a.orderIndex - b.orderIndex)
    : [];
  const delimiter = naming?.delimiter ?? '-';

  const missingRequired = sortedFields.filter((f) => !f.locked && f.required && !selections[f.id]);

  // Xem trước tên file: mã của các giá trị đã chọn (field khóa dùng giá trị khóa) nối bằng delimiter.
  const previewBase = sortedFields
    .map((f) => {
      if (f.locked) return f.lockedValue?.code ?? null;
      const valueId = selections[f.id];
      if (!valueId) return null;
      return f.values?.find((v) => v.id === valueId)?.code ?? null;
    })
    .filter((code): code is string => !!code)
    .join(delimiter);
  const previewExt = items[0] ? `.${items[0].file.name.split('.').pop() ?? ''}` : '';

  /* Tên logic của tài liệu — BE lưu Name KHÔNG kèm đuôi nên mọi phép so đều bỏ đuôi. */
  const baseNameOf = (it: UFile) =>
    namingEnforced && previewBase ? previewBase : it.file.name.replace(/\.[^.]+$/, '');

  const extOf = (it: UFile) => (it.file.name.split('.').pop() ?? '').toLowerCase();

  const isPending = (it: UFile) => it.status === 'pending' || it.status === 'error';

  /* Gợi ý tức thì từ danh sách tệp của folder đang mở — chỉ để gắn nhãn sớm cho người dùng thấy,
   * còn kết luận thật (kể cả trùng ở khu vực khác) là của BE qua checkNameAvailability. */
  const localConflictOf = (it: UFile): FileListItem | null => {
    if (existingFiles.length === 0) return null;
    const target = baseNameOf(it).trim().toLowerCase();
    if (!target) return null;
    return existingFiles.find((f) => (f.name ?? '').trim().toLowerCase() === target) ?? null;
  };

  // Trùng tên nhưng còn đường ra: lên phiên bản, hoặc tách thành tài liệu riêng.
  const hasOptions = (a: NameAvailability) => a.canCreateVersion || a.canCreateNewDocument;
  const conflictedOf = (it: UFile) =>
    it.availability && !it.availability.isAvailable ? it.availability : null;
  // Hết đường: tài liệu nằm khu vực khác / đã phát hành mà folder lại áp quy tắc đặt tên.
  const isBlocked = (it: UFile) => {
    const c = conflictedOf(it);
    return !!c && !hasOptions(c);
  };
  const needsDecision = (it: UFile) => {
    const c = conflictedOf(it);
    return !!c && hasOptions(c) && it.action === undefined;
  };

  const areaLabel = (area: number | null | undefined) =>
    area != null && AREA_LABEL_KEYS[area] ? t(AREA_LABEL_KEYS[area]) : '';

  /* Hỏi BE tên nào còn trống, TRƯỚC khi gửi bytes: tệp CDE nặng hàng trăm MB, tải xong mới báo
   * trùng là quá muộn. Chỉ hỏi lại khi tên đổi (đổi giá trị quy tắc, bật/tắt tệp ngoại lệ). */
  const ensureAvailability = async (targets: UFile[]): Promise<UFile[]> => {
    const checked = await Promise.all(
      targets.map(async (it) => {
        const name = baseNameOf(it);
        if (it.availability && it.availabilityFor === name) return it;

        const { data } = await fileItemApi.checkNameAvailability(
          targetFolder.id,
          name,
          extOf(it),
          hasConvention && bypass,
        );
        // Tên đổi -> lựa chọn cũ không còn ý nghĩa, bắt chọn lại.
        return { ...it, availability: data.result ?? undefined, availabilityFor: name, action: undefined };
      }),
    );

    setItems((prev) => prev.map((i) => checked.find((c) => c.id === i.id) ?? i));
    return checked;
  };

  /* Autofill từ tên file gốc (tiện cho re-upload file đã đặt tên chuẩn: tải về sửa rồi up lại):
   * tách tên theo delimiter, khớp mã với value của từng field theo thứ tự.
   * - Field khóa: khớp thì tiêu thụ segment, lệch cũng bỏ qua (BE tự chèn giá trị khóa).
   * - Field thường khớp mã -> tự điền; BẮT BUỘC mà không khớp -> đánh dấu đỏ bắt chọn tay.
   * - Field tùy chọn không khớp -> bỏ qua field, giữ segment cho field sau (tên có thể thiếu nó).
   * - Không field nào khớp (tên tự do) -> coi như không phải tên chuẩn, không autofill, không đỏ. */
  const autofillFromName = (fileName: string) => {
    const base = fileName.replace(/\.[^.]+$/, '');
    const segments = base.split(delimiter);
    const next: Record<string, string> = {};
    const bad = new Set<string>();
    let si = 0;
    for (const field of sortedFields) {
      const seg = segments[si];
      if (field.locked) {
        if (seg && field.lockedValue && seg.toUpperCase() === field.lockedValue.code.toUpperCase()) si += 1;
        continue;
      }
      const match = seg ? (field.values ?? []).find((v) => v.code.toUpperCase() === seg.toUpperCase()) : undefined;
      if (match) {
        next[field.id] = match.id;
        si += 1;
      } else if (field.required) {
        bad.add(field.id);
        si += 1;
      }
    }
    if (Object.keys(next).length === 0) {
      setSelections({});
      setMismatchIds(new Set());
      return;
    }
    setSelections(next);
    setMismatchIds(bad);
  };

  const addFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const next: UFile[] = Array.from(list).map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: 'pending',
      progress: 0,
      relatedFileItemIds: [],
    }));
    // Folder có quy tắc đặt tên: 1 bộ giá trị = 1 tên -> mỗi lượt chỉ 1 tệp (tệp mới thay tệp cũ).
    setItems((prev) => (namingEnforced ? [next[next.length - 1]] : [...prev, ...next]));
    if (namingEnforced) autofillFromName(next[next.length - 1].file.name);
  };

  const update = (id: string, patch: Partial<UFile>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const handleUpload = async () => {
    const pending = items.filter(isPending);
    if (pending.length === 0) return;
    if (namingEnforced && missingRequired.length > 0) return;

    setCheckError(null);
    setChecking(true);
    let checked: UFile[];
    try {
      checked = await ensureAvailability(pending);
    } catch (err) {
      setCheckError(getApiErrorMessage(err, t('documents.uploadModal.checkFailed')));
      return;
    } finally {
      setChecking(false);
    }

    // Còn tệp trùng tên chưa có quyết định (hoặc hết đường xử lý) -> hỏi, tuyệt đối không tự tải lên.
    if (checked.some((it) => needsDecision(it) || isBlocked(it))) {
      setShowConflict(true);
      return;
    }

    await runUpload(checked);
  };

  const runUpload = async (targets: UFile[]) => {
    // Field khóa KHÔNG gửi lên — BE tự chèn giá trị khóa.
    const namingSelections: NamingSelection[] = sortedFields
      .filter((f) => !f.locked && selections[f.id])
      .map((f) => ({ fieldId: f.id, valueId: selections[f.id] }));

    // Tệp hết đường xử lý: không gửi lên nữa, ghi thẳng lý do lên dòng của nó để người dùng biết
    // phải làm gì (trả tài liệu về WIP, đổi giá trị quy tắc đặt tên...).
    for (const it of targets.filter(isBlocked))
      update(it.id, {
        status: 'error',
        errorMsg: it.availability?.guidance ?? t('documents.uploadModal.conflictBlocked'),
      });

    const uploadable = targets.filter((it) => !isBlocked(it));
    if (uploadable.length === 0) return;

    setBusy(true);
    let anyOk = false;
    for (const it of uploadable) {
      update(it.id, { status: 'uploading', progress: 0, errorMsg: undefined });
      try {
        const res = await uploadToFolder(
          targetFolder.id,
          it.file,
          (p) => update(it.id, { progress: p }),
          namingEnforced ? namingSelections : undefined,
          hasConvention && bypass,
          it.relatedFileItemIds,
          it.action ?? UploadDuplicateAction.None,
        );
        const result = res.data?.result;
        update(it.id, {
          status: 'done',
          progress: 100,
          resultVersion: result?.version?.displayVersion,
          resultName: result?.fileItem?.name,
        });
        anyOk = true;
      } catch (err) {
        update(it.id, { status: 'error', errorMsg: getApiErrorMessage(err, t('common.error')) });
      }
    }
    setBusy(false);
    if (anyOk) onUploaded();
  };

  const doneCount = items.filter((i) => i.status === 'done').length;
  const hasPending = items.some((i) => i.status === 'pending' || i.status === 'error');
  const blockedByNaming = namingEnforced && missingRequired.length > 0;

  // Câu mô tả tài liệu đang chiếm tên — hai phạm vi trùng là hai câu chuyện khác nhau.
  const conflictText = (c: NameAvailability) => {
    if (c.scope === NameConflictScope.OtherFolder)
      return t('documents.uploadModal.conflictOtherFolder')
        .replace('{name}', c.name)
        .replace('{area}', areaLabel(c.conflictArea))
        .replace('{folder}', c.conflictFolderName ?? '');

    return c.conflictDisplayVersion
      ? t('documents.uploadModal.conflictExisting')
          .replace('{name}', c.name)
          .replace('{version}', c.conflictDisplayVersion)
      : t('documents.uploadModal.conflictExistingNoVersion').replace('{name}', c.name);
  };

  const optionClass = (selected: boolean) =>
    `flex cursor-pointer items-start gap-2.5 rounded-[var(--radius-button)] border px-3 py-2 transition-colors ${
      selected ? 'border-primary bg-primary-ghost' : 'border-card-border hover:bg-content-bg'
    }`;

  const conflictItems = items.filter((it) => isPending(it) && conflictedOf(it));
  // Tệp hết đường xử lý không cần chọn gì — nó sẽ bị loại khỏi lô kèm lý do.
  const conflictResolved = conflictItems.every((it) => it.action !== undefined || isBlocked(it));

  /* "Để tôi xem lại" = HUỶ quyết định, không phải "tạm ẩn". Phải xoá lựa chọn đã tick, nếu không
   * lần bấm Tải lên sau sẽ im lặng dùng lại lựa chọn cũ — đúng cái kiểu tự quyết mà luồng này sinh
   * ra để dẹp bỏ. */
  const dismissConflict = () => {
    setShowConflict(false);
    setItems((prev) => prev.map((i) => (conflictedOf(i) ? { ...i, action: undefined } : i)));
  };

  // Hộp chọn cách xử lý trùng tên: nằm đè lên chính modal tải lên, chặn thao tác cho tới khi chọn xong.
  const conflictDialog = showConflict && conflictItems.length > 0 && (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[var(--radius-card-lg)] bg-black/45 p-4">
      <div className="flex max-h-full w-full max-w-lg flex-col rounded-[var(--radius-card)] border border-card-border bg-card shadow-modal">
        <div className="border-b border-card-border px-5 py-4">
          <h3 className="heading-entity">{t('documents.uploadModal.conflictTitle')}</h3>
          <p className="mt-1 text-xs leading-relaxed text-text-muted">
            {t('documents.uploadModal.conflictIntro')}
          </p>
        </div>

        <div className="space-y-3 overflow-y-auto px-5 py-4">
          {conflictItems.map((it) => {
            const conflict = it.availability!;
            return (
              <div key={it.id} className="rounded-[var(--radius-card)] border border-card-border p-3.5">
                <p className="truncate text-sm font-semibold text-text">{it.file.name}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{conflictText(conflict)}</p>

                {/* Vì sao mất bớt lựa chọn (tài liệu đang phát hành, đang nằm khu vực khác...). */}
                {hasOptions(conflict) && conflict.guidance && (
                  <p className="mt-1.5 rounded-[var(--radius-button)] bg-warning-light/40 px-3 py-2 text-xs leading-relaxed text-text-secondary">
                    {conflict.guidance}
                  </p>
                )}

                {hasOptions(conflict) ? (
                  <div className="mt-2.5 space-y-2">
                    {conflict.canCreateVersion && (
                      <label className={optionClass(it.action === UploadDuplicateAction.NewVersion)}>
                        <input
                          type="radio"
                          name={`conflict-${it.id}`}
                          checked={it.action === UploadDuplicateAction.NewVersion}
                          onChange={() => update(it.id, { action: UploadDuplicateAction.NewVersion })}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-text">
                            {t('documents.uploadModal.conflictOptionVersion')}
                          </span>
                          <span className="block text-xs leading-relaxed text-text-muted">
                            {t('documents.uploadModal.conflictOptionVersionHint')}
                          </span>
                        </span>
                      </label>
                    )}

                    {conflict.canCreateNewDocument && (
                      <label className={optionClass(it.action === UploadDuplicateAction.NewDocument)}>
                        <input
                          type="radio"
                          name={`conflict-${it.id}`}
                          checked={it.action === UploadDuplicateAction.NewDocument}
                          onChange={() => update(it.id, { action: UploadDuplicateAction.NewDocument })}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-text">
                            {namingEnforced
                              ? t('documents.uploadModal.conflictOptionNewDocIso')
                              : t('documents.uploadModal.conflictOptionNewDoc')}
                          </span>
                          <span className="block text-xs leading-relaxed text-text-muted">
                            {t(
                              namingEnforced
                                ? 'documents.uploadModal.conflictOptionNewDocIsoHint'
                                : 'documents.uploadModal.conflictOptionNewDocHint',
                            ).replace('{name}', conflict.suggestedName ?? '')}
                          </span>
                        </span>
                      </label>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 rounded-[var(--radius-button)] bg-danger-light/40 px-3 py-2">
                    <p className="text-xs font-semibold text-danger">
                      {t('documents.uploadModal.conflictBlocked')}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{conflict.guidance}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-card-border px-5 py-3.5">
          <span className="text-xs text-text-muted">
            {conflictResolved ? '' : t('documents.uploadModal.conflictChooseFirst')}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={dismissConflict}
              className="rounded-[var(--radius-button)] border border-card-border px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-content-bg"
            >
              {t('documents.uploadModal.conflictCancel')}
            </button>
            <button
              type="button"
              disabled={!conflictResolved}
              onClick={() => {
                setShowConflict(false);
                void runUpload(items.filter(isPending));
              }}
              className="rounded-[var(--radius-button)] bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-40"
            >
              {t('documents.uploadModal.conflictContinue')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={busy ? undefined : onClose} />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-xl flex-col animate-scale-in rounded-[var(--radius-card-lg)] bg-card shadow-modal">
        {conflictDialog}
        {/* Header */}
        <div className="flex items-center justify-between border-b border-card-border px-6 py-4">
          <h2 className="heading-entity">{t('documents.uploadModal.title')}</h2>
          <button type="button" onClick={onClose} disabled={busy} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-content-bg hover:text-text disabled:opacity-40">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-6 py-5">
          {/* Thư mục đích */}
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-text-muted">{t('documents.uploadModal.target')}</p>
            <div className="flex items-center gap-2 rounded-[var(--radius-button)] border border-card-border bg-input-bg/50 px-3.5 py-2.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <span className="truncate text-sm font-medium text-text">{targetFolder.name}</span>
            </div>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
            className={`flex flex-col items-center gap-1.5 rounded-[var(--radius-card)] border-2 border-dashed px-6 py-10 text-center transition-colors ${dragOver ? 'border-primary bg-primary-ghost' : 'border-card-border bg-input-bg/30'}`}
          >
            <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </span>
            <p className="font-semibold text-text">{t('documents.uploadModal.dropHere')}</p>
            <p className="text-sm text-text-muted">
              {t('documents.uploadModal.chooseLead')}
              <button type="button" onClick={() => inputRef.current?.click()} className="font-semibold text-primary hover:underline">
                {t('documents.uploadModal.choose')}
              </button>
            </p>
            <p className="mt-1 text-xs text-text-placeholder">
              {namingEnforced ? t('naming.upload.singleFile') : t('documents.uploadModal.hint')}
            </p>
            <input ref={inputRef} type="file" multiple={!namingEnforced} className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
          </div>

          {/* Quy tắc đặt tên (nếu folder có) */}
          {namingLoading ? (
            <p className="rounded-xl border border-card-border bg-input-bg/30 px-3.5 py-2.5 text-xs text-text-muted">
              {t('naming.upload.loading')}
            </p>
          ) : hasConvention ? (
            <div className="space-y-3 rounded-[var(--radius-card)] border border-primary/25 bg-primary-ghost/60 p-4">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                    <line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-primary">{t('naming.upload.title')}</p>
                  <p className="text-xs text-text-muted">{t('naming.upload.hint')}</p>
                </div>
              </div>

              {/* Tệp ngoại lệ: giữ tên gốc, không áp quy tắc (văn bản hành chính...) */}
              <label className="flex cursor-pointer items-start gap-2.5 rounded-[var(--radius-card)] border border-card-border bg-card px-3.5 py-2.5">
                <input
                  type="checkbox"
                  checked={bypass}
                  disabled={busy}
                  onChange={(e) => setBypass(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                />
                <span>
                  <span className="block text-sm font-semibold text-text">{t('naming.upload.bypass')}</span>
                  <span className="block text-xs text-text-muted">{t('naming.upload.bypassHint')}</span>
                </span>
              </label>

              {!bypass && (
              <>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {sortedFields.map((field) => (
                  <div key={field.id}>
                    <label className="mb-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-text-muted">
                      {field.locked && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                      )}
                      <span className="truncate">{field.displayName}</span>
                      {field.required && !field.locked && <span className="text-danger">*</span>}
                    </label>
                    {field.locked ? (
                      <div className="flex items-center gap-2 rounded-[var(--radius-input)] border border-card-border bg-content-bg/60 px-3 py-2 text-sm text-text-secondary" title={field.lockedValue?.displayName}>
                        <span className="font-mono font-bold">{field.lockedValue?.code}</span>
                        <span className="truncate text-xs text-text-muted">{field.lockedValue?.displayName}</span>
                      </div>
                    ) : (
                      <>
                        <select
                          value={selections[field.id] ?? ''}
                          disabled={busy}
                          onChange={(e) => {
                            const valueId = e.target.value;
                            setSelections((prev) => ({ ...prev, [field.id]: valueId }));
                            // User chọn tay -> gỡ cờ đỏ autofill không khớp.
                            if (valueId)
                              setMismatchIds((prev) => {
                                if (!prev.has(field.id)) return prev;
                                const nextSet = new Set(prev);
                                nextSet.delete(field.id);
                                return nextSet;
                              });
                          }}
                          className={`field-select py-2 pl-3 ${
                            mismatchIds.has(field.id)
                              ? 'border-danger bg-danger-light/30 focus:border-danger'
                              : 'border-input-border bg-card'
                          }`}
                        >
                          <option value="">{t('naming.upload.select')}</option>
                          {(field.values ?? []).map((v) => (
                            <option key={v.id} value={v.id}>{v.code} — {v.displayName}</option>
                          ))}
                        </select>
                        {mismatchIds.has(field.id) && (
                          <p className="mt-1 text-xs font-medium text-danger">{t('naming.upload.autofillMismatch')}</p>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Xem trước tên tệp */}
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-text-muted">{t('naming.upload.preview')}</p>
                <div className="rounded-[var(--radius-card)] border border-card-border bg-card px-3.5 py-2.5">
                  {previewBase ? (
                    <p className="truncate font-mono text-sm font-semibold text-primary">{previewBase}{previewExt}</p>
                  ) : (
                    <p className="text-sm text-text-placeholder">{t('naming.upload.select')}</p>
                  )}
                </div>
                {blockedByNaming && (
                  <p className="mt-1.5 text-xs font-medium text-danger">{t('naming.upload.missingRequired')}</p>
                )}
              </div>
              </>
              )}
            </div>
          ) : null}

          {/* Danh sách tệp */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
              {t('documents.uploadModal.list')} ({items.length})
            </p>
            {items.length === 0 ? (
              <p className="rounded-[var(--radius-input)] border border-dashed border-card-border bg-input-bg/30 p-4 text-center text-sm text-text-muted">
                {t('documents.uploadModal.empty')}
              </p>
            ) : (
              <ul className="space-y-2">
                {items.map((it) => (
                  <li key={it.id} className="flex items-center gap-3 rounded-xl border border-card-border px-3.5 py-2.5">
                    <FileTypeIcon fileName={it.file.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">{it.file.name}</p>
                      <p className="text-xs text-text-muted">{formatSize(it.file.size)}</p>
                      {/* Liên kết chọn riêng cho từng file, không áp chung cả lô. */}
                      {(it.status === 'pending' || it.status === 'error') && !busy && (
                        <button
                          type="button"
                          onClick={() => setPickerFor(it.id)}
                          className="mt-1 flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                          </svg>
                          {it.relatedFileItemIds.length > 0
                            ? `${t('relatedFiles.upload.linked')} (${it.relatedFileItemIds.length})`
                            : t('relatedFiles.upload.link')}
                        </button>
                      )}
                      {it.status === 'uploading' && (
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-content-bg">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${it.progress}%` }} />
                        </div>
                      )}
                      {it.status === 'error' && it.errorMsg && (
                        <p className="mt-0.5 text-xs font-medium text-danger">{it.errorMsg}</p>
                      )}
                      {it.status === 'done' && it.resultVersion && (
                        <p className="mt-0.5 text-xs font-medium text-text-secondary">
                          {t('documents.uploadModal.savedAsVersion')} <span className="font-semibold text-text">{it.resultVersion}</span>
                        </p>
                      )}
                      {/* Chọn "tài liệu riêng" thì BE đặt tên khác — nói rõ tên thật, đừng để người dùng đoán. */}
                      {it.status === 'done' && it.resultName && it.resultName !== baseNameOf(it) && (
                        <p className="mt-0.5 text-xs font-medium text-text-secondary">
                          {t('documents.uploadModal.savedAsNewDoc')} <span className="font-semibold text-text">{it.resultName}</span>
                        </p>
                      )}
                    </div>
                    {isPending(it) && isBlocked(it) && (
                      <span className="shrink-0 rounded-full bg-danger-light px-2 py-0.5 text-xs font-semibold text-danger">
                        {t('documents.uploadModal.conflictBadgeBlocked')}
                      </span>
                    )}
                    {isPending(it) && !isBlocked(it) && (conflictedOf(it) || (!it.availability && localConflictOf(it))) && (
                      <span className="shrink-0 rounded-full bg-warning-light px-2 py-0.5 text-xs font-semibold text-warning">
                        {t('documents.uploadModal.conflictBadge')}
                      </span>
                    )}
                    {it.status === 'uploading' && <span className="shrink-0 text-xs font-semibold text-primary">{it.progress}%</span>}
                    {it.status === 'done' && <span className="shrink-0 rounded-full bg-success-light px-2 py-0.5 text-xs font-semibold text-success">{t('documents.uploadModal.done')}</span>}
                    {it.status === 'error' && <span className="shrink-0 rounded-full bg-danger-light px-2 py-0.5 text-xs font-semibold text-danger">{t('documents.uploadModal.failed')}</span>}
                    {(it.status === 'pending' || it.status === 'error') && !busy && (
                      <button type="button" onClick={() => removeItem(it.id)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-content-bg hover:text-danger">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-card-border px-6 py-4">
          <span className="min-w-0 truncate text-xs text-text-muted">
            {checkError ? (
              <span className="font-medium text-danger">{checkError}</span>
            ) : checking ? (
              t('documents.uploadModal.checkingNames')
            ) : (
              `${doneCount}/${items.length} ${t('documents.uploadModal.done').toLowerCase()}`
            )}
          </span>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={busy || checking} className="btn-modal-ghost">
              {t('documents.uploadModal.cancel')}
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={busy || checking || !hasPending || blockedByNaming}
              title={blockedByNaming ? t('naming.upload.missingRequired') : undefined}
              className="btn-modal-primary flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              {busy
                ? t('documents.uploadModal.uploading')
                : checking
                  ? t('documents.uploadModal.checkingNames')
                  : t('documents.uploadModal.submit')}
            </button>
          </div>
        </div>
      </div>

      {pickerFor && (
        <RelatedFilesPicker
          folderId={targetFolder.id}
          selectedIds={items.find((i) => i.id === pickerFor)?.relatedFileItemIds ?? []}
          onConfirm={(ids) => {
            update(pickerFor, { relatedFileItemIds: ids });
            setPickerFor(null);
          }}
          onClose={() => setPickerFor(null)}
        />
      )}
    </div>
  );
}
