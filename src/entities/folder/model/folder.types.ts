/* ── CDE area (ISO 19650) — numeric enum khớp BE ──────── */
export const CdeArea = {
  Wip: 0,
  Shared: 1,
  Published: 2,
  Archived: 3,
} as const;
export type CdeArea = (typeof CdeArea)[keyof typeof CdeArea];

/* Quyền hiệu lực của người dùng hiện tại trên 1 folder */
export interface EffectivePermission {
  folderId: string;
  canView: boolean;
  canEdit: boolean;
  canUpdate: boolean;
  canDownload: boolean;
  canVerify: boolean;
  canApprove: boolean;
}

/* 1 nút trong cây thư mục CDE (đã lọc theo quyền ở BE) */
export interface FolderTreeNode {
  id: string;
  projectId: string;
  parentFolderId: string | null;
  name: string;
  area: CdeArea;
  ownerOrganizationId: string | null;
  ownerGroupId: string | null;
  permission: EffectivePermission;
  children: FolderTreeNode[];
}
