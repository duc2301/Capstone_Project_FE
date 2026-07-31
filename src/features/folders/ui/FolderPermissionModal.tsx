import type { FolderTreeNode } from '@/entities/folder';
import { folderApi } from '@/entities/folder';
import { t } from '@/shared/lib/i18n';

import type { PermissionGroupsLoader, PermissionGroupsSaver } from '../model/permissionGroups.types';
import { EMPTY_PERMISSION_GROUP_UI } from '../model/permissionGroups.types';
import { PermissionGroupsModal } from './PermissionGroupsModal';

interface FolderPermissionModalProps {
  node: FolderTreeNode;
  onClose: () => void;
  /** Gọi sau khi lưu thành công — modal vẫn mở, caller hiển thị thông báo. */
  onSaved?: () => void;
}

// Tham chiếu ổn định (module-level) để effect trong hook không chạy lại mỗi lần render.
const loadFolderPermissions: PermissionGroupsLoader = async (folderId) => {
  const { data } = await folderApi.getGroupUi(folderId);
  return data.result ?? EMPTY_PERMISSION_GROUP_UI;
};

const saveFolderPermissions: PermissionGroupsSaver = async (input) => {
  await folderApi.updateGroupPermissions(input);
};

export function FolderPermissionModal({ node, onClose, onSaved }: FolderPermissionModalProps) {
  return (
    <PermissionGroupsModal
      resourceId={node.id}
      resourceName={node.name}
      title={t('folderPermission.title')}
      load={loadFolderPermissions}
      save={saveFolderPermissions}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}
