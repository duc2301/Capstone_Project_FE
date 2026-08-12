import type { ProjectIssueListItem } from '@/entities/issue';
import { issueApi, issueErrorMessage } from '@/entities/issue';
import { useAsyncData } from '@/shared/lib/async';
import { t } from '@/shared/lib/i18n';
import { sortByNewest } from '@/shared/lib/sort';

export type MyIssueItem = ProjectIssueListItem;

const EMPTY_ISSUES: MyIssueItem[] = [];

async function fetchMyIssues(): Promise<MyIssueItem[]> {
  const issues = await issueApi.getForMyProjects();
  return sortByNewest(issues, (issue) => issue.createdAt);
}

export function useMyIssues() {
  const { data, loading, error, reload } = useAsyncData('my-issues', fetchMyIssues, {
    fallback: EMPTY_ISSUES,
    toErrorMessage: (error) => issueErrorMessage(error, t('issues.error')),
  });

  return { issues: data, loading, error, reload };
}
