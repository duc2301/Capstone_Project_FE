import { useState } from 'react';

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
  onSelect: (node: FolderTreeNode) => void;
  onContextMenu?: (e: React.MouseEvent, node: FolderTreeNode) => void;
}

function FolderNode({ node, depth, selectedId, onSelect, onContextMenu }: FolderNodeProps) {
  const hasChildren = node.children.length > 0;
  const isRoot = depth === 0;
  const [open, setOpen] = useState(isRoot); // khu vực gốc mở sẵn
  const isSelected = node.id === selectedId;

  // Khu vực gốc hiển thị "01 WIP / 02 Shared / …"
  const label = isRoot ? `${String(node.area + 1).padStart(2, '0')} ${node.name}` : node.name;

  return (
    <li>
      <button
        type="button"
        onClick={() => {
          onSelect(node);
          if (hasChildren) setOpen((v) => !v);
        }}
        onContextMenu={(e) => onContextMenu?.(e, node)}
        style={{ paddingLeft: 12 + depth * 18 }}
        className={`flex w-full items-center gap-2 rounded-xl py-2 pr-2.5 text-left text-sm transition-colors ${
          isSelected
            ? 'bg-primary-light font-semibold text-primary'
            : isRoot
              ? 'font-semibold text-text hover:bg-content-bg'
              : 'font-medium text-text-secondary hover:bg-content-bg'
        }`}
      >
        <span className="w-3.5 shrink-0">{hasChildren ? <Chevron open={open} /> : null}</span>
        <FolderIcon className={isSelected ? 'text-primary' : isRoot ? 'text-primary/80' : 'text-text-muted'} />
        <span className="truncate">{label}</span>
      </button>

      {hasChildren && open && (
        <ul className="mt-0.5 space-y-0.5">
          {node.children.map((child) => (
            <FolderNode key={child.id} node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} onContextMenu={onContextMenu} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function FolderTree({ tree, selectedId, onSelect, onContextMenu }: FolderTreeProps) {
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
            <FolderNode key={node.id} node={node} depth={0} selectedId={selectedId} onSelect={onSelect} onContextMenu={onContextMenu} />
          ))}
        </ul>
      )}
    </div>
  );
}
