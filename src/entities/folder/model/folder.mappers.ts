import type { FolderTreeNode, FolderTreeNodeDto } from './folder.types';

/* API /folder-tree/tree mới chưa trả owner/permission cho từng node.
 * Tạm điền mặc định để UI hiện tại chạy được: owner = null, mọi quyền = true
 * (BE vẫn là nơi kiểm tra quyền thật khi thao tác). Sẽ gỡ khi BE trả đủ. */
export function toFolderTreeNode(dto: FolderTreeNodeDto): FolderTreeNode {
  return {
    id: dto.id,
    projectId: dto.projectId,
    parentFolderId: dto.parentFolderId,
    name: dto.name,
    area: dto.area,
    ownerOrganizationId: null,
    ownerGroupId: null,
    hasWarning: dto.hasWarning ?? false,
    permission: {
      folderId: dto.id,
      canView: true,
      canEdit: true,
      canUpdate: true,
      canDownload: true,
      canVerify: true,
      canApprove: true,
    },
    children: dto.children.map(toFolderTreeNode),
  };
}
