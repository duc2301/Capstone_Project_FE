import { useMemo, useState } from 'react';

import type { FolderPermissionEntry, FolderTreeNode } from '@/entities/folder';
import { t } from '@/shared/lib/i18n';

import { useFolderPermissionUi } from '../model/useFolderPermissionUi';

interface FolderPermissionModalProps {
  node: FolderTreeNode;
  onClose: () => void;
}

/* 1 dòng ở panel trái: nhóm chưa gán quyền (availableGroups)
 * hoặc nhóm từng có quyền nhưng đã gỡ (selectedPermissions.status === 1). */
interface AvailableItem {
  key: string;
  groupName: string;
  organizationName: string | null;
}

/* Các cột quyền ở panel phải (theo thứ tự hiển thị) */
const PERMISSION_FLAGS: { key: keyof Pick<FolderPermissionEntry, 'canView' | 'canEdit' | 'canUpdate' | 'canDownload' | 'canVerify' | 'canApprove'>; label: () => string }[] = [
  { key: 'canView', label: () => t('folderPermission.col.view') },
  { key: 'canEdit', label: () => t('folderPermission.col.edit') },
  { key: 'canUpdate', label: () => t('folderPermission.col.update') },
  { key: 'canDownload', label: () => t('folderPermission.col.download') },
  { key: 'canVerify', label: () => t('folderPermission.col.verify') },
  { key: 'canApprove', label: () => t('folderPermission.col.approve') },
];

/* Lưới 1 dòng panel phải: tên nhóm + 6 cột quyền thẳng hàng với header */
const SELECTED_ROW_GRID = 'grid grid-cols-[minmax(0,1fr)_repeat(6,2.75rem)] items-center gap-x-1';

/* Ô tick chỉ đọc: xanh có ✓ khi được cấp, ô xám rỗng khi không */
function PermissionTick({ granted }: { granted: boolean }) {
  return (
    <span className="flex justify-center">
      {granted ? (
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-success text-white">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      ) : (
        <span className="h-5 w-5 rounded-md border-2 border-card-border bg-card" />
      )}
    </span>
  );
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('folderPermission.searchPlaceholder')}
        className="w-full rounded-(--radius-input) border border-input-border bg-input-bg py-2 pl-9 pr-3 text-sm text-text outline-none focus:border-input-focus"
      />
    </div>
  );
}

