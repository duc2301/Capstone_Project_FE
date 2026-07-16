import { useState } from 'react';

import type { FolderTreeNode } from '@/entities/folder';
import type { NamingConvention } from '@/entities/naming-convention';
import { namingConventionApi } from '@/entities/naming-convention';
import { FolderTree, useFolderTree } from '@/features/folders';
import { getApiErrorMessage } from '@/shared/api';
import { Modal } from '@/shared/components/modal';
import { t } from '@/shared/lib/i18n';

interface AssignFolderModalProps {
  convention: NamingConvention;
  projectId: string;
  onClose: () => void;
  onAssigned: (convention: NamingConvention) => void;
}

/* Chọn 1 thư mục trong cây (tùy chọn áp cho cả cây con) để gán bộ quy tắc. */
export function AssignFolderModal({ convention, projectId, onClose, onAssigned }: AssignFolderModalProps) {
  const { tree, loading } = useFolderTree(projectId);
  const [selected, setSelected] = useState<FolderTreeNode | null>(null);
  const [applySub, setApplySub] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssign = async () => {
    if (!selected) {
      setError(t('naming.assign.pickFolder'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { data } = await namingConventionApi.assignFolders(convention.id, {
        folderIds: [selected.id],
        applyToSubfolders: applySub,
      });
      if (data.result) onAssigned(data.result);
    } catch (err) {
      setError(getApiErrorMessage(err, t('common.error')));
      setBusy(false);
    }
  };

  return (
    <Modal title={t('naming.assign.title')} onClose={busy ? () => undefined : onClose} maxWidth="max-w-lg">
      <div className="space-y-4">
        <p className="text-sm text-text-muted">{t('naming.assign.desc')}</p>

        {loading ? (
          <p className="py-8 text-center text-sm text-text-muted">{t('common.loading')}</p>
        ) : (
          <FolderTree tree={tree} selectedId={selected?.id ?? null} onSelect={setSelected} />
        )}

        <label className="flex items-center gap-2.5 text-sm font-medium text-text">
          <input
            type="checkbox"
            checked={applySub}
            onChange={(e) => setApplySub(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          {t('naming.assign.subfolders')}
        </label>

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
            onClick={() => void handleAssign()}
            disabled={busy || !selected}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? t('common.loading') : t('naming.assign.submit')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
