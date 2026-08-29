import { useCallback } from 'react';

import type { FolderTreeNode } from '@/entities/folder';
import { CdeArea } from '@/entities/folder';
import { DeleteIcon, EditIcon } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

interface FolderContextMenuProps {
  node: FolderTreeNode;
  x: number;
  y: number;
  onUpload: () => void;
  onCreateSub: () => void;
  onRename: () => void;
  onDelete: () => void;
  onPermission: () => void;
  /** Được phép hiển thị mục "Phân quyền" — Leader ở Published/Archived và Member đều bị ẩn. */
  canPermission: boolean;
  onPermissionUsers: () => void;
  onNaming: () => void;
  onClose: () => void;
}

interface Item {
  key: string;
  label: string;
  danger?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

export function FolderContextMenu({
  node, x, y, onUpload, onCreateSub, onRename, onDelete, onPermission, canPermission, onPermissionUsers, onNaming, onClose,
}: FolderContextMenuProps) {
  // Giữ menu trong viewport: đo kích thước thật rồi lật vào trong nếu tràn phải/dưới.
  const clampRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const pad = 8;
    const { width, height } = el.getBoundingClientRect();
    el.style.left = `${Math.max(pad, Math.min(x, window.innerWidth - width - pad))}px`;
    el.style.top = `${Math.max(pad, Math.min(y, window.innerHeight - height - pad))}px`;
  }, [x, y]);

  const canEdit = node.permission.canEdit;
  const isRoot = node.parentFolderId === null;
  // Upload chỉ ở khu vực WIP/Shared (Published/Archived bị BE chặn), ô con, có quyền ghi.
  const canUpload =
    !isRoot &&
    (node.area === CdeArea.Wip || node.area === CdeArea.Shared) &&
    node.permission.canEdit;

  const items: Item[] = [];

  // Phân quyền: chỉ trên thư mục con — thư mục gốc (WIP/Shared/Published/Archived) không phân quyền.
  // Ẩn thêm với Leader ở vùng Published/Archived và với Member (canPermission do trang cha quyết).
  if (!isRoot && canPermission) {
    items.push({
      key: 'permission',
      label: t('documents.menu.permission'),
      onClick: onPermission,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    });
    items.push({
      key: 'permissionUsers',
      label: t('documents.menu.permissionUsers'),
      onClick: onPermissionUsers,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    });
  }

  // Quy tắc đặt tên: xem quy tắc đang áp + kế thừa từ thư mục cha (leader/quyền ghi).
  if (canEdit && !isRoot) {
    items.push({
      key: 'naming',
      label: t('naming.folder.menu'),
      onClick: onNaming,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" />
        </svg>
      ),
    });
  }

  if (canUpload) {
    items.push({
      key: 'upload',
      label: t('documents.upload'),
      onClick: onUpload,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      ),
    });
  }

  // Tạo thư mục con chỉ ở khu vực WIP — Shared/Published/Archived bị cấm.
  if (canEdit && node.area === CdeArea.Wip) {
    items.push({
      key: 'create',
      label: t('documents.menu.createSub'),
      onClick: onCreateSub,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          <line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" />
        </svg>
      ),
    });
  }
  if (canEdit && !isRoot) {
    items.push({
      key: 'rename',
      label: t('documents.menu.rename'),
      onClick: onRename,
      icon: <EditIcon size={15} />,
    });
    items.push({
      key: 'delete',
      label: t('documents.menu.delete'),
      danger: true,
      onClick: onDelete,
      icon: <DeleteIcon size={15} />,
    });
  }

  return (
    <>
      {/* Overlay đóng menu khi bấm ra ngoài */}
      <div className="fixed inset-0 z-40" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div
        ref={clampRef}
        className="fixed z-50 min-w-44 animate-scale-in rounded-[var(--radius-card)] border border-card-border bg-card py-1.5 shadow-dropdown"
        style={{ top: y, left: x }}
      >
        {items.length === 0 ? (
          <p className="px-4 py-2 text-xs text-text-muted">{t('documents.menu.noActions')}</p>
        ) : (
          items.map((it) => (
            <button
              key={it.key}
              type="button"
              onClick={() => { it.onClick(); onClose(); }}
              className={`flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors ${
                it.danger
                  ? 'text-danger hover:bg-danger-light'
                  : 'text-text-secondary hover:bg-content-bg hover:text-text'
              }`}
            >
              {it.icon}
              {it.label}
            </button>
          ))
        )}
      </div>
    </>
  );
}
