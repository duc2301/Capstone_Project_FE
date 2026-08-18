import { isAxiosError } from 'axios';
import { useMemo } from 'react';

import { approvalApi } from '@/entities/approval';
import type { ApprovalListItem } from '@/entities/approval';
import { invitationApi } from '@/entities/invitation';
import type { MyInvitation } from '@/entities/invitation';
import { issueApi } from '@/entities/issue';
import type { ProjectIssueListItem } from '@/entities/issue';
import { useNotifications } from '@/entities/notification';
import { projectApi } from '@/entities/project';
import type { Project } from '@/entities/project';
import { useSession } from '@/entities/session';
import { zoneTransferApi } from '@/entities/zone-transfer';
import type { ZoneReturnRequestItem } from '@/entities/zone-transfer';
import type { ApiResponse } from '@/shared/api';
import { toDateKey } from '@/shared/components';
import { useAsyncData } from '@/shared/lib/async';
import { t } from '@/shared/lib/i18n';
import type { TranslationKey } from '@/shared/lib/i18n';
import { sortByNewest } from '@/shared/lib/sort';

export type WorkItemKind = 'approval' | 'signature' | 'submitted' | 'returnRequest' | 'invitation' | 'issue';

export interface WorkItem {
  id: string;
  kind: WorkItemKind;
  title: string;
  context: string;
  createdAt: string;
  waitingDays: number;
  link: string | null;
}

export interface MyProjectItem {
  id: string;
  name: string;
  code: string | null;
  isManager: boolean;
}

export interface DeadlineItem {
  id: string;
  title: string;
  context: string;
  dueDate: string;
  dueDateKey: string;
  daysLeft: number;
  isOverdue: boolean;
  link: string;
}

const EMPTY_APPROVALS: ApprovalListItem[] = [];
const EMPTY_RETURN_REQUESTS: ZoneReturnRequestItem[] = [];
const EMPTY_INVITATIONS: MyInvitation[] = [];
const EMPTY_ISSUES: ProjectIssueListItem[] = [];
const EMPTY_PROJECTS: Project[] = [];

const ZONE_SHORT_KEY: Record<string, TranslationKey> = {
  wip: 'documents.zone.wipShort',
  shared: 'documents.zone.sharedShort',
  published: 'documents.zone.publishedShort',
  archived: 'documents.zone.archivedShort',
};

function zoneShortLabel(zone: string | null | undefined): string {
  if (!zone) return '';
  const key = ZONE_SHORT_KEY[zone.toLowerCase()];
  return key ? t(key) : zone;
}

function joinContext(parts: (string | null | undefined)[]): string {
  return parts.filter((part) => Boolean(part)).join(' · ');
}

function listOf<T>(response: { data: ApiResponse<T[]> }): T[] {
  if (!response.data.isSuccess) throw new Error(response.data.message || t('common.error'));
  return response.data.result ?? [];
}

function loadErrorMessage(): string {
  return t('dashboard.error.load');
}

const MS_PER_DAY = 86_400_000;

function waitingDaysSince(iso: string | null | undefined): number {
  if (!iso) return 0;
  const normalized = /(Z|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : `${iso}Z`;
  const created = new Date(normalized).getTime();
  if (Number.isNaN(created)) return 0;
  return Math.max(0, Math.floor((Date.now() - created) / MS_PER_DAY));
}

function getGreetingKey(): TranslationKey {
  const hour = new Date().getHours();
  if (hour < 12) return 'dashboard.greeting.morning';
  if (hour < 18) return 'dashboard.greeting.afternoon';
  return 'dashboard.greeting.evening';
}

function formatTodayVi(): string {
  return new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function approvalKind(item: ApprovalListItem, accountId: string | undefined): WorkItemKind {
  if (!accountId) return 'approval';

  const waitsForMySignature =
    item.requiresSignature &&
    item.signers.some((signer) => signer.signerAccountId === accountId && signer.status === 'Pending');
  if (waitsForMySignature) return 'signature';

  if ((item.pendingApproverAccountIds ?? []).includes(accountId)) return 'approval';
  if (item.requestedByAccountId === accountId) return 'submitted';
  return 'approval';
}

function approvalWorkItem(item: ApprovalListItem, accountId: string | undefined): WorkItem {
  const zoneFlow = [zoneShortLabel(item.currentZone), zoneShortLabel(item.targetZone)]
    .filter(Boolean)
    .join(' → ');
  return {
    id: `approval-${item.id}`,
    kind: approvalKind(item, accountId),
    title: item.fileName,
    context: joinContext([item.projectName, zoneFlow, item.requestedByName]),
    createdAt: item.createdAt,
    waitingDays: waitingDaysSince(item.createdAt),
    link: item.projectId ? `/projects/${item.projectId}/files/${item.fileItemId}/view` : null,
  };
}

function returnRequestWorkItem(item: ZoneReturnRequestItem): WorkItem {
  return {
    id: `return-${item.id}`,
    kind: 'returnRequest',
    title: item.fileName,
    context: joinContext([zoneShortLabel(item.currentZone), item.requestedByName]),
    createdAt: item.createdAt,
    waitingDays: waitingDaysSince(item.createdAt),
    link: '/zone-return-requests',
  };
}

async function fetchPendingReturnRequests(): Promise<ZoneReturnRequestItem[]> {
  try {
    return await zoneTransferApi.getPendingReturnRequests();
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403) return EMPTY_RETURN_REQUESTS;
    throw error;
  }
}

function invitationWorkItem(item: MyInvitation): WorkItem {
  return {
    id: `invitation-${item.id}`,
    kind: 'invitation',
    title: item.projectName,
    context: joinContext([item.groupName, item.invitedByName]),
    createdAt: item.createdAt,
    waitingDays: waitingDaysSince(item.createdAt),
    link: '/notifications',
  };
}

function isPastDue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const due = new Date(dueDate).getTime();
  return !Number.isNaN(due) && due < Date.now();
}

