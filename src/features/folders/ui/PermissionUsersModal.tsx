import { useMemo, useState } from 'react';

import { getApiErrorMessage } from '@/shared/api';
import { useAsyncData } from '@/shared/lib/async';
import { t } from '@/shared/lib/i18n';

import type {
  PermissionUserUiData,
  PermissionUsersLoader,
  PermissionUsersSaver,
  UserOverrideLevel,
} from '../model/permissionUsers.types';
import { EMPTY_PERMISSION_USER_UI } from '../model/permissionUsers.types';
import { PermissionModalShell } from './permissionModalShared';

interface PermissionUsersModalProps {
  /** folderId hoặc fileItemId */
  resourceId: string;
  /** Tên thư mục/tệp — hiện dưới tiêu đề modal */
  resourceName: string;
  title: string;
  /** Đang phân quyền thư mục -> hiện chú thích "áp dụng cho cả nội dung bên trong". */
  isFolder: boolean;
  load: PermissionUsersLoader;
  save: PermissionUsersSaver;
  onClose: () => void;
  /** Gọi sau khi lưu thành công — modal vẫn mở, caller hiển thị thông báo. */
  onSaved?: () => void;
}

/* Thứ tự hiển thị các mức trong dropdown */
const LEVEL_ORDER: UserOverrideLevel[] = ['None', 'View', 'Edit', 'Blocked'];

const LEVEL_LABEL: Record<UserOverrideLevel, () => string> = {
  None: () => t('userPermission.level.inherit'),
  View: () => t('userPermission.level.view'),
  Edit: () => t('userPermission.level.edit'),
  Blocked: () => t('userPermission.level.deny'),
};

/* Cờ quyền gửi lên BE cho từng mức override (None -> đưa vào removeAccountIds, không có ở đây). */
const LEVEL_FLAGS: Record<Exclude<UserOverrideLevel, 'None'>, { canView: boolean; canEdit: boolean }> = {
  View: { canView: true, canEdit: false },
  Edit: { canView: true, canEdit: true },
  Blocked: { canView: false, canEdit: false },
};

/* Quyền hiệu lực THỰC TẾ sau khi BE áp trần theo quyền nhóm (override chỉ THU HẸP, không cấp thêm):
 *   effectiveView = level !== 'Blocked'         (roster chỉ gồm người nhóm đã cho Xem)
 *   effectiveEdit = inheritedCanEdit && level !== 'View' && level !== 'Blocked'
 * overrideLevel hiển thị là mức ĐÃ LƯU, còn đây là kết quả người dùng thật sự nhận. */
function effectiveLabel(level: UserOverrideLevel, inheritedCanEdit: boolean): string {
  if (level === 'Blocked') return t('userPermission.level.deny');
  const canEdit = inheritedCanEdit && level !== 'View';
  return canEdit ? t('userPermission.level.edit') : t('userPermission.level.view');
}

/* Dropdown chọn mức quyền áp dụng cho 1 thành viên. Viền đỏ khi đang Chặn để dễ nhận ra.
 * "Sửa" chỉ có nghĩa khi nhóm đã cấp quyền Sửa (inheritedCanEdit) — nếu không thì vô hiệu hoá
 * lựa chọn này vì BE sẽ chặn trần ở mức Xem. */
function LevelSelect({
  level,
  inheritedCanEdit,
  onChange,
}: {
  level: UserOverrideLevel;
  inheritedCanEdit: boolean;
  onChange: (level: UserOverrideLevel) => void;
}) {
  const blocked = level === 'Blocked';
  return (
    <select
      value={level}
      onChange={(e) => onChange(e.target.value as UserOverrideLevel)}
      className={`field-select py-1.5 ${blocked ? 'border-danger font-semibold text-danger' : ''}`}
    >
      {LEVEL_ORDER.map((lv) => (
        <option key={lv} value={lv} disabled={lv === 'Edit' && !inheritedCanEdit}>
          {LEVEL_LABEL[lv]()}
        </option>
      ))}
    </select>
  );
}

interface PermissionUserEditorProps {
  resourceId: string;
  data: PermissionUserUiData;
  isFolder: boolean;
  save: PermissionUsersSaver;
  onClose: () => void;
  onSaved?: () => void;
  onReload: () => void;
}

/* Phần thân + footer khi đã có dữ liệu — mount 1 lần (key theo version) nên khởi tạo state từ data;
 * sau khi lưu, caller tải lại và remount để bảng phản ánh trạng thái mới. */
