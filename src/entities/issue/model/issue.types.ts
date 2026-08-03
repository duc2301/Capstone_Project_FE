/* BE khong dung JsonStringEnumConverter -> enum serialize ra so, FE map sang string cho de doc */
export type IssueType = 'Issue' | 'Rfi';
export type IssueStatus = 'Open' | 'InProgress' | 'Answered' | 'Closed';
export type IssuePriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface IssueParticipant {
  accountId: string;
  name: string | null;
}

export interface IssueAttachment {
  id: string;
  url: string | null;
  fileVersionId: string | null;
}

export interface IssueItem {
  id: string;
  projectId: string;
  type: IssueType;
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  raisedByAccountId: string | null;
  raisedByName: string | null;
  assignedToAccountId: string | null;
  assignedToName: string | null;
  assignedToOrganizationId: string | null;
  dueDate: string | null;
  linkedFolderId: string | null;
  linkedFileItemId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  participants: IssueParticipant[];
  discussionId: string | null;
  linkedReturnRequestStatus: string | null;
  attachments: IssueAttachment[];
}

/* Dong issue trong bang tong hop toan du an. BE da loc theo quyen View thu muc cua nguoi goi. */
export interface ProjectIssueListItem {
  id: string;
  projectId: string;
  type: IssueType;
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  raisedByAccountId: string | null;
  raisedByName: string | null;
  assignedToAccountId: string | null;
  assignedToName: string | null;
  dueDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  linkedFileItemId: string | null;
  linkedFileName: string | null;
  linkedFolderId: string | null;
  linkedFolderName: string | null;
}

/* Ung vien co the chon lam nguoi thuc hien/tham gia issue cua 1 file — BE tu gioi han theo nhom
 * so huu file neu file dang o vung WIP. */
export interface AssignableMember {
  accountId: string;
  name: string;
  email: string | null;
  groupId: string;
  groupName: string;
}

export interface AssignableOrganization {
  organizationId: string;
  organizationName: string;
  groupNames: string[];
}

export interface CreateIssuePayload {
  projectId: string;
  type: IssueType;
  title: string;
  description: string;
  priority: IssuePriority;
  dueDate?: string;
  linkedFileItemId?: string;
  linkedFolderId?: string;
  assignedToAccountId?: string;
  assignedToOrganizationId?: string;
}

export const ISSUE_TITLE_MIN = 8;
export const ISSUE_DESCRIPTION_MIN = 15;