function startOfDay(value: Date): number {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
}

function calendarDaysUntil(dueDate: string): number {
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return 0;
  return Math.round((startOfDay(due) - startOfDay(new Date())) / MS_PER_DAY);
}

function deadlineItem(item: ProjectIssueListItem): DeadlineItem {
  const dueDate = item.dueDate ?? '';
  const daysLeft = calendarDaysUntil(dueDate);
  const parsed = new Date(dueDate);
  return {
    id: `deadline-${item.id}`,
    title: item.title,
    context: joinContext([item.linkedFileName, item.linkedFolderName, item.assignedToName]),
    dueDate,
    dueDateKey: Number.isNaN(parsed.getTime()) ? '' : toDateKey(parsed),
    daysLeft,
    isOverdue: daysLeft < 0,
    link: item.linkedFileItemId
      ? `/projects/${item.projectId}/files/${item.linkedFileItemId}/issues/${item.id}`
      : `/projects/${item.projectId}?tab=issues`,
  };
}

function issueWorkItem(item: ProjectIssueListItem): WorkItem {
  const createdAt = item.createdAt ?? '';
  return {
    id: `issue-${item.id}`,
    kind: 'issue',
    title: item.title,
    context: joinContext([item.linkedFileName, item.linkedFolderName, item.raisedByName]),
    createdAt,
    waitingDays: waitingDaysSince(createdAt),
    link: item.linkedFileItemId
      ? `/projects/${item.projectId}/files/${item.linkedFileItemId}/issues/${item.id}`
      : `/projects/${item.projectId}?tab=issues`,
  };
}

export function useDashboard() {
  const { currentUser } = useSession();
  const { unreadCount } = useNotifications();

  const approvals = useAsyncData(
    'dashboard-approvals',
    () => approvalApi.getPendingApprovals(),
    { fallback: EMPTY_APPROVALS, toErrorMessage: loadErrorMessage },
  );

  const returnRequests = useAsyncData(
    'dashboard-return-requests',
    () => fetchPendingReturnRequests(),
    { fallback: EMPTY_RETURN_REQUESTS, toErrorMessage: loadErrorMessage },
  );

  const invitations = useAsyncData(
    'dashboard-invitations',
    async () => listOf(await invitationApi.getMyPending()),
    { fallback: EMPTY_INVITATIONS, toErrorMessage: loadErrorMessage },
  );

  const assignedIssues = useAsyncData(
    'dashboard-assigned-issues',
    () => issueApi.getAssignedToMe(1, 500),
    { fallback: EMPTY_ISSUES, toErrorMessage: loadErrorMessage },
  );

  const projects = useAsyncData(
    'dashboard-projects',
    async () => listOf(await projectApi.getMine()),
    { fallback: EMPTY_PROJECTS, toErrorMessage: loadErrorMessage },
  );

  const workItems = useMemo(
    () =>
      sortByNewest(
        [
          ...approvals.data.map((item) => approvalWorkItem(item, currentUser?.accountId)),
          ...returnRequests.data.map(returnRequestWorkItem),
          ...invitations.data.map(invitationWorkItem),
          ...assignedIssues.data.filter((issue) => !issue.dueDate).map(issueWorkItem),
        ],
        (item) => item.createdAt,
      ),
    [approvals.data, returnRequests.data, invitations.data, assignedIssues.data, currentUser],
  );

  const deadlines = useMemo<DeadlineItem[]>(
    () =>
      assignedIssues.data
        .filter((issue) => Boolean(issue.dueDate))
        .map(deadlineItem)
        .sort((a, b) => a.daysLeft - b.daysLeft),
    [assignedIssues.data],
  );

  const myProjects = useMemo<MyProjectItem[]>(
    () =>
      sortByNewest(projects.data, (project) => project.createdAt).map((project) => ({
        id: project.id,
        name: project.projectName,
        code: project.projectCode ?? null,
        isManager: Boolean(currentUser) && project.managerAccountId === currentUser?.accountId,
      })),
    [projects.data, currentUser],
  );

  return {
    currentUser,
    greetingKey: getGreetingKey(),
    todayStr: formatTodayVi(),
    overdueIssues: assignedIssues.data.filter((issue) => isPastDue(issue.dueDate)).length,
    unreadNotifications: unreadCount,
    deadlines,
    workItems,
    workItemsLoading:
      approvals.loading || returnRequests.loading || invitations.loading || assignedIssues.loading,
    workItemsError:
      approvals.error ?? returnRequests.error ?? invitations.error ?? assignedIssues.error,
    myProjects,
    projectsLoading: projects.loading,
    projectsError: projects.error,
  };
}
