/* BE khong dung JsonStringEnumConverter -> enum serialize ra so, FE map sang string cho de doc */
export type IssueType = 'Issue' | 'Rfi';
export type IssueStatus = 'Open' | 'InProgress' | 'Closed';
export type IssuePriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type IssueAssignmentStatus = 'Unassigned' | 'Pending' | 'Accepted' | 'Rejected';

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
  assignedToOrganizationName: string | null;
  assignedToGroupId: string | null;
  assignedToGroupName: string | null;
  dueDate: string | null;
  assignmentStatus: IssueAssignmentStatus;
  assignmentRespondedByAccountId: string | null;
  assignmentRespondedByName: string | null;
  assignedAt: string | null;
  assignmentRespondedAt: string | null;
  assignmentRejectReason: string | null;
  canRespondToAssignment: boolean;
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
  projectName: string | null;
  type: IssueType;
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: IssuePriority;
  raisedByAccountId: string | null;
  raisedByName: string | null;
  assignedToAccountId: string | null;
  assignedToName: string | null;
  assignedToGroupId: string | null;
  assignedToGroupName: string | null;
  dueDate: string | null;
  assignmentStatus: IssueAssignmentStatus;
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

export interface AssignableGroup {
  groupId: string;
  groupName: string;
  organizationName: string | null;
  memberCount: number;
  hasActiveLeader: boolean;
}

export interface PendingIssueAssignment {
  issueId: string;
  title: string;
  projectId: string;
  linkedFileItemId: string | null;
  assignedToGroupName: string | null;
  dueDate: string | null;
}

export interface AssignIssuePayload {
  assignedToAccountId?: string;
  assignedToGroupId?: string;
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
  assignedToGroupId?: string;
}

export const ISSUE_TITLE_MIN = 8;
export const ISSUE_DESCRIPTION_MIN = 15;
