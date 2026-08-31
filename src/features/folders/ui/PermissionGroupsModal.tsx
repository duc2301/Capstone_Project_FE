import { useMemo, useState } from 'react';

import { isForbiddenError } from '@/shared/api';
import { t } from '@/shared/lib/i18n';

import type {
  PermissionGroupUiData,
  PermissionGroupsLoader,
  PermissionGroupsSaver,
} from '../model/permissionGroups.types';
import { toggleInSet } from '../model/toggleInSet';
import { usePermissionGroupUi } from '../model/usePermissionGroupUi';
import { MoveArrows, PermissionModalShell, SearchInput, SelectBox } from './permissionModalShared';

interface PermissionGroupsModalProps {
  /** folderId hoặc fileItemId */
  resourceId: string;
  /** Tên thư mục/tệp — hiện dưới tiêu đề modal */
  resourceName: string;
  title: string;
  /** Ngoài WIP (Shared/Published/Archived) tài liệu là chỉ đọc -> chỉ hiện quyền Xem. */
  canAssignEdit: boolean;
  load: PermissionGroupsLoader;
  save: PermissionGroupsSaver;
  onClose: () => void;
  /** Gọi sau khi lưu thành công — modal vẫn mở, caller hiển thị thông báo. */
  onSaved?: () => void;
}

type PermissionFlagKey = 'canView' | 'canEdit';

/* 1 nhóm trong modal — di chuyển giữa 2 panel, giữ nguyên cờ quyền khi di chuyển */
interface PermissionItem {
  projectParticipantId: string;
  groupName: string;
  organizationName: string | null;
  canView: boolean;
  canEdit: boolean;
  /** Đang có quyền trên BE (status === 0) — nếu kết thúc ở panel trái thì đưa vào removeParticipantIds */
  wasSelected: boolean;
}

/* Các cột quyền ở panel phải (BE hiện chỉ hỗ trợ Xem/Sửa) */
const VIEW_FLAG: { key: PermissionFlagKey; label: () => string } = {
  key: 'canView', label: () => t('folderPermission.col.view'),
};
const EDIT_FLAG: { key: PermissionFlagKey; label: () => string } = {
  key: 'canEdit', label: () => t('folderPermission.col.edit'),
};

const EMPTY_FLAGS = {
  canView: false,
  canEdit: false,
};

