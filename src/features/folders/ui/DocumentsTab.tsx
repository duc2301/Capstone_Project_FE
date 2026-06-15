import { useState } from 'react';

import type { EffectivePermission, FolderTreeNode } from '@/entities/folder';
import { t } from '@/shared/lib/i18n';

import { useFolderTree } from '../model/useFolderTree';
import { FolderTree } from './FolderTree';

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

export function DocumentsTab({ projectId }: DocumentsTabProps) {
  const { tree, loading, error } = useFolderTree(projectId);
  const [selected, setSelected] = useState<FolderTreeNode | null>(null);

  return (
    <div className="space-y-6">
      {/* Header: tiêu đề + hành động */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-2xl font-semibold text-primary">
          {t('projectDetail.tab.documents')}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-ghost"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {t('documents.upload')}
          </button>
          <button
            type="button"
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
          {/* Cây thư mục */}
          <FolderTree
            tree={tree}
            selectedId={selected?.id ?? null}
            onSelect={setSelected}
          />

          {/* Panel nội dung thư mục đang chọn */}
          <div className="rounded-(--radius-card) border border-card-border bg-card p-6 shadow-card">
            {!selected ? (
              <div className="flex h-full min-h-70 items-center justify-center">
                <p className="text-sm text-text-muted">{t('documents.selectFolder')}</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-3 border-b border-card-border pb-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                  </span>
                  <h3 className="font-display text-xl text-text">{selected.name}</h3>
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

                {/* Danh sách tệp (sẽ nối ở bước upload) */}
                <div className="rounded-2xl border border-dashed border-card-border bg-input-bg/40 p-12 text-center">
                  <p className="text-sm text-text-muted">{t('documents.fileListSoon')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
