import { fileItemApi } from '@/entities/file-item';
import { t } from '@/shared/lib/i18n';

import type { PermissionGroupsLoader, PermissionGroupsSaver } from '../model/permissionGroups.types';
import { EMPTY_PERMISSION_GROUP_UI } from '../model/permissionGroups.types';
import { PermissionGroupsModal } from './PermissionGroupsModal';

interface FilePermissionModalProps {
  fileItemId: string;
  fileName: string;
  onClose: () => void;
  /** Gọi sau khi lưu thành công — modal vẫn mở, caller hiển thị thông báo. */
  onSaved?: () => void;
}

// Tham chiếu ổn định (module-level) để effect trong hook không chạy lại mỗi lần render.
const loadFilePermissions: PermissionGroupsLoader = async (fileItemId) => {
  const { data } = await fileItemApi.getPermissionGroupUi(fileItemId);
  return data.result ?? EMPTY_PERMISSION_GROUP_UI;
};

const saveFilePermissions: PermissionGroupsSaver = async (input) => {
  await fileItemApi.updateGroupPermissions(input);
};

export function FilePermissionModal({ fileItemId, fileName, onClose, onSaved }: FilePermissionModalProps) {
  return (
    <PermissionGroupsModal
      resourceId={fileItemId}
      resourceName={fileName}
      title={t('filePermission.title')}
      load={loadFilePermissions}
      save={saveFilePermissions}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}
