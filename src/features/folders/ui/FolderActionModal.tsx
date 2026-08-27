import { useMemo, useState } from 'react';

import type { FolderTreeNode } from '@/entities/folder';
import { t } from '@/shared/lib/i18n';

export type FolderAction = 'create' | 'rename' | 'delete';

interface FolderActionModalProps {
  action: FolderAction;
  node: FolderTreeNode;
  siblings: FolderTreeNode[];
  busy: boolean;
  onClose: () => void;
  onSubmit: (value?: string) => void;
}

function countDescendants(node: FolderTreeNode): number {
  return node.children.reduce((total, child) => total + 1 + countDescendants(child), 0);
}

const TITLE: Record<FolderAction, () => string> = {
  create: () => t('documents.action.createTitle'),
  rename: () => t('documents.action.renameTitle'),
  delete: () => t('documents.action.deleteTitle'),
};

export function FolderActionModal({ action, node, siblings, busy, onClose, onSubmit }: Readonly<FolderActionModalProps>) {
  const [name, setName] = useState(action === 'rename' ? node.name : '');
  const descendantCount = useMemo(
    () => (action === 'delete' ? countDescendants(node) : 0),
    [action, node],
  );

  const takenNames = useMemo(
    () => siblings
      .filter((sibling) => sibling.id !== node.id)
      .map((sibling) => sibling.name.trim().toLowerCase()),
    [siblings, node.id],
  );

  const trimmedName = name.trim();
  const isDuplicate = trimmedName.length > 0 && takenNames.includes(trimmedName.toLowerCase());

  const canSubmit = (() => {
    if (busy) return false;
    if (action === 'create' || action === 'rename') return trimmedName.length > 0 && !isDuplicate;
    return true;
  })();

  const handleSubmit = () => {
    if (action === 'create' || action === 'rename') onSubmit(trimmedName);
    else onSubmit();
  };

  const submitLabel =
    action === 'create' ? t('documents.action.create')
    : action === 'rename' ? t('documents.action.save')
    : t('documents.action.confirmDelete');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md animate-scale-in rounded-[var(--radius-card-lg)] bg-card shadow-modal">
        <div className="flex items-center justify-between border-b border-card-border px-6 py-4">
          <h2 className="heading-entity">{TITLE[action]()}</h2>
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
              <span className="field-label">{t('documents.action.nameLabel')}</span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && canSubmit) handleSubmit(); }}
                placeholder={t('documents.action.namePlaceholder')}
                className="field-input"
                aria-invalid={isDuplicate}
              />
              {isDuplicate && (
                <span className="text-xs font-medium text-danger">
                  {t('documents.action.duplicateNameInline')}
                </span>
              )}
            </label>
          )}

          {action === 'delete' && (
            <div className="space-y-2">
              <p className="text-sm text-text">
                {t('documents.action.deleteTitle')}: <span className="font-semibold">{node.name}</span>
              </p>
              {descendantCount > 0 && (
                <p className="text-sm text-text-secondary">
                  {t('documents.action.deleteSubFolders').replace('{count}', String(descendantCount))}
                </p>
              )}
              <p className="text-sm text-text-secondary">{t('documents.action.deleteAllZones')}</p>
              <p className="text-sm text-danger">{t('documents.action.deleteWarning')}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-card-border px-6 py-4">
          <button type="button" onClick={onClose} className="btn-modal-ghost">
            {t('documents.action.cancel')}
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className={action === 'delete' ? 'btn-modal-danger' : 'btn-modal-primary'}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
