import { useCallback } from 'react';

import type { FolderTreeNode } from '@/entities/folder';
import { CdeArea } from '@/entities/folder';
import { t } from '@/shared/lib/i18n';

interface FolderContextMenuProps {
  node: FolderTreeNode;
  x: number;
  y: number;
  onUpload: () => void;
  onCreateSub: () => void;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
  onPermission: () => void;
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
  node, x, y, onUpload, onCreateSub, onRename, onMove, onDelete, onPermission, onClose,
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
  const hasChildren = node.children.length > 0;
  // Upload chỉ ở khu vực WIP/Shared (Published/Archived bị BE chặn), ô con, có quyền ghi.
  const canUpload =
    !isRoot &&
    (node.area === CdeArea.Wip || node.area === CdeArea.Shared) &&
    (node.permission.canEdit || node.permission.canUpdate);

  const items: Item[] = [];

  // Phân quyền: có trên mọi thư mục (màn hình chỉ xem).
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

  if (canEdit) {
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
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
    });
    items.push({
      key: 'move',
      label: t('documents.menu.move'),
      onClick: onMove,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="5 9 2 12 5 15" /><polyline points="9 5 12 2 15 5" />
          <polyline points="15 19 12 22 9 19" /><polyline points="19 9 22 12 19 15" />
          <line x1="2" y1="12" x2="22" y2="12" /><line x1="12" y1="2" x2="12" y2="22" />
        </svg>
      ),
    });
    if (!hasChildren) {
      items.push({
        key: 'delete',
        label: t('documents.menu.delete'),
        danger: true,
        onClick: onDelete,
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        ),
      });
    }
  }

  return (
    <>
      {/* Overlay đóng menu khi bấm ra ngoài */}
      <div className="fixed inset-0 z-40" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div
        ref={clampRef}
        className="fixed z-50 min-w-44 animate-scale-in rounded-xl border border-card-border bg-card py-1.5 shadow-dropdown"
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
