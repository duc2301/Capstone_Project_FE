import { useCallback, useState } from 'react';

import { invitationApi } from '@/entities/invitation';
import { getApiErrorMessage } from '@/shared/api';
import { t } from '@/shared/lib/i18n';

export type InvitationAction = 'accept' | 'reject';

interface UseInvitationActionsReturn {
  processingId: string | null;
  processingAction: InvitationAction | null;
  error: string | null;
  respond: (id: string, action: InvitationAction) => Promise<void>;
}

export function useInvitationActions(onDone?: () => void): UseInvitationActionsReturn {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<InvitationAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const respond = useCallback(
    async (id: string, action: InvitationAction) => {
      setProcessingId(id);
      setProcessingAction(action);
      setError(null);
      try {
        if (action === 'accept') await invitationApi.accept(id);
        else await invitationApi.reject(id);
        onDone?.();
      } catch (err) {
        setError(getApiErrorMessage(err, t('common.error')));
      } finally {
        setProcessingId(null);
        setProcessingAction(null);
      }
    },
    [onDone],
  );

  return { processingId, processingAction, error, respond };
}
