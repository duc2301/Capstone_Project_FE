import { useMemo, useState } from 'react';

import type { FolderTreeNode } from '@/entities/folder';
import { CdeArea } from '@/entities/folder';
import type { NamingConvention } from '@/entities/naming-convention';
import { namingConventionApi } from '@/entities/naming-convention';
import { useFolderTree } from '@/features/folders';
import { getApiErrorMessage } from '@/shared/api';
import { Modal } from '@/shared/components/modal';
import { t } from '@/shared/lib/i18n';

interface ApplyConventionModalProps {
  convention: NamingConvention;
  projectId: string;
  onClose: () => void;
  onApplied: (convention: NamingConvention) => void;
}

/* Gom toàn bộ id trong 1 cây con. */
function collectIds(node: FolderTreeNode, into: string[] = []): string[] {
  into.push(node.id);
  node.children.forEach((c) => collectIds(c, into));
  return into;
}

/* 1 dòng checkbox trong cây WIP. */
function CheckNode({
  node, depth, checked, assignedIds, onToggle,
}: {
  node: FolderTreeNode;
  depth: number;
  checked: Set<string>;
  assignedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <>
      <label
        style={{ paddingLeft: 8 + depth * 20 }}
        className="flex cursor-pointer items-center gap-2.5 rounded-lg py-1.5 pr-2 transition-colors hover:bg-content-bg"
      >
        <input
          type="checkbox"
          checked={checked.has(node.id)}
          onChange={() => onToggle(node.id)}
          className="h-4 w-4 shrink-0 accent-primary"
        />
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-muted">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
        <span className="truncate text-sm text-text">{node.name}</span>
        {assignedIds.has(node.id) && (
          <span title={t('naming.apply.appliedDot')} className="h-2 w-2 shrink-0 rounded-full bg-success" />
        )}
      </label>
      {node.children.map((child) => (
        <CheckNode key={child.id} node={child} depth={depth + 1} checked={checked} assignedIds={assignedIds} onToggle={onToggle} />
      ))}
    </>
  );
}

/* Áp bộ quy tắc vào NHIỀU thư mục cùng lúc — chỉ vùng WIP (file chỉ upload được vào WIP,
 * các vùng sau đi qua luồng phê duyệt nên tên đã chuẩn từ gốc). */
export function ApplyConventionModal({ convention, projectId, onClose, onApplied }: ApplyConventionModalProps) {
  const { tree, loading } = useFolderTree(projectId);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [applySub, setApplySub] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wipRoot = useMemo(
    () => tree.find((n) => n.parentFolderId === null && n.area === CdeArea.Wip) ?? null,
    [tree],
  );
  const assignedIds = useMemo(
    () => new Set(convention.assignedFolders.map((f) => f.id)),
    [convention.assignedFolders],
  );

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectAll = () => {
    if (wipRoot) setChecked(new Set(collectIds(wipRoot)));
  };

  const handleApply = async () => {
    if (checked.size === 0) {
      setError(t('naming.apply.pick'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { data } = await namingConventionApi.assignFolders(convention.id, {
        folderIds: [...checked],
        applyToSubfolders: applySub,
      });
      if (data.result) onApplied(data.result);
    } catch (err) {
      setError(getApiErrorMessage(err, t('common.error')));
      setBusy(false);
    }
  };

  return (
    <Modal title={t('naming.apply.title')} onClose={busy ? () => undefined : onClose} maxWidth="max-w-lg">
      <div className="space-y-4">
        <p className="text-sm text-text-muted">{t('naming.apply.desc')}</p>

        {loading ? (
          <p className="py-8 text-center text-sm text-text-muted">{t('common.loading')}</p>
        ) : !wipRoot ? (
          <p className="rounded-xl border border-danger/20 bg-danger-light px-4 py-3 text-sm font-medium text-danger">
            {t('naming.apply.noWip')}
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary-ghost"
              >
                {t('naming.apply.selectAll')}
              </button>
              <button
                type="button"
                onClick={() => setChecked(new Set())}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-content-bg"
              >
                {t('naming.apply.clear')}
              </button>
              <span className="ml-auto text-xs text-text-muted">{checked.size} {t('naming.foldersUnit')}</span>
            </div>

            <div className="max-h-72 overflow-y-auto rounded-(--radius-card) border border-card-border bg-card p-2">
              <CheckNode node={wipRoot} depth={0} checked={checked} assignedIds={assignedIds} onToggle={toggle} />
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-text">
              <input
                type="checkbox"
                checked={applySub}
                onChange={(e) => setApplySub(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              {t('naming.apply.subfolders')}
            </label>
          </>
        )}

        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        <div className="flex justify-end gap-3 border-t border-card-border pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg disabled:opacity-40"
          >
            {t('naming.cancel')}
          </button>
          <button
            type="button"
            onClick={() => void handleApply()}
            disabled={busy || checked.size === 0}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? t('common.loading') : t('naming.apply.submit')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
