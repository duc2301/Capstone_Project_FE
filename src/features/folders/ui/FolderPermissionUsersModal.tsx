import type { FolderTreeNode } from '@/entities/folder';
import { folderApi } from '@/entities/folder';
import { t } from '@/shared/lib/i18n';

import type { PermissionUsersLoader, PermissionUsersSaver } from '../model/permissionUsers.types';
import { EMPTY_PERMISSION_USER_UI } from '../model/permissionUsers.types';
import { PermissionUsersModal } from './PermissionUsersModal';

interface FolderPermissionUsersModalProps {
  node: FolderTreeNode;
  onClose: () => void;
  /** Gọi sau khi lưu thành công — modal vẫn mở, caller hiển thị thông báo. */
  onSaved?: () => void;
}

// Tham chiếu ổn định (module-level) để effect trong hook không chạy lại mỗi lần render.
const loadFolderUserPermissions: PermissionUsersLoader = async (folderId) => {
  const { data } = await folderApi.getUserUi(folderId);
  return data.result ?? EMPTY_PERMISSION_USER_UI;
};

const saveFolderUserPermissions: PermissionUsersSaver = async (input) => {
  await folderApi.updateUserPermissions(input);
};

export function FolderPermissionUsersModal({ node, onClose, onSaved }: FolderPermissionUsersModalProps) {
  return (
    <PermissionUsersModal
      resourceId={node.id}
      resourceName={node.name}
      title={t('userPermission.folder.title')}
      isFolder
      load={loadFolderUserPermissions}
      save={saveFolderUserPermissions}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}
