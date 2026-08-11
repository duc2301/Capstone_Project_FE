import { useCallback } from 'react';

import type { IssueItem } from '@/entities/issue';
import { issueApi, issueErrorMessage } from '@/entities/issue';
import type { AsyncDataResult } from '@/shared/lib/async';
import { useAsyncData } from '@/shared/lib/async';
import { t } from '@/shared/lib/i18n';

export function useIssueDetail(issueId: string | null | undefined): AsyncDataResult<IssueItem | null> {
  const fetchIssue = useCallback(() => issueApi.getById(issueId!), [issueId]);

  return useAsyncData<IssueItem | null>(issueId ?? '', fetchIssue, {
    fallback: null,
    enabled: Boolean(issueId),
    toErrorMessage: (err) => issueErrorMessage(err, t('issues.error')),
  });
}
