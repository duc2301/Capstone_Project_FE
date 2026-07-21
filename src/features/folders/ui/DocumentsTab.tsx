import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { approvalApi, approvalErrorMessage, type ApprovalTargetZone, type SubmitApprovalPayload } from '@/entities/approval';
import type { DocumentSearchResult } from '@/entities/document-search';
import type { EffectivePermission, FolderTreeNode } from '@/entities/folder';
import { CdeArea } from '@/entities/folder';
import { GroupMemberStatus } from '@/entities/group';
import { GroupMemberRole } from '@/entities/invitation';
import { isAccountAdmin, useSession } from '@/entities/session';
import { FolderNamingInfoModal } from '@/features/naming-conventions';
import { useProjectGroups } from '@/features/projects';
import { t } from '@/shared/lib/i18n';

import type { FileListItem } from '@/entities/file-item';
import { fileItemApi, FileItemStatus, FileReturnRequestStatus, is3DFile } from '@/entities/file-item';
import { zoneTransferApi, zoneTransferErrorMessage } from '@/entities/zone-transfer';

import { useFolderActions } from '../model/useFolderActions';
import { useFolderFiles } from '../model/useFolderFiles';
import { useFolderTree } from '../model/useFolderTree';
import { zoneNameFromArea } from '../model/zoneTransferFormat';
import { ApprovalHistoryModal } from './ApprovalHistoryModal';
import { FileContextMenu } from './FileContextMenu';
import { FileList } from './FileList';
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
}

/* Các quyền (theo thứ tự hiển thị) → nhãn i18n */
const PERMISSION_FLAGS: { key: keyof EffectivePermission; label: () => string }[] = [
  { key: 'canView', label: () => t('documents.perm.view') },
  { key: 'canEdit', label: () => t('documents.perm.edit') },
  { key: 'canUpdate', label: () => t('documents.perm.update') },
  { key: 'canDownload', label: () => t('documents.perm.download') },
  { key: 'canVerify', label: () => t('documents.perm.verify') },
  { key: 'canApprove', label: () => t('documents.perm.approve') },
];

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
  return area === CdeArea.Wip || area === CdeArea.Shared || area === CdeArea.Published;
}

function nextApprovalTargetZone(area: CdeArea): ApprovalTargetZone | null {
  if (area === CdeArea.Wip) return 'Shared';
  if (area === CdeArea.Shared) return 'Published';
  if (area === CdeArea.Published) return 'Archived';
  return null;
}

