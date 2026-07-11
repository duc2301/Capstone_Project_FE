import { useMemo, useState } from 'react';

import type { FolderPermissionUiDto, FolderTreeNode } from '@/entities/folder';
import { folderApi } from '@/entities/folder';
import { t } from '@/shared/lib/i18n';

import { useFolderPermissionUi } from '../model/useFolderPermissionUi';

interface FolderPermissionModalProps {
  node: FolderTreeNode;
  onClose: () => void;
  /** Gọi sau khi lưu thành công — modal vẫn mở, caller hiển thị thông báo. */
  onSaved?: () => void;
}

type PermissionFlagKey = 'canView' | 'canEdit' | 'canUpdate' | 'canDownload' | 'canVerify' | 'canApprove';

/* 1 nhóm trong modal — di chuyển giữa 2 panel, giữ nguyên cờ quyền khi di chuyển */
interface PermissionItem {
  projectParticipantId: string;
  groupName: string;
  organizationName: string | null;
  canView: boolean;
  canEdit: boolean;
  canUpdate: boolean;
  canDownload: boolean;
  canVerify: boolean;
  canApprove: boolean;
  /** Đang có quyền trên BE (status === 0) — nếu kết thúc ở panel trái thì đưa vào removeParticipantIds */
  wasSelected: boolean;
}

/* Các cột quyền ở panel phải (theo thứ tự hiển thị) */
const PERMISSION_FLAGS: { key: PermissionFlagKey; label: () => string }[] = [
  { key: 'canView', label: () => t('folderPermission.col.view') },
  { key: 'canEdit', label: () => t('folderPermission.col.edit') },
  { key: 'canUpdate', label: () => t('folderPermission.col.update') },
  { key: 'canDownload', label: () => t('folderPermission.col.download') },
  { key: 'canVerify', label: () => t('folderPermission.col.verify') },
  { key: 'canApprove', label: () => t('folderPermission.col.approve') },
];

const EMPTY_FLAGS = {
  canView: false,
  canEdit: false,
  canUpdate: false,
  canDownload: false,
  canVerify: false,
  canApprove: false,
};

/* Panel trái ban đầu: nhóm chưa gán quyền + nhóm đã gỡ quyền (status === 1) */
function buildInitialAvailable(data: FolderPermissionUiDto): PermissionItem[] {
  return [
    ...data.availableGroups.map((g) => ({
      projectParticipantId: g.projectParticipantId,
      groupName: g.groupName,
      organizationName: g.organizationName,
      ...EMPTY_FLAGS,
      wasSelected: false,
    })),
    ...data.selectedPermissions
      .filter((p) => p.status === 1)
      .map((p) => ({
        projectParticipantId: p.projectParticipantId,
        groupName: p.groupParticipantName,
        organizationName: null,
        ...EMPTY_FLAGS,
        wasSelected: false,
      })),
  ];
}

/* Panel phải ban đầu: nhóm đang được gán quyền (status === 0) */
function buildInitialSelected(data: FolderPermissionUiDto): PermissionItem[] {
  return data.selectedPermissions
    .filter((p) => p.status === 0)
    .map((p) => ({
      projectParticipantId: p.projectParticipantId,
      groupName: p.groupParticipantName,
      organizationName: null,
      canView: p.canView,
      canEdit: p.canEdit,
      canUpdate: p.canUpdate,
      canDownload: p.canDownload,
      canVerify: p.canVerify,
      canApprove: p.canApprove,
      wasSelected: true,
    }));
}

/* Lưới 1 dòng panel phải: ô chọn + tên nhóm + 6 cột quyền thẳng hàng với header */
const SELECTED_ROW_GRID = 'grid grid-cols-[1.5rem_minmax(0,1fr)_repeat(6,2.75rem)] items-center gap-x-1';

/* Ô đánh dấu chọn nhóm (để di chuyển giữa 2 panel) */
function SelectBox({ checked }: { checked: boolean }) {
  return checked ? (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary text-white">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  ) : (
    <span className="h-5 w-5 shrink-0 rounded-md border-2 border-card-border bg-card" />
  );
}

