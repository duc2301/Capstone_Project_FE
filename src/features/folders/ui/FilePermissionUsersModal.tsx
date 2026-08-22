import { fileItemApi } from '@/entities/file-item';
import { t } from '@/shared/lib/i18n';

import type { PermissionUsersLoader, PermissionUsersSaver } from '../model/permissionUsers.types';
import { EMPTY_PERMISSION_USER_UI } from '../model/permissionUsers.types';
import { PermissionUsersModal } from './PermissionUsersModal';

interface FilePermissionUsersModalProps {
  fileItemId: string;
  fileName: string;
  onClose: () => void;
  /** Gọi sau khi lưu thành công — modal vẫn mở, caller hiển thị thông báo. */
  onSaved?: () => void;
}

// Tham chiếu ổn định (module-level) để effect trong hook không chạy lại mỗi lần render.
const loadFileUserPermissions: PermissionUsersLoader = async (fileItemId) => {
  const { data } = await fileItemApi.getPermissionUserUi(fileItemId);
  return data.result ?? EMPTY_PERMISSION_USER_UI;
};

const saveFileUserPermissions: PermissionUsersSaver = async (input) => {
  await fileItemApi.updateUserPermissions(input);
};

export function FilePermissionUsersModal({ fileItemId, fileName, onClose, onSaved }: FilePermissionUsersModalProps) {
  return (
    <PermissionUsersModal
      resourceId={fileItemId}
      resourceName={fileName}
      title={t('userPermission.file.title')}
      isFolder={false}
      load={loadFileUserPermissions}
      save={saveFileUserPermissions}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}
