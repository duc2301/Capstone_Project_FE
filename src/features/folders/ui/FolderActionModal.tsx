import { useMemo, useState } from 'react';

import type { FolderTreeNode } from '@/entities/folder';
import { t } from '@/shared/lib/i18n';

export type FolderAction = 'create' | 'rename' | 'move' | 'delete';

interface FolderActionModalProps {
  action: FolderAction;
  node: FolderTreeNode;
  tree: FolderTreeNode[];
  busy: boolean;
  onClose: () => void;
  /** create/rename -> name; move -> targetFolderId; delete -> undefined */
  onSubmit: (value?: string) => void;
}

/* Làm phẳng cây thành danh sách (kèm nhãn có thụt lề theo độ sâu) */
function flatten(nodes: FolderTreeNode[], depth = 0): { node: FolderTreeNode; depth: number }[] {
  return nodes.flatMap((n) => [{ node: n, depth }, ...flatten(n.children, depth + 1)]);
}

/* Tập id của node + toàn bộ hậu duệ (không cho di chuyển vào chính mình/con cháu) */
function collectSubtreeIds(node: FolderTreeNode): Set<string> {
  const ids = new Set<string>();
  const walk = (n: FolderTreeNode) => {
    ids.add(n.id);
    n.children.forEach(walk);
  };
  walk(node);
  return ids;
}

const TITLE: Record<FolderAction, () => string> = {
  create: () => t('documents.action.createTitle'),
  rename: () => t('documents.action.renameTitle'),
  move: () => t('documents.action.moveTitle'),
  delete: () => t('documents.action.deleteTitle'),
};

export function FolderActionModal({ action, node, tree, busy, onClose, onSubmit }: FolderActionModalProps) {
  const [name, setName] = useState(action === 'rename' ? node.name : '');
  const [targetId, setTargetId] = useState('');

  // Đích di chuyển hợp lệ: cùng khu vực, có quyền Sửa, không phải node/hậu duệ, không phải cha hiện tại.
  const moveTargets = useMemo(() => {
    if (action !== 'move') return [];
    const blocked = collectSubtreeIds(node);
    return flatten(tree)
      .filter(({ node: n }) =>
        n.area === node.area &&
        n.permission.canEdit &&
        !blocked.has(n.id) &&
        n.id !== node.parentFolderId,
      );
  }, [action, node, tree]);

  const canSubmit = (() => {
    if (busy) return false;
    if (action === 'create' || action === 'rename') return name.trim().length > 0;
    if (action === 'move') return targetId.length > 0;
    return true; // delete
  })();

  const handleSubmit = () => {
    if (action === 'create' || action === 'rename') onSubmit(name.trim());
    else if (action === 'move') onSubmit(targetId);
    else onSubmit();
  };

  const submitLabel =
    action === 'create' ? t('documents.action.create')
    : action === 'rename' ? t('documents.action.save')
    : action === 'move' ? t('documents.action.confirmMove')
    : t('documents.action.confirmDelete');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md animate-scale-in rounded-(--radius-card-lg) bg-card shadow-modal">
        <div className="flex items-center justify-between border-b border-card-border px-6 py-4">
          <h2 className="font-heading text-lg font-bold text-text">{TITLE[action]()}</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-content-bg hover:text-text">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {action === 'create' && (
            <p className="text-sm text-text-muted">
              {t('documents.action.parentLabel')}: <span className="font-semibold text-text">{node.name}</span>
            </p>
          )}

          {(action === 'create' || action === 'rename') && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{t('documents.action.nameLabel')}</span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && canSubmit) handleSubmit(); }}
                placeholder={t('documents.action.namePlaceholder')}
                className="rounded-(--radius-input) border border-input-border bg-input-bg px-3.5 py-2.5 text-sm text-text outline-none focus:border-input-focus"
              />
            </label>
          )}

          {action === 'move' && (
            moveTargets.length === 0 ? (
              <p className="rounded-xl border border-dashed border-card-border bg-input-bg/40 p-4 text-center text-sm text-text-muted">
                {t('documents.action.moveEmpty')}
              </p>
            ) : (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{t('documents.action.moveLabel')}</span>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="rounded-(--radius-input) border border-input-border bg-input-bg px-3.5 py-2.5 text-sm text-text outline-none focus:border-input-focus"
                >
                  <option value="">—</option>
                  {moveTargets.map(({ node: n, depth }) => (
                    <option key={n.id} value={n.id}>{' '.repeat(depth * 2) + n.name}</option>
                  ))}
                </select>
              </label>
            )
          )}

          {action === 'delete' && (
            <div className="space-y-2">
              <p className="text-sm text-text">
                {t('documents.action.deleteTitle')}: <span className="font-semibold">{node.name}</span>
              </p>
              <p className="text-sm text-danger">{t('documents.action.deleteWarning')}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-card-border px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg">
            {t('documents.action.cancel')}
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className={`rounded-xl px-5 py-2 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${action === 'delete' ? 'bg-danger hover:bg-danger/90' : 'bg-primary hover:bg-primary-hover'}`}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
