import { useMemo, useState } from 'react';

import type { FolderTreeNode } from '@/entities/folder';
import { t } from '@/shared/lib/i18n';

interface FolderTreeProps {
  tree: FolderTreeNode[];
  selectedId: string | null;
  onSelect: (node: FolderTreeNode) => void;
  onContextMenu?: (e: React.MouseEvent, node: FolderTreeNode) => void;
}

/* Icon: folder */
function FolderIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/* Icon: chevron (xoay khi mở) */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

interface FolderNodeProps {
  node: FolderTreeNode;
  depth: number;
  selectedId: string | null;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelect: (node: FolderTreeNode) => void;
  onContextMenu?: (e: React.MouseEvent, node: FolderTreeNode) => void;
}

function FolderNode({ node, depth, selectedId, expandedIds, onToggleExpand, onSelect, onContextMenu }: FolderNodeProps) {
  const hasChildren = node.children.length > 0;
  const isRoot = depth === 0;
  const open = expandedIds.has(node.id);
  const isSelected = node.id === selectedId;

  // Khu vực gốc hiển thị "01 WIP / 02 Shared / …"
  const label = isRoot ? `${String(node.area + 1).padStart(2, '0')} ${node.name}` : node.name;

  return (
    <li>
      <div
        onContextMenu={(e) => onContextMenu?.(e, node)}
        style={{ paddingLeft: 12 + depth * 18 }}
        className={`flex w-full items-center gap-2 rounded-xl pr-2.5 text-sm transition-colors ${
          isSelected
            ? 'bg-primary-light font-semibold text-primary'
            : isRoot
              ? 'font-semibold text-text hover:bg-content-bg'
              : 'font-medium text-text-secondary hover:bg-content-bg'
        }`}
      >
        {/* Chỉ bấm mũi tên mới đóng/mở nhánh — bấm tên folder chỉ chọn folder */}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggleExpand(node.id)}
            aria-label={open ? t('documents.tree.collapse') : t('documents.tree.expand')}
            className="flex h-6 w-3.5 shrink-0 items-center justify-center text-text-muted transition-colors hover:text-text"
          >
            <Chevron open={open} />
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <button
          type="button"
          onClick={() => onSelect(node)}
          className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left"
        >
          <FolderIcon className={isSelected ? 'text-primary' : isRoot ? 'text-primary/80' : 'text-text-muted'} />
          <span className="truncate">{label}</span>
          {node.hasWarning && (
            <span title={t('fileWarn.folderTooltip')} className="ml-auto shrink-0 text-danger">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
          )}
        </button>
      </div>

      {hasChildren && open && (
        <ul className="mt-0.5 space-y-0.5">
          {node.children.map((child) => (
            <FolderNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function FolderTree({ tree, selectedId, onSelect, onContextMenu }: FolderTreeProps) {
  // id -> parentFolderId, để tìm chuỗi tổ tiên của folder đang chọn
  const parentById = useMemo(() => {
    const map = new Map<string, string | null>();
    const walk = (nodes: FolderTreeNode[]) => {
      for (const n of nodes) {
        map.set(n.id, n.parentFolderId);
        walk(n.children);
      }
    };
    walk(tree);
    return map;
  }, [tree]);

  // Khu vực gốc mở sẵn; các nhánh khác đóng/mở bằng nút mũi tên
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(tree.map((n) => n.id)));

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Khi folder được chọn từ nơi khác (vd: bấm thư mục con trong panel nội dung),
  // mở sẵn chuỗi tổ tiên để folder đó hiện ra trên cây.
  const [revealedId, setRevealedId] = useState<string | null>(null);
  if (selectedId !== revealedId) {
    setRevealedId(selectedId);
    if (selectedId) {
      const ancestors: string[] = [];
      let cur = parentById.get(selectedId) ?? null;
      while (cur) {
        ancestors.push(cur);
        cur = parentById.get(cur) ?? null;
      }
      if (ancestors.some((id) => !expandedIds.has(id))) {
        setExpandedIds((prev) => {
          const next = new Set(prev);
          ancestors.forEach((id) => next.add(id));
          return next;
        });
      }
    }
  }

  return (
    <div className="rounded-(--radius-card) border border-card-border bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center gap-2 px-1">
        <FolderIcon className="text-text-muted" />
        <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
          {t('documents.structure')}
        </span>
      </div>

      {tree.length === 0 ? (
        <p className="px-2 py-6 text-center text-sm text-text-muted">{t('documents.empty')}</p>
      ) : (
        <ul className="space-y-0.5">
          {tree.map((node) => (
            <FolderNode
              key={node.id}
              node={node}
              depth={0}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onToggleExpand={toggleExpand}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
