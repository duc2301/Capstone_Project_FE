import { useCallback, useState } from 'react';

import { issueApi, issueErrorMessage } from '@/entities/issue';
import { t } from '@/shared/lib/i18n';

export type IssueAssignmentAction = 'accept' | 'reject';

interface UseIssueAssignmentActionsReturn {
  processingId: string | null;
  processingAction: IssueAssignmentAction | null;
  error: string | null;
  accept: (issueId: string) => Promise<void>;
  reject: (issueId: string, reason: string) => Promise<void>;
}

export function useIssueAssignmentActions(onDone?: () => void): UseIssueAssignmentActionsReturn {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<IssueAssignmentAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (issueId: string, action: IssueAssignmentAction, call: () => Promise<unknown>) => {
      setProcessingId(issueId);
      setProcessingAction(action);
      setError(null);
      try {
        await call();
        onDone?.();
      } catch (err) {
        setError(issueErrorMessage(err, t('common.error')));
      } finally {
        setProcessingId(null);
        setProcessingAction(null);
      }
    },
    [onDone],
  );

  const accept = useCallback(
    (issueId: string) => run(issueId, 'accept', () => issueApi.acceptAssignment(issueId)),
    [run],
  );

  const reject = useCallback(
    (issueId: string, reason: string) =>
      run(issueId, 'reject', () => issueApi.rejectAssignment(issueId, reason)),
    [run],
  );

  return { processingId, processingAction, error, accept, reject };
}