export function DocumentsTab({ projectId }: DocumentsTabProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { tree, loading, error, refetch } = useFolderTree(projectId);
  const { createSubFolder, renameFolder, moveFolder, deleteFolder } = useFolderActions();
  const { groups: signerGroups, loading: signerGroupsLoading } = useProjectGroups(projectId);
  const { currentUser } = useSession();

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
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [uploadFolder, setUploadFolder] = useState<FolderTreeNode | null>(null);
  const [fileMenu, setFileMenu] = useState<{ file: FileListItem; x: number; y: number } | null>(null);
  const [versionsFor, setVersionsFor] = useState<FileListItem | null>(null);
  const [submitApprovalFor, setSubmitApprovalFor] = useState<FileListItem | null>(null);
  const [submitApprovalError, setSubmitApprovalError] = useState<string | null>(null);
  const [approvalBusy, setApprovalBusy] = useState(false);
  const [pendingApprovalsOpen, setPendingApprovalsOpen] = useState(false);
  const [approvalHistoryOpen, setApprovalHistoryOpen] = useState(false);
  const [returnRequestFor, setReturnRequestFor] = useState<FileListItem | null>(null);
  const [returnRequestBusy, setReturnRequestBusy] = useState(false);
  const [permissionFor, setPermissionFor] = useState<FolderTreeNode | null>(null);
  const [namingFor, setNamingFor] = useState<FolderTreeNode | null>(null);

  const { subfolders, files, loading: filesLoading, error: filesError, refetch: refetchFiles } = useFolderFiles(selectedId);

  const selected = findNode(tree, selectedId);
  const selectedTargetZone = selected ? nextApprovalTargetZone(selected.area) : null;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

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
    if (selected && selected.permission.canEdit) {
      setModal({ action: 'create', node: selected });
    } else {
      showToast(t('documents.selectFolderToCreate'), 'error');
    }
  };

  // Mở modal upload cho 1 folder (chỉ ô con WIP/Shared có quyền ghi).
  const openUpload = (node: FolderTreeNode) => {
    if (node.parentFolderId !== null && (node.permission.canEdit || node.permission.canUpdate))
      setUploadFolder(node);
    else
      showToast(t('documents.selectFolderToCreate'), 'error');
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
  };

  const handleDownload = async (file: FileListItem) => {
    try {
      showToast(t('documents.toast.downloading'));
      const res = await fileItemApi.download(file.id);
      const blobUrl = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = file.format ? `${file.name}.${file.format}` : file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
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
      if (action === 'delete' && selectedId === node.id) setSelectedId(null);
      showToast(
        action === 'create' ? t('documents.toast.created')
        : action === 'rename' ? t('documents.toast.renamed')
        : action === 'move' ? t('documents.toast.moved')
        : t('documents.toast.deleted'),
      );
      setModal(null);
    } catch {
      showToast(t('common.error'), 'error');
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
    try {
      await approvalApi.submitApproval(submitApprovalFor.id, payload);
      await refetchFiles();
      showToast(t('approvals.toast.submitted'));
      setSubmitApprovalFor(null);
    } catch (err) {
      setSubmitApprovalError(approvalErrorMessage(err, t('common.error')));
    } finally {
      setApprovalBusy(false);
    }
  };

  // Leader vẫn thấy "Chuyển trạng thái", nhưng thao tác này tạo approval request.
  // BE chỉ chuyển vùng thật sự khi Leader approve request đó.
  const canTransferZone = (file: FileListItem) =>
    !!selected
    && selected.permission.canApprove
    && canStartApprovalFromArea(selected.area)
    && file.status === FileItemStatus.Approved
    && file.returnRequestStatus !== FileReturnRequestStatus.Pending;
  const canReturnToWip = (file: FileListItem) =>
    !!selected
    && selected.area !== CdeArea.Wip
    && file.status !== FileItemStatus.PendingApproval
    && file.returnRequestStatus !== FileReturnRequestStatus.Pending;

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

  const selectedCanManage = !!selected && selected.permission.canEdit && selected.parentFolderId !== null;

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-20 right-6 z-[60] animate-slide-up rounded-xl border px-5 py-3 shadow-dropdown ${toast.type === 'success' ? 'border-success/30 bg-success-light' : 'border-danger/30 bg-danger-light'}`}>
          <p className={`text-sm font-medium ${toast.type === 'success' ? 'text-success' : 'text-danger'}`}>{toast.msg}</p>
        </div>
      )}

      {/* Header: tiêu đề + hành động */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-2xl font-semibold text-primary">
          {t('projectDetail.tab.documents')}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setPendingApprovalsOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-ghost"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            {t('approvals.pending.title')}
          </button>
          <button
            type="button"
            onClick={() => setApprovalHistoryOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-ghost"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            {t('approvals.history.title')}
          </button>
          <button
            type="button"
            onClick={() => { if (selected) openUpload(selected); else showToast(t('documents.selectFolderToCreate'), 'error'); }}
            className="flex items-center gap-2 rounded-xl border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-ghost"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {t('documents.upload')}
          </button>
          <button
            type="button"
            onClick={handleNewFolderClick}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
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
        <div className="flex items-center justify-center rounded-(--radius-card) border border-card-border bg-card py-20 shadow-card">
          <p className="text-sm text-text-muted">{t('common.loading')}</p>
        </div>
      ) : error ? (
        <div className="rounded-(--radius-card) border border-danger/20 bg-danger-light p-6 text-center">
          <p className="text-sm font-medium text-danger">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          {/* Cây thư mục — chuột phải để mở menu thao tác */}
          <FolderTree
            tree={tree}
            selectedId={selectedId}
            onSelect={(n) => setSelectedId(n.id)}
            onContextMenu={handleContextMenu}
          />

          {/* Panel nội dung thư mục đang chọn */}
          <div className="min-w-0 rounded-(--radius-card) border border-card-border bg-card p-6 shadow-card">
            {!selected ? (
              <div className="flex h-full min-h-70 items-center justify-center">
                <p className="text-sm text-text-muted">{t('documents.selectFolder')}</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-3 border-b border-card-border pb-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                    </span>
                    <h3 className="truncate font-display text-xl text-text">{selected.name}</h3>
                  </div>

                  {/* Nút thao tác nhanh trên thư mục đang chọn */}
                  {selected.permission.canEdit && (
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
                          {selected.children.length === 0 && (
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
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Quyền của bạn trên thư mục này */}
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    {t('documents.yourPermission')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PERMISSION_FLAGS.filter((f) => selected.permission[f.key]).map((f) => (
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
                  <SemanticSearchPanel projectId={projectId} onOpenFile={handleOpenSearchResult} />
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

      {/* Modal quy tắc đặt tên của thư mục (+ kế thừa từ thư mục cha) */}
      {namingFor && (
        <FolderNamingInfoModal
          folder={namingFor}
          canManage={canManageNaming}
          onClose={() => setNamingFor(null)}
          onInherited={() => {
            setNamingFor(null);
            showToast(t('naming.folder.inherited'));
          }}
          onCustomized={() => {
            setNamingFor(null);
            showToast(t('naming.folder.customized'));
          }}
        />
      )}

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
          onVersions={() => setVersionsFor(fileMenu.file)}
          onSoon={() => showToast(t('documents.fileMenu.soon'))}
          canSubmitApproval={canSubmitApproval(fileMenu.file)}
          onSubmitApproval={() => openSubmitApproval(fileMenu.file)}
          canTransferZone={canTransferZone(fileMenu.file)}
          onTransferZone={() => openSubmitApproval(fileMenu.file)}
          canReturnToWip={canReturnToWip(fileMenu.file)}
          onReturnToWip={() => setReturnRequestFor(fileMenu.file)}
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

      {/* Modal danh sách phiên bản */}
      {versionsFor && (
        <FileVersionsModal
          fileItemId={versionsFor.id}
          fileName={versionsFor.name}
          currentVersionId={versionsFor.currentVersionId}
          onClose={() => setVersionsFor(null)}
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
          onClose={() => { setSubmitApprovalFor(null); setSubmitApprovalError(null); }}
          onSubmit={handleSubmitApproval}
        />
      )}

      {/* Danh sách chờ duyệt */}
      {pendingApprovalsOpen && (
        <PendingApprovalsModal
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