/* Panel trái ban đầu: nhóm chưa gán quyền + nhóm đã gỡ quyền (status === 1) */
function buildInitialAvailable(data: PermissionGroupUiData): PermissionItem[] {
  return [
    ...data.availableGroups.map((g) => ({
      projectParticipantId: g.projectParticipantId,
      groupName: g.groupName,
      organizationName: g.organizationName ?? null,
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
function buildInitialSelected(data: PermissionGroupUiData): PermissionItem[] {
  return data.selectedPermissions
    .filter((p) => p.status === 0)
    .map((p) => ({
      projectParticipantId: p.projectParticipantId,
      groupName: p.groupParticipantName,
      organizationName: null,
      canView: p.canView,
      canEdit: p.canEdit,
      wasSelected: true,
    }));
}

/* Lưới 1 dòng panel phải: ô chọn + tên nhóm + các cột quyền thẳng hàng với header.
 * Tailwind cần class tĩnh nên tách sẵn 2 biến thể theo số cột. */
const SELECTED_ROW_GRID_VIEW_ONLY = 'grid grid-cols-[1.5rem_minmax(0,1fr)_3.5rem] items-center gap-x-1';
const SELECTED_ROW_GRID_VIEW_EDIT = 'grid grid-cols-[1.5rem_minmax(0,1fr)_repeat(2,3.5rem)] items-center gap-x-1';

function TickBox({ granted }: { granted: boolean }) {
  return granted ? (
    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-success text-white transition-opacity group-hover:opacity-80">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  ) : (
    <span className="h-5 w-5 rounded-[var(--radius-card)] border-2 border-card-border bg-card transition-colors group-hover:border-success" />
  );
}

/* Ô tick quyền: bấm để cấp/gỡ quyền của nhóm ở panel phải */
function PermissionTick({ granted, onToggle }: { granted: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="group flex justify-center">
      <TickBox granted={granted} />
    </button>
  );
}

function PermissionColumnHeader({ label, granted, disabled, onToggle }: {
  label: string;
  granted: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      title={(granted ? t('folderPermission.revokeAll') : t('folderPermission.grantAll')).replace('{permission}', label)}
      className="group flex flex-col items-center gap-1 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="text-2xs font-bold leading-tight text-text-muted">{label}</span>
      <TickBox granted={granted} />
    </button>
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

interface PermissionEditorProps {
  resourceId: string;
  data: PermissionGroupUiData;
  canAssignEdit: boolean;
  save: PermissionGroupsSaver;
  onClose: () => void;
  onSaved?: () => void;
}

/* Phần thân + footer của modal khi đã có dữ liệu — mount 1 lần nên khởi tạo state từ data. */
function PermissionEditor({ resourceId, data, canAssignEdit, save, onClose, onSaved }: PermissionEditorProps) {
  // Ngoài WIP tài liệu là chỉ đọc -> ẩn hẳn cột "Sửa" (giá trị cũ từ BE giữ nguyên khi lưu).
  const permissionFlags = canAssignEdit ? [VIEW_FLAG, EDIT_FLAG] : [VIEW_FLAG];
  const rowGrid = canAssignEdit ? SELECTED_ROW_GRID_VIEW_EDIT : SELECTED_ROW_GRID_VIEW_ONLY;

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

  const isColumnFullyGranted = (key: PermissionFlagKey) =>
    filteredSelected.length > 0 && filteredSelected.every((it) => it[key]);

  const toggleColumn = (key: PermissionFlagKey) => {
    const nextValue = !isColumnFullyGranted(key);
    const visibleIds = new Set(filteredSelected.map((it) => it.projectParticipantId));
    setSelected((prev) =>
      prev.map((it) => (visibleIds.has(it.projectParticipantId) ? { ...it, [key]: nextValue } : it)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await save({
        id: resourceId,
        groupsPermission: selected.map((it) => ({
          projectParticipantId: it.projectParticipantId,
          canView: it.canView,
          // Ngoài WIP là vùng chỉ đọc -> luôn gỡ quyền Sửa, kể cả bản ghi cũ từ BE.
          canEdit: canAssignEdit && it.canEdit,
        })),
        removeParticipantIds: available
          .filter((it) => it.wasSelected)
          .map((it) => it.projectParticipantId),
      });
      // Modal giữ nguyên sau khi lưu — chốt lại trạng thái vừa lưu làm mốc mới,
      // để lần "Cập nhật" kế tiếp không gửi lại removeParticipantIds cũ.
      // Nhóm bị gỡ quyền đã bị BE reset toàn bộ cờ về false, nên xoá cờ cũ
      // ở panel trái để khi thêm lại các ô quyền đều trống.
      setSelected((prev) =>
        prev.map((it) => ({ ...it, canEdit: canAssignEdit && it.canEdit, wasSelected: true })),
      );
      setAvailable((prev) => prev.map((it) => ({ ...it, ...EMPTY_FLAGS, wasSelected: false })));
      onSaved?.();
    } catch (err) {
      // 403 khi lưu = không phải nhóm sở hữu -> giữ modal mở, hiện thông báo phân quyền.
      setSaveError(isForbiddenError(err) ? t('permission.assign.forbidden') : t('folderPermission.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr]">
          {/* Panel trái: Nhóm hữu dụng */}
          <section className="flex min-w-0 flex-col rounded-[var(--radius-card)] border border-card-border bg-content-bg/40 p-4">
            <h3 className="heading-label">{t('folderPermission.available.title')}</h3>
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
                      className={`flex w-full items-center gap-3 rounded-[var(--radius-button)] border px-3.5 py-2.5 text-left shadow-card transition-colors ${
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
          <MoveArrows
            canMoveRight={availableChecked.size > 0}
            canMoveLeft={selectedChecked.size > 0}
            onMoveRight={moveToSelected}
            onMoveLeft={moveToAvailable}
          />

          {/* Panel phải: Nhóm được chọn */}
          <section className="flex min-w-0 flex-col rounded-[var(--radius-card)] border border-card-border bg-content-bg/40 p-4">
            <h3 className="heading-label">{t('folderPermission.selected.title')}</h3>
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
                  <div className={`${rowGrid} border-b border-card-border pb-2`}>
                    <span />
                    <span />
                    {permissionFlags.map((f) => (
                      <PermissionColumnHeader
                        key={f.key}
                        label={f.label()}
                        granted={isColumnFullyGranted(f.key)}
                        disabled={filteredSelected.length === 0}
                        onToggle={() => toggleColumn(f.key)}
                      />
                    ))}
                  </div>
                  {filteredSelected.map((it) => {
                    const checked = selectedChecked.has(it.projectParticipantId);
                    return (
                      <div key={it.projectParticipantId} className={`${rowGrid} border-b border-card-border/60 py-2.5`}>
                        <button
                          type="button"
                          onClick={() => setSelectedChecked((prev) => toggleInSet(prev, it.projectParticipantId))}
                          className="flex justify-center"
                        >
                          <SelectBox checked={checked} />
                        </button>
                        <p className="truncate pr-2 text-sm font-semibold text-text">{it.groupName}</p>
                        {permissionFlags.map((f) => (
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
          className="btn-modal-ghost"
        >
          {t('documents.action.cancel')}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="btn-modal-primary"
        >
          {saving ? t('folderPermission.saving') : t('folderPermission.update')}
        </button>
      </div>
    </>
  );
}

/* Modal phân quyền nhóm dùng chung cho thư mục và tệp — chỉ khác API truyền vào. */
export function PermissionGroupsModal({
  resourceId, resourceName, title, canAssignEdit, load, save, onClose, onSaved,
}: PermissionGroupsModalProps) {
  const { data, loading, error } = usePermissionGroupUi(resourceId, load);

  return (
    <PermissionModalShell
      title={title}
      resourceName={resourceName}
      loading={loading}
      ready={!loading && !error && !!data}
      error={error}
      onClose={onClose}
    >
      {data && (
        <PermissionEditor
          resourceId={resourceId}
          data={data}
          canAssignEdit={canAssignEdit}
          save={save}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </PermissionModalShell>
  );
}