/* Ô tick quyền: bấm để cấp/gỡ quyền của nhóm ở panel phải */
function PermissionTick({ granted, onToggle }: { granted: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="group flex justify-center">
      {granted ? (
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-success text-white transition-opacity group-hover:opacity-80">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      ) : (
        <span className="h-5 w-5 rounded-md border-2 border-card-border bg-card transition-colors group-hover:border-success" />
      )}
    </button>
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

function matchesQuery(item: PermissionItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    item.groupName.toLowerCase().includes(q) ||
    (item.organizationName ?? '').toLowerCase().includes(q)
  );
}

function toggleInSet(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

interface PermissionEditorProps {
  folderId: string;
  data: FolderPermissionUiDto;
  onClose: () => void;
  onSaved?: () => void;
}

/* Phần thân + footer của modal khi đã có dữ liệu — mount 1 lần nên khởi tạo state từ data. */
function PermissionEditor({ folderId, data, onClose, onSaved }: PermissionEditorProps) {
  const [available, setAvailable] = useState<PermissionItem[]>(() => buildInitialAvailable(data));
  const [selected, setSelected] = useState<PermissionItem[]>(() => buildInitialSelected(data));
  const [availableChecked, setAvailableChecked] = useState<Set<string>>(new Set());
  const [selectedChecked, setSelectedChecked] = useState<Set<string>>(new Set());
  const [availableSearch, setAvailableSearch] = useState('');
  const [selectedSearch, setSelectedSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const filteredAvailable = useMemo(
    () => available.filter((it) => matchesQuery(it, availableSearch)),
    [available, availableSearch],
  );
  const filteredSelected = useMemo(
    () => selected.filter((it) => matchesQuery(it, selectedSearch)),
    [selected, selectedSearch],
  );

  // Chuyển các nhóm đã đánh dấu ở panel trái sang "Nhóm được chọn"
  const moveToSelected = () => {
    if (availableChecked.size === 0) return;
    setSelected((prev) => [...prev, ...available.filter((it) => availableChecked.has(it.projectParticipantId))]);
    setAvailable((prev) => prev.filter((it) => !availableChecked.has(it.projectParticipantId)));
    setAvailableChecked(new Set());
  };

  // Chuyển các nhóm đã đánh dấu ở panel phải về "Nhóm hữu dụng"
  const moveToAvailable = () => {
    if (selectedChecked.size === 0) return;
    setAvailable((prev) => [...prev, ...selected.filter((it) => selectedChecked.has(it.projectParticipantId))]);
    setSelected((prev) => prev.filter((it) => !selectedChecked.has(it.projectParticipantId)));
    setSelectedChecked(new Set());
  };

  const togglePermission = (participantId: string, key: PermissionFlagKey) => {
    setSelected((prev) =>
      prev.map((it) =>
        it.projectParticipantId === participantId ? { ...it, [key]: !it[key] } : it,
      ),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await folderApi.updateGroupPermissions({
        id: folderId,
        groupsPermission: selected.map((it) => ({
          projectParticipantId: it.projectParticipantId,
          canView: it.canView,
          canEdit: it.canEdit,
          canUpdate: it.canUpdate,
          canDownload: it.canDownload,
          canVerify: it.canVerify,
          canApprove: it.canApprove,
        })),
        removeParticipantIds: available
          .filter((it) => it.wasSelected)
          .map((it) => it.projectParticipantId),
      });
      // Modal giữ nguyên sau khi lưu — chốt lại trạng thái vừa lưu làm mốc mới,
      // để lần "Cập nhật" kế tiếp không gửi lại removeParticipantIds cũ.
      // Nhóm bị gỡ quyền đã bị BE reset toàn bộ cờ về false, nên xoá cờ cũ
      // ở panel trái để khi thêm lại các ô quyền đều trống.
      setSelected((prev) => prev.map((it) => ({ ...it, wasSelected: true })));
      setAvailable((prev) => prev.map((it) => ({ ...it, ...EMPTY_FLAGS, wasSelected: false })));
      onSaved?.();
    } catch {
      setSaveError(t('folderPermission.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1.4fr]">
          {/* Panel trái: Nhóm hữu dụng */}
          <section className="flex min-w-0 flex-col rounded-(--radius-card) border border-card-border bg-content-bg/40 p-4">
            <h3 className="text-sm font-bold text-text">{t('folderPermission.available.title')}</h3>
            <p className="mb-3 text-xs text-text-muted">
              {t('folderPermission.chosen')} {availableChecked.size}/{available.length}
            </p>
            <SearchInput value={availableSearch} onChange={setAvailableSearch} />
            <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
              {filteredAvailable.length === 0 ? (
                <p className="py-8 text-center text-sm text-text-muted">
                  {t('folderPermission.available.empty')}
                </p>
              ) : (
                filteredAvailable.map((it) => {
                  const checked = availableChecked.has(it.projectParticipantId);
                  return (
                    <button
                      key={it.projectParticipantId}
                      type="button"
                      onClick={() => setAvailableChecked((prev) => toggleInSet(prev, it.projectParticipantId))}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left shadow-card transition-colors ${
                        checked ? 'border-primary bg-primary-light' : 'border-card-border bg-card hover:bg-content-bg'
                      }`}
                    >
                      <SelectBox checked={checked} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-text">{it.groupName}</span>
                        {it.organizationName && (
                          <span className="block truncate text-xs text-text-muted">{it.organizationName}</span>
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Nút mũi tên di chuyển nhóm giữa 2 panel */}
          <div className="flex items-center justify-center gap-3 md:flex-col">
            <button
              type="button"
              disabled={availableChecked.size === 0}
              onClick={moveToSelected}
              title={t('folderPermission.moveRight')}
              className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                availableChecked.size > 0
                  ? 'border-primary bg-primary text-white hover:bg-primary-hover'
                  : 'cursor-not-allowed border-card-border text-text-muted opacity-50'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-90 md:rotate-0">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            <button
              type="button"
              disabled={selectedChecked.size === 0}
              onClick={moveToAvailable}
              title={t('folderPermission.moveLeft')}
              className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                selectedChecked.size > 0
                  ? 'border-primary bg-primary text-white hover:bg-primary-hover'
                  : 'cursor-not-allowed border-card-border text-text-muted opacity-50'
              }`}
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
              {t('folderPermission.chosen')} {selectedChecked.size}/{selected.length}
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
                    <span />
                    {PERMISSION_FLAGS.map((f) => (
                      <span key={f.key} className="text-center text-[10px] font-bold leading-tight text-text-muted">
                        {f.label()}
                      </span>
                    ))}
                  </div>
                  {filteredSelected.map((it) => {
                    const checked = selectedChecked.has(it.projectParticipantId);
                    return (
                      <div key={it.projectParticipantId} className={`${SELECTED_ROW_GRID} border-b border-card-border/60 py-2.5`}>
                        <button
                          type="button"
                          onClick={() => setSelectedChecked((prev) => toggleInSet(prev, it.projectParticipantId))}
                          className="flex justify-center"
                        >
                          <SelectBox checked={checked} />
                        </button>
                        <p className="truncate pr-2 text-sm font-semibold text-text">{it.groupName}</p>
                        {PERMISSION_FLAGS.map((f) => (
                          <PermissionTick
                            key={f.key}
                            granted={it[f.key]}
                            onToggle={() => togglePermission(it.projectParticipantId, f.key)}
                          />
                        ))}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-card-border px-6 py-4">
        {saveError && <p className="mr-auto text-sm text-danger">{saveError}</p>}
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg"
        >
          {t('documents.action.cancel')}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? t('folderPermission.saving') : t('folderPermission.update')}
        </button>
      </div>
    </>
  );
}

export function FolderPermissionModal({ node, onClose, onSaved }: FolderPermissionModalProps) {
  const { data, loading, error } = useFolderPermissionUi(node.id);

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

        {loading || error || !data ? (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {loading ? (
                <p className="py-16 text-center text-sm text-text-muted">{t('common.loading')}</p>
              ) : (
                <p className="py-16 text-center text-sm text-danger">{error ?? t('folderPermission.error')}</p>
              )}
            </div>
            <div className="flex justify-end border-t border-card-border px-6 py-4">
              <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg">
                {t('documents.action.cancel')}
              </button>
            </div>
          </>
        ) : (
          <PermissionEditor folderId={node.id} data={data} onClose={onClose} onSaved={onSaved} />
        )}
      </div>
    </div>
  );
}
