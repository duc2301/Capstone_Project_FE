import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { approvalApi, approvalErrorMessage, isTeamPermissionError, type ApprovalTargetZone, type SubmitApprovalPayload } from '@/entities/approval';
import type { DocumentSearchResult } from '@/entities/document-search';
import type { EffectivePermission, FolderTreeNode } from '@/entities/folder';
import { CdeArea, folderErrorMessage } from '@/entities/folder';
import type { Group } from '@/entities/group';
import { GroupMemberStatus } from '@/entities/group';
import { GroupMemberRole } from '@/entities/invitation';
import { isAccountAdmin, useSession } from '@/entities/session';
import { buildDownloadName, downloadBlob } from '@/shared/lib/download';
import { Toast, ToolbarIconButton, useToast } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

import type { FileListItem } from '@/entities/file-item';
import { fileItemApi, FileItemStatus, FileReturnRequestStatus, is3DFile } from '@/entities/file-item';
import { zoneTransferApi, zoneTransferErrorMessage } from '@/entities/zone-transfer';

import { useFolderActions } from '../model/useFolderActions';
import { useFolderPermission } from '../model/useFolderPermission';
import { useFolderFiles } from '../model/useFolderFiles';
import { useFolderTree } from '@/entities/folder';
import { zoneNameFromArea } from '../model/zoneTransferFormat';
import { ApprovalHistoryModal } from './ApprovalHistoryModal';
import { FileContextMenu } from './FileContextMenu';
import { FileList } from './FileList';
import { FilePermissionModal } from './FilePermissionModal';
import { FileVersionsModal } from './FileVersionsModal';
import { FolderActionModal, type FolderAction } from './FolderActionModal';
import { FolderContextMenu } from './FolderContextMenu';
import { FolderPermissionModal } from './FolderPermissionModal';
import { FolderTree } from './FolderTree';
import { PendingApprovalsModal } from './PendingApprovalsModal';
import { ReturnRequestModal } from './ReturnRequestModal';
import { SemanticSearchPanel } from './SemanticSearchPanel';
import { SubmitApprovalModal } from './SubmitApprovalModal';
import { UploadModal } from './UploadModal';

interface DocumentsTabProps {
  projectId: string;
  /** Admin hệ thống hoặc PM của dự án — được phép "Niêm phong lưu trữ" ở Published. */
  isProjectManager: boolean;
  /* Nhóm của dự án — trang cha đã tải sẵn, truyền xuống để khỏi gọi API lần hai. */
  signerGroups: Group[];
  signerGroupsLoading: boolean;
  /* Modal quy tắc đặt tên thuộc feature khác — trang cha dựng và truyền vào. */
  renderNamingModal?: (ctx: {
    folder: FolderTreeNode;
    canManage: boolean;
    close: () => void;
    notify: (message: string) => void;
  }) => React.ReactNode;
}

/* Các quyền (theo thứ tự hiển thị) → nhãn i18n */
const PERMISSION_FLAGS: { key: keyof EffectivePermission; label: () => string }[] = [
  { key: 'canView', label: () => t('documents.perm.view') },
  { key: 'canEdit', label: () => t('documents.perm.edit') },
];

/* Thư mục hệ thống ở Published được nhận file trực tiếp — khớp Domain/Common/CdeFolderNames.cs */
const PACKAGES_FOLDER_NAME = 'Các gói thầu';
const LEGAL_FOLDER_NAME = 'Hồ sơ pháp lý';

function subtreeIds(node: FolderTreeNode): string[] {
  return [node.id, ...node.children.flatMap(subtreeIds)];
}

/* Tìm node theo id trong cây */
function findNode(nodes: FolderTreeNode[], id: string | null): FolderTreeNode | null {
  if (!id) return null;
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(n.children, id);
    if (found) return found;
  }
  return null;
}

interface MenuState {
  node: FolderTreeNode;
  x: number;
  y: number;
}
interface ModalState {
  action: FolderAction;
  node: FolderTreeNode;
}

function canStartApprovalFromArea(area: CdeArea) {
  // Published là bước cuối của luồng duyệt — không gửi duyệt / chuyển trạng thái ở đây nữa.
  // Lưu trữ đi qua "Niêm phong lưu trữ" (PM/Admin), ngoài approval flow.
  return area === CdeArea.Wip || area === CdeArea.Shared;
}