export function FolderPermissionModal({ node, onClose }: FolderPermissionModalProps) {
  const { data, loading, error } = useFolderPermissionUi(node.id);

  const [availableSearch, setAvailableSearch] = useState('');
  const [selectedSearch, setSelectedSearch] = useState('');

  // Panel trái: nhóm chưa gán quyền + nhóm đã gỡ quyền (status === 1)
  const availableItems = useMemo<AvailableItem[]>(() => {
    if (!data) return [];
    return [
      ...data.availableGroups.map((g) => ({
        key: g.projectParticipantId,
        groupName: g.groupName,
        organizationName: g.organizationName,
      })),
      ...data.selectedPermissions
        .filter((p) => p.status === 1)
        .map((p) => ({
          key: p.id,
          groupName: p.groupParticipantName,
          organizationName: null,
        })),
    ];
  }, [data]);

  // Panel phải: nhóm đang được gán quyền (status === 0)
  const selectedItems = useMemo(
    () => (data?.selectedPermissions ?? []).filter((p) => p.status === 0),
    [data],
  );

  // Lọc client-side theo tên nhóm / tên tổ chức
  const filteredAvailable = useMemo(() => {
    const q = availableSearch.trim().toLowerCase();
    if (!q) return availableItems;
    return availableItems.filter(
      (it) =>
        it.groupName.toLowerCase().includes(q) ||
        (it.organizationName ?? '').toLowerCase().includes(q),
    );
  }, [availableItems, availableSearch]);

  const filteredSelected = useMemo(() => {
    const q = selectedSearch.trim().toLowerCase();
    if (!q) return selectedItems;
    return selectedItems.filter((p) => p.groupParticipantName.toLowerCase().includes(q));
  }, [selectedItems, selectedSearch]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-5xl flex-col animate-scale-in rounded-(--radius-card-lg) bg-card shadow-modal">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-card-border px-6 py-4">
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-bold text-text">{t('folderPermission.title')}</h2>
            <p className="truncate text-xs text-text-muted">{node.name}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-content-bg hover:text-text">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <p className="py-16 text-center text-sm text-text-muted">{t('common.loading')}</p>
          ) : error ? (
            <p className="py-16 text-center text-sm text-danger">{error}</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1.4fr]">
              {/* Panel trái: Nhóm hữu dụng */}
              <section className="flex min-w-0 flex-col rounded-(--radius-card) border border-card-border bg-content-bg/40 p-4">
                <h3 className="text-sm font-bold text-text">{t('folderPermission.available.title')}</h3>
                <p className="mb-3 text-xs text-text-muted">
                  {t('folderPermission.chosen')} 0/{availableItems.length}
                </p>
                <SearchInput value={availableSearch} onChange={setAvailableSearch} />
                <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
                  {filteredAvailable.length === 0 ? (
                    <p className="py-8 text-center text-sm text-text-muted">
                      {t('folderPermission.available.empty')}
                    </p>
                  ) : (
                    filteredAvailable.map((it) => (
                      <div key={it.key} className="rounded-xl border border-card-border bg-card px-3.5 py-2.5 shadow-card">
                        <p className="truncate text-sm font-semibold text-text">{it.groupName}</p>
                        {it.organizationName && (
                          <p className="truncate text-xs text-text-muted">{it.organizationName}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Nút mũi tên ở giữa — placeholder, chưa có chức năng chuyển nhóm */}
              <div className="flex items-center justify-center gap-3 md:flex-col">
                <button
                  type="button"
                  disabled
                  title={t('documents.fileMenu.soon')}
                  className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full border border-card-border text-text-muted opacity-50"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-90 md:rotate-0">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
                <button
                  type="button"
                  disabled
                  title={t('documents.fileMenu.soon')}
                  className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full border border-card-border text-text-muted opacity-50"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-90 md:rotate-0">
                    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                  </svg>
                </button>
              </div>

              {/* Panel phải: Nhóm được chọn */}
              <section className="flex min-w-0 flex-col rounded-(--radius-card) border border-card-border bg-content-bg/40 p-4">
                <h3 className="text-sm font-bold text-text">{t('folderPermission.selected.title')}</h3>
                <p className="mb-3 text-xs text-text-muted">
                  {t('folderPermission.chosen')} {selectedItems.length}
                </p>
                <SearchInput value={selectedSearch} onChange={setSelectedSearch} />
                <div className="mt-3 max-h-80 overflow-y-auto pr-1">
                  {filteredSelected.length === 0 ? (
                    <p className="py-8 text-center text-sm text-text-muted">
                      {t('folderPermission.selected.empty')}
                    </p>
                  ) : (
                    <>
                      {/* Hàng tiêu đề cột quyền */}
                      <div className={`${SELECTED_ROW_GRID} border-b border-card-border pb-2`}>
                        <span />
                        {PERMISSION_FLAGS.map((f) => (
                          <span key={f.key} className="text-center text-[10px] font-bold leading-tight text-text-muted">
                            {f.label()}
                          </span>
                        ))}
                      </div>
                      {filteredSelected.map((p) => (
                        <div key={p.id} className={`${SELECTED_ROW_GRID} border-b border-card-border/60 py-2.5`}>
                          <p className="truncate pr-2 text-sm font-semibold text-text">{p.groupParticipantName}</p>
                          {PERMISSION_FLAGS.map((f) => (
                            <PermissionTick key={f.key} granted={p[f.key]} />
                          ))}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-card-border px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg">
            {t('documents.action.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