function PermissionUserEditor({
  resourceId, data, isFolder, save, onClose, onSaved, onReload,
}: PermissionUserEditorProps) {
  // Mức override ban đầu theo từng thành viên — dùng để so ra các dòng đã đổi khi lưu.
  const initialLevel = useMemo(
    () => new Map(data.members.map((m) => [m.accountId, m.overrideLevel])),
    [data],
  );
  const [level, setLevel] = useState<Map<string, UserOverrideLevel>>(() => new Map(initialLevel));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const setMemberLevel = (accountId: string, value: UserOverrideLevel) => {
    setLevel((prev) => {
      const next = new Map(prev);
      next.set(accountId, value);
      return next;
    });
  };

  // Chỉ những dòng có mức đổi so với lúc tải mới được gửi đi.
  const changed = data.members.filter(
    (m) => (level.get(m.accountId) ?? 'None') !== (initialLevel.get(m.accountId) ?? 'None'),
  );
  const dirty = changed.length > 0;

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const usersPermission = changed
        .map((m) => ({ accountId: m.accountId, lv: level.get(m.accountId) ?? 'None' }))
        .filter((r) => r.lv !== 'None')
        .map((r) => ({ accountId: r.accountId, ...LEVEL_FLAGS[r.lv as Exclude<UserOverrideLevel, 'None'>] }));
      const removeAccountIds = changed
        .filter((m) => (level.get(m.accountId) ?? 'None') === 'None')
        .map((m) => m.accountId);

      await save({ id: resourceId, usersPermission, removeAccountIds });
      setSaving(false);
      onSaved?.();
      // Tải lại user-ui để bảng phản ánh đúng mức quyền sau khi lưu.
      onReload();
    } catch (err) {
      setSaveError(getApiErrorMessage(err, t('userPermission.saveError')));
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {data.members.length === 0 ? (
          <p className="py-16 text-center text-sm text-text-muted">{t('userPermission.empty')}</p>
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-card-border">
            <table className="table-list min-w-[42rem] border-collapse">
              <colgroup>
                <col className="w-[30%]" />
                <col />
                <col className="w-[120px]" />
                <col className="w-[176px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-card-border bg-content-bg/40 text-left text-2xs font-bold uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-2.5 font-bold">{t('userPermission.col.member')}</th>
                  <th className="px-4 py-2.5 font-bold">{t('userPermission.col.groups')}</th>
                  <th className="px-4 py-2.5 font-bold">{t('userPermission.col.inherited')}</th>
                  <th className="px-4 py-2.5 font-bold">{t('userPermission.col.applied')}</th>
                </tr>
              </thead>
              <tbody>
                {data.members.map((m) => (
                  <tr key={m.accountId} className="border-b border-card-border/60 last:border-0">
                    <td className="cell-wrap px-4 py-3 align-top">
                      <span className="block font-semibold text-text">{m.userName}</span>
                      <span className="block text-xs text-text-muted">{m.email}</span>
                    </td>
                    <td className="cell-wrap px-4 py-3 align-top text-text-secondary">
                      {m.groups.length > 0 ? m.groups.join(', ') : '—'}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="rounded-full bg-content-bg px-2.5 py-0.5 text-xs font-semibold text-text-secondary">
                        {m.inheritedCanEdit ? t('userPermission.level.edit') : t('userPermission.level.view')}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {(() => {
                        const lv = level.get(m.accountId) ?? 'None';
                        const effective = effectiveLabel(lv, m.inheritedCanEdit);
                        const denied = lv === 'Blocked';
                        return (
                          <>
                            <LevelSelect
                              level={lv}
                              inheritedCanEdit={m.inheritedCanEdit}
                              onChange={(value) => setMemberLevel(m.accountId, value)}
                            />
                            <p className={`mt-1 text-2xs ${denied ? 'text-danger' : 'text-text-muted'}`}>
                              {t('userPermission.effective')}: {effective}
                            </p>
                          </>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 space-y-2">
          {isFolder && (
            <p className="flex items-start gap-2 rounded-[var(--radius-card)] border border-warning/30 bg-warning-light px-3.5 py-2.5 text-xs text-text-secondary">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-warning">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>{t('userPermission.folderScopeHint')}</span>
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-card-border px-6 py-4">
        {saveError && <p className="mr-auto text-sm text-danger">{saveError}</p>}
        <button type="button" onClick={onClose} className="btn-modal-ghost">
          {t('documents.action.cancel')}
        </button>
        <button type="button" disabled={saving || !dirty} onClick={handleSave} className="btn-modal-primary">
          {saving ? t('folderPermission.saving') : t('folderPermission.update')}
        </button>
      </div>
    </>
  );
}

/* Modal phân quyền thành viên dùng chung cho thư mục và tệp — chỉ khác API truyền vào.
 * Dùng lại vỏ modal của modal phân quyền nhóm. */
export function PermissionUsersModal({
  resourceId, resourceName, title, isFolder, load, save, onClose, onSaved,
}: PermissionUsersModalProps) {
  const { data, loading, error, reload } = useAsyncData(
    resourceId,
    () => load(resourceId),
    { fallback: EMPTY_PERMISSION_USER_UI, toErrorMessage: () => t('folderPermission.error') },
  );

  const editorKey = data.members.map((m) => `${m.accountId}:${m.overrideLevel}`).join('|');

  return (
    <PermissionModalShell
      title={title}
      resourceName={resourceName}
      loading={loading}
      ready={!loading && !error}
      error={error}
      onClose={onClose}
    >
      <PermissionUserEditor
        key={editorKey}
        resourceId={resourceId}
        data={data}
        isFolder={isFolder}
        save={save}
        onClose={onClose}
        onSaved={onSaved}
        onReload={reload}
      />
    </PermissionModalShell>
  );
}
