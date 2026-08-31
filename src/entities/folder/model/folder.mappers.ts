import type { FolderTreeNode, FolderTreeNodeDto } from './folder.types';

export function toFolderTreeNode(dto: FolderTreeNodeDto): FolderTreeNode {
  return {
    id: dto.id,
    projectId: dto.projectId,
    parentFolderId: dto.parentFolderId,
    name: dto.name,
    area: dto.area,
    ownerOrganizationId: null,
    hasWarning: dto.hasWarning ?? false,
    permission: {
      folderId: dto.id,
      canView: true,
      canEdit: false,
      canApprove: false,
    },
    children: dto.children.map(toFolderTreeNode),
  };
}
