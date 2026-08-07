import { useCallback, useState } from 'react';

import type { DiscussionMessage, PostDiscussionMessagePayload } from '@/entities/discussion';
import { discussionApi, discussionErrorMessage } from '@/entities/discussion';
import { useAsyncData } from '@/shared/lib/async';
import { t } from '@/shared/lib/i18n';

import { useIssueDiscussionRealtime } from './useIssueDiscussionRealtime';

interface UseIssueDiscussionReturn {
  messages: DiscussionMessage[];
  loading: boolean;
  posting: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  postMessage: (payload: PostDiscussionMessagePayload) => Promise<boolean>;
}

function sortByCreatedAt(list: DiscussionMessage[]): DiscussionMessage[] {
  return [...list].sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
}

const EMPTY_MESSAGES: DiscussionMessage[] = [];

export function useIssueDiscussion(
  discussionId: string | null | undefined,
  fileItemId?: string | null,
): UseIssueDiscussionReturn {
  const [posting, setPosting] = useState(false);

  const fetchMessages = useCallback(
    () => discussionApi.getMessages(discussionId!),
    [discussionId],
  );

  const { data: messages, loading, error, setData, setError, reload } = useAsyncData(
    discussionId ?? '',
    fetchMessages,
    {
      fallback: EMPTY_MESSAGES,
      enabled: Boolean(discussionId),
      toErrorMessage: (err) => discussionErrorMessage(err, t('issues.discussion.error')),
    },
  );

  useIssueDiscussionRealtime(fileItemId, discussionId, (incoming) => {
    setData((prev) => (prev.some((m) => m.id === incoming.id) ? prev : sortByCreatedAt([...prev, incoming])));
  });

  const refetch = useCallback(async () => reload(), [reload]);

  const postMessage = useCallback(async (payload: PostDiscussionMessagePayload): Promise<boolean> => {
    if (!discussionId) return false;

    setPosting(true);
    setError(null);
    try {
      await discussionApi.postMessage(discussionId, payload);
      await reload();
      return true;
    } catch (err) {
      setError(discussionErrorMessage(err, t('issues.discussion.postError')));
      return false;
    } finally {
      setPosting(false);
    }
  }, [discussionId, reload, setError]);

  return { messages, loading, posting, error, refetch, postMessage };
}
