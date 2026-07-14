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
  linkedFolderId: string | null;
  linkedFileItemId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  participants: IssueParticipant[];
  discussionId: string | null;
  linkedReturnRequestStatus: string | null;
  attachments: IssueAttachment[];
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

export interface CreateIssuePayload {
  projectId: string;
  type: IssueType;
  title: string;
  description?: string;
  status: IssueStatus;
  priority: IssuePriority;
  linkedFileItemId?: string;
  linkedFolderId?: string;
  assignedToAccountId?: string;
}