function nextApprovalTargetZone(area: CdeArea): ApprovalTargetZone | null {
  if (area === CdeArea.Wip) return 'Shared';
  if (area === CdeArea.Shared) return 'Published';
  return null;
}

export function DocumentsTab({
  projectId,
  isProjectManager,
  signerGroups,
  signerGroupsLoading,
  renderNamingModal,
}: DocumentsTabProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { tree, loading, error, refetch } = useFolderTree(projectId);
  const { createSubFolder, renameFolder, moveFolder, deleteFolder } = useFolderActions();
  const { currentUser } = useSession();
  const hasFullFolderAccess = isAccountAdmin(currentUser?.role) || isProjectManager;

  // Gate thô cho nút gán/kế thừa/tùy chỉnh naming: Admin hoặc Leader active của 1 group
  // trong project. BE check chính xác theo group phụ trách từng folder (403 nếu lách).
  const canManageNaming =
    isAccountAdmin(currentUser?.role)
    || signerGroups.some((g) =>
      g.members.some(
        (m) =>
          m.accountId === currentUser?.accountId
          && m.role === GroupMemberRole.Leader
          && m.status === GroupMemberStatus.Active,
      ));

  // Khôi phục thư mục đang chọn khi quay lại từ trang "Xem chi tiết" (?folder=...).
  const [selectedId, setSelectedId] = useState<string | null>(() => searchParams.get('folder'));
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [busy, setBusy] = useState(false);

  const [uploadFolder, setUploadFolder] = useState<FolderTreeNode | null>(null);
  const [fileMenu, setFileMenu] = useState<{ file: FileListItem; x: number; y: number } | null>(null);
  const [versionsFor, setVersionsFor] = useState<FileListItem | null>(null);
  const [submitApprovalFor, setSubmitApprovalFor] = useState<FileListItem | null>(null);
  const [submitApprovalError, setSubmitApprovalError] = useState<string | null>(null);
  const [submitApprovalPermissionIssue, setSubmitApprovalPermissionIssue] = useState(false);
  const [approvalBusy, setApprovalBusy] = useState(false);
  const [pendingApprovalsOpen, setPendingApprovalsOpen] = useState(false);
  const [approvalHistoryOpen, setApprovalHistoryOpen] = useState(false);
  const [returnRequestFor, setReturnRequestFor] = useState<FileListItem | null>(null);
  const [returnRequestBusy, setReturnRequestBusy] = useState(false);
  const [permissionFor, setPermissionFor] = useState<FolderTreeNode | null>(null);
  const [filePermissionFor, setFilePermissionFor] = useState<FileListItem | null>(null);
  const [namingFor, setNamingFor] = useState<FolderTreeNode | null>(null);

  const { subfolders, files, loading: filesLoading, error: filesError, refetch: refetchFiles } = useFolderFiles(selectedId);

  const selected = findNode(tree, selectedId);
  const { permission: selectedPermissionRaw } = useFolderPermission(selectedId, hasFullFolderAccess);
  const { permission: menuPermissionRaw } = useFolderPermission(menu?.node.id ?? null, hasFullFolderAccess);
  const selectedPermission = selectedPermissionRaw ?? { folderId: '', canView: false, canEdit: false, canApprove: false };
  const menuPermission = menuPermissionRaw ?? { folderId: '', canView: false, canEdit: false, canApprove: false };
  const selectedTargetZone = selected ? nextApprovalTargetZone(selected.area) : null;

  const { toast, showToast } = useToast();

  const handleContextMenu = (e: React.MouseEvent, node: FolderTreeNode) => {
    e.preventDefault();
    setSelectedId(node.id);
    setMenu({ node, x: e.clientX, y: e.clientY });
  };

  // Menu từ nút ⋮ / chuột phải trên hàng thư mục con: chỉ mở menu, không mở thư mục.
  const handleFolderRowMenu = (e: React.MouseEvent, node: FolderTreeNode) => {
    e.preventDefault();
    setMenu({ node, x: e.clientX, y: e.clientY });
  };

  const handleNewFolderClick = () => {
    if (selected && selectedPermission.canEdit) {
      setModal({ action: 'create', node: selected });
    } else {
      showToast(t('documents.selectFolderToCreate'), 'error');
    }
  };

  // Mở modal upload cho 1 folder (chỉ ô con WIP/Shared có quyền ghi).
  // Chặn sớm cho khớp BE: chỉ WIP mới nhận file, trừ 2 thư mục hồ sơ hệ thống ở Published.
  const canUploadTo = (node: FolderTreeNode, canEdit: boolean) => {
    if (node.parentFolderId === null) return false;
    if (!canEdit) return false;
    if (node.area === CdeArea.Wip) return true;
    if (node.area !== CdeArea.Published) return false;
    if (node.name === LEGAL_FOLDER_NAME) return true;
    return findNode(tree, node.parentFolderId)?.name === PACKAGES_FOLDER_NAME;
  };

  const openUpload = (node: FolderTreeNode) => {
    if (canUploadTo(node, node.id === selectedId ? selectedPermission.canEdit : menuPermission.canEdit)) setUploadFolder(node);
    else showToast(t('documents.uploadWipOnly'), 'error');
  };

  const handleFileMenu = (e: React.MouseEvent, file: FileListItem) => {
    e.preventDefault();
    setFileMenu({ file, x: e.clientX, y: e.clientY });
  };

  // "Xem chi tiết" -> điều hướng sang trang xem riêng (BE quyết định model/inline/download).
  const handleDetail = (file: FileListItem) => {
    navigate(`/projects/${projectId}/files/${file.id}/view?folder=${file.folderId}`);
  };

  // Bấm 1 kết quả tìm kiếm ngữ nghĩa -> mở đúng trang xem chi tiết của file đó.
  const handleOpenSearchResult = (result: DocumentSearchResult) => {
    navigate(`/projects/${projectId}/files/${result.fileItemId}/view?folder=${result.folderId}`);
  };

  // Tài liệu chỉ được index vào RAG khi đã phát hành -> chỉ tra cứu ngữ nghĩa ở Published/Archived.
  const showSemanticSearch =
    !!selected && (selected.area === CdeArea.Published || selected.area === CdeArea.Archived);

  const openSubmitApproval = (file: FileListItem) => {
    setSubmitApprovalFor(file);
    setSubmitApprovalError(null);
    setSubmitApprovalPermissionIssue(false);
  };

  const handleDownload = async (file: FileListItem) => {
    try {
      showToast(t('documents.toast.downloading'));
      const res = await fileItemApi.download(file.id);
      downloadBlob(res.data as Blob, buildDownloadName(file.name, file.format));
    } catch {
      showToast(t('common.error'), 'error');
    }
  };

  const handleSubmit = async (value?: string) => {
    if (!modal) return;
    const { action, node } = modal;
    setBusy(true);
    try {
      if (action === 'create') await createSubFolder(node.id, value ?? '');
      else if (action === 'rename') await renameFolder(node.id, value ?? '');
      else if (action === 'move') await moveFolder(node.id, value ?? '');
      else await deleteFolder(node.id);

      await refetch();
      if (action === 'delete' && selectedId && subtreeIds(node).includes(selectedId)) setSelectedId(null);
      showToast(
        action === 'create' ? t('documents.toast.created')
        : action === 'rename' ? t('documents.toast.renamed')
        : action === 'move' ? t('documents.toast.moved')
        : t('documents.toast.deleted'),
      );
      setModal(null);
    } catch (err) {
      showToast(folderErrorMessage(err, t('common.error')), 'error');
    } finally {
      setBusy(false);
    }
  };

  // File ở WIP/Shared/Published có thể gửi duyệt để BE approve và chuyển sang vùng kế tiếp.
  const canSubmitApproval = (file: FileListItem) =>
    !!selected
    && canStartApprovalFromArea(selected.area)
    && file.status !== FileItemStatus.PendingApproval
    && file.status !== FileItemStatus.Rejected
    && file.returnRequestStatus !== FileReturnRequestStatus.Pending;

  const handleSubmitApproval = async (payload: SubmitApprovalPayload) => {
    if (!submitApprovalFor) return;
    setApprovalBusy(true);
    setSubmitApprovalError(null);
    setSubmitApprovalPermissionIssue(false);
    try {
      await approvalApi.submitApproval(submitApprovalFor.id, payload);
      await refetchFiles();
      showToast(t('approvals.toast.submitted'));
      setSubmitApprovalFor(null);
    } catch (err) {
      setSubmitApprovalError(approvalErrorMessage(err, t('common.error')));
      setSubmitApprovalPermissionIssue(isTeamPermissionError(err));
    } finally {
      setApprovalBusy(false);
    }
  };

  // Leader vẫn thấy "Chuyển trạng thái", nhưng thao tác này tạo approval request.
  // BE chỉ chuyển vùng thật sự khi Leader approve request đó.
  const canTransferZone = (file: FileListItem) =>
    !!selected
    && selectedPermission.canEdit
    && canStartApprovalFromArea(selected.area)
    && file.status === FileItemStatus.Approved
    && file.returnRequestStatus !== FileReturnRequestStatus.Pending;
  const canReturnToWip = (file: FileListItem) =>
    !!selected
    && selected.area !== CdeArea.Wip
    && file.status !== FileItemStatus.PendingApproval
    && file.returnRequestStatus !== FileReturnRequestStatus.Pending;

  // Niêm phong lưu trữ: chỉ Admin/PM, chỉ với file đã ở Published (đã duyệt).
  const canArchive = (file: FileListItem) =>
    !!selected
    && selected.area === CdeArea.Published
    && (isAccountAdmin(currentUser?.role) || isProjectManager)
    && file.status === FileItemStatus.Approved;

  const handleReturnRequest = async (reason: string) => {
    if (!returnRequestFor) return;
    setReturnRequestBusy(true);
    try {
      await zoneTransferApi.createReturnRequest(returnRequestFor.id, reason);
      await refetchFiles();
      showToast(t('returnRequests.toast.submitted'));
      setReturnRequestFor(null);
    } catch (err) {
      showToast(zoneTransferErrorMessage(err, t('common.error')), 'error');
    } finally {
      setReturnRequestBusy(false);
    }
  };

  // Niêm phong lưu trữ bản Published hiện hành -> tạo/cộng dồn bản lưu trong Archived.
  const handleArchive = async (file: FileListItem) => {
    try {
      await fileItemApi.archive(file.id);
      await refetch();        // cây cập nhật: bản lưu mới xuất hiện trong vùng Archived
      await refetchFiles();
      showToast(t('documents.toast.archived'));
    } catch (err) {
      showToast(folderErrorMessage(err, t('common.error')), 'error');
    }
  };

  const selectedCanManage = !!selected && selectedPermission.canEdit && selected.parentFolderId !== null;

  return (
    // Header cố định, lưới 2 ô chiếm phần chiều cao còn lại
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <Toast toast={toast} className="z-[60]" />

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <h2 className="heading-tab shrink-0">{t('projectDetail.tab.documents')}</h2>

        <div className="flex flex-wrap items-center gap-3">
          <ToolbarIconButton
            label={t('approvals.pending.title')}
            onClick={() => setPendingApprovalsOpen(true)}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            }
          />
          <ToolbarIconButton
            label={t('approvals.history.title')}
            onClick={() => setApprovalHistoryOpen(true)}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            }
          />
          <ToolbarIconButton
            label={t('documents.upload')}
            onClick={() => { if (selected) openUpload(selected); else showToast(t('documents.selectFolderToCreate'), 'error'); }}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            }
          />
          <button
            type="button"
            onClick={handleNewFolderClick}
            className="flex items-center gap-2 rounded-[var(--radius-button)] bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <line x1="9" y1="14" x2="15" y2="14" />
            </svg>
            {t('documents.newFolder')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-[var(--radius-card)] border border-card-border bg-card py-20 shadow-card">
          <p className="text-sm text-text-muted">{t('common.loading')}</p>
        </div>
      ) : error ? (
        <div className="rounded-[var(--radius-card)] border border-danger/20 bg-danger-light p-6 text-center">
          <p className="text-sm font-medium text-danger">{error}</p>
        </div>
      ) : (
        // Dữ liệu dài thì cuộn trong từng ô, không đẩy dài cả trang
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          {/* Cây thư mục — chuột phải để mở menu thao tác */}
          <FolderTree
            tree={tree}
            selectedId={selectedId}
            onSelect={(n) => setSelectedId(n.id)}
            onContextMenu={handleContextMenu}
          />

          {/* Panel nội dung thư mục đang chọn */}
          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-card-border bg-card p-3.5 shadow-card">
            {!selected ? (
              <div className="flex h-full min-h-70 items-center justify-center">
                <p className="text-sm text-text-muted">{t('documents.selectFolder')}</p>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-card-border pb-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                    </span>
                    <h3 className="heading-entity truncate">{selected.name}</h3>
                  </div>

                  {/* Nút thao tác nhanh trên thư mục đang chọn */}
                  {selectedPermission.canEdit && (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        title={t('documents.menu.createSub')}
                        onClick={() => setModal({ action: 'create', node: selected })}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-content-bg hover:text-primary"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                          <line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" />
                        </svg>
                      </button>
                      {selectedCanManage && (
                        <>
                          <button
                            type="button"
                            title={t('documents.menu.rename')}
                            onClick={() => setModal({ action: 'rename', node: selected })}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-content-bg hover:text-primary"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            title={t('documents.menu.delete')}
                            onClick={() => setModal({ action: 'delete', node: selected })}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-danger-light hover:text-danger"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Quyền của bạn trên thư mục này */}
                <div className="shrink-0 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    {t('documents.yourPermission')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PERMISSION_FLAGS.filter((f) => selectedPermission[f.key]).map((f) => (
                      <span
                        key={f.key}
                        className="rounded-full bg-success-light px-3 py-1 text-xs font-semibold text-success"
                      >
                        {f.label()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tra cứu tài liệu theo ngữ nghĩa (RAG) — chỉ ở Published/Archived */}
                {showSemanticSearch && projectId && (
                  <div className="shrink-0">
                    <SemanticSearchPanel projectId={projectId} onOpenFile={handleOpenSearchResult} />
                  </div>
                )}

                {/* Nội dung thư mục: thư mục con trước, tệp sau — chuột phải / nút ⋮ để mở menu thao tác */}
                <FileList
                  subfolders={subfolders}
                  files={files}
                  loading={filesLoading}
                  error={filesError}
                  onFolderOpen={(n) => setSelectedId(n.id)}
                  onFolderMenu={handleFolderRowMenu}
                  onFileMenu={handleFileMenu}
                  onFileOpen={handleDetail}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Context menu (chuột phải) */}
      {menu && (
        <FolderContextMenu
          node={menu.node}
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          onUpload={() => openUpload(menu.node)}
          onCreateSub={() => setModal({ action: 'create', node: menu.node })}
          onRename={() => setModal({ action: 'rename', node: menu.node })}
          onMove={() => setModal({ action: 'move', node: menu.node })}
          onDelete={() => setModal({ action: 'delete', node: menu.node })}
          onPermission={() => setPermissionFor(menu.node)}
          onNaming={() => setNamingFor(menu.node)}
        />
      )}

      {/* Modal quy tắc đặt tên của thư mục — do trang cha dựng (thuộc feature khác) */}
      {namingFor && renderNamingModal?.({
        folder: namingFor,
        canManage: canManageNaming,
        close: () => setNamingFor(null),
        notify: (message) => showToast(message),
      })}

      {/* Modal phân quyền thư mục */}
      {permissionFor && (
        <FolderPermissionModal
          node={permissionFor}
          onClose={() => setPermissionFor(null)}
          onSaved={() => {
            showToast(t('folderPermission.toast.updated'));
            void refetch();
          }}
        />
      )}

      {/* Modal thao tác thư mục */}
      {modal && (
        <FolderActionModal
          action={modal.action}
          node={modal.node}
          tree={tree}
          busy={busy}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
        />
      )}

      {/* Menu chuột phải trên 1 tệp */}
      {fileMenu && (
        <FileContextMenu
          x={fileMenu.x}
          y={fileMenu.y}
          onClose={() => setFileMenu(null)}
          onDetail={() => handleDetail(fileMenu.file)}
          onDownload={() => handleDownload(fileMenu.file)}
          canManageVersions={selectedPermission.canEdit}
          onVersions={() => setVersionsFor(fileMenu.file)}
          onPermission={() => setFilePermissionFor(fileMenu.file)}
          canSubmitApproval={canSubmitApproval(fileMenu.file)}
          onSubmitApproval={() => openSubmitApproval(fileMenu.file)}
          canTransferZone={canTransferZone(fileMenu.file)}
          onTransferZone={() => openSubmitApproval(fileMenu.file)}
          canReturnToWip={canReturnToWip(fileMenu.file)}
          onReturnToWip={() => setReturnRequestFor(fileMenu.file)}
          canArchive={canArchive(fileMenu.file)}
          onArchive={() => handleArchive(fileMenu.file)}
        />
      )}

      {/* Modal yêu cầu trả tài liệu về WIP */}
      {returnRequestFor && selected && (
        <ReturnRequestModal
          fileName={returnRequestFor.name}
          currentZone={zoneNameFromArea(selected.area)}
          busy={returnRequestBusy}
          onClose={() => setReturnRequestFor(null)}
          onSubmit={handleReturnRequest}
        />
      )}

      {/* Modal phân quyền tệp */}
      {filePermissionFor && (
        <FilePermissionModal
          fileItemId={filePermissionFor.id}
          fileName={filePermissionFor.name}
          onClose={() => setFilePermissionFor(null)}
          onSaved={() => showToast(t('filePermission.toast.updated'))}
        />
      )}

      {/* Modal danh sách phiên bản */}
      {versionsFor && (
        <FileVersionsModal
          fileItemId={versionsFor.id}
          fileName={versionsFor.name}
          currentVersionId={versionsFor.currentVersionId}
          canRestore={selectedPermission.canEdit}
          onViewVersion={(versionStateId, isCurrent) => {
            const versionQuery = isCurrent ? '' : `&version=${versionStateId}`;
            navigate(`/projects/${projectId}/files/${versionsFor.id}/view?folder=${versionsFor.folderId}${versionQuery}`);
          }}
          onClose={() => setVersionsFor(null)}
          onRestored={(displayVersion) => {
            void refetchFiles();
            showToast(t('documents.versions.restoreSuccess').replace('{version}', displayVersion));
          }}
        />
      )}

      {/* Modal tải tệp lên (kéo-thả + danh sách) */}
      {uploadFolder && (
        <UploadModal
          targetFolder={uploadFolder}
          onClose={() => setUploadFolder(null)}
          onUploaded={() => {
            showToast(t('documents.toast.uploaded'));
            if (uploadFolder.id === selectedId) void refetchFiles();
          }}
        />
      )}

      {/* Modal gửi tệp để phê duyệt */}
      {submitApprovalFor && (
        <SubmitApprovalModal
          fileName={submitApprovalFor.name}
          currentZone={selected ? zoneNameFromArea(selected.area) : 'Wip'}
          targetZone={selectedTargetZone}
          canRequireSignature={!!selectedTargetZone && !is3DFile(submitApprovalFor.fileType, submitApprovalFor.format)}
          mustRequireSignature={
            selected?.area === CdeArea.Shared &&
            selectedTargetZone === 'Published' &&
            !is3DFile(submitApprovalFor.fileType, submitApprovalFor.format)
          }
          signerGroups={signerGroups}
          loadingSigners={signerGroupsLoading}
          busy={approvalBusy}
          submitError={submitApprovalError}
          submitErrorAction={
            submitApprovalPermissionIssue
              ? { label: t('documents.goToTeamsTab'), onClick: () => navigate(`/projects/${projectId}?tab=teams`) }
              : null
          }
          onClose={() => { setSubmitApprovalFor(null); setSubmitApprovalError(null); setSubmitApprovalPermissionIssue(false); }}
          onSubmit={handleSubmitApproval}
        />
      )}

      {/* Danh sách chờ duyệt */}
      {pendingApprovalsOpen && (
        <PendingApprovalsModal
          isLeader={canManageNaming}
          currentAccountId={currentUser?.accountId}
          projectId={projectId}
          projectGroups={signerGroups}
          onClose={() => setPendingApprovalsOpen(false)}
          onChanged={() => {
            void refetchFiles();
            void refetch();
          }}
        />
      )}

      {/* Lịch sử phê duyệt */}
      {approvalHistoryOpen && (
        <ApprovalHistoryModal onClose={() => setApprovalHistoryOpen(false)} />
      )}
    </div>
  );
}
