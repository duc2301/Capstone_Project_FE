import { useCallback, useEffect, useState } from 'react';

import type { DiscussionMessage, PostDiscussionMessagePayload } from '@/entities/discussion';
import { discussionApi, discussionErrorMessage } from '@/entities/discussion';
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

export function useIssueDiscussion(
  discussionId: string | null | undefined,
  fileItemId?: string | null,
): UseIssueDiscussionReturn {
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useIssueDiscussionRealtime(fileItemId, discussionId, (incoming) => {
    setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : sortByCreatedAt([...prev, incoming])));
  });

  const loadMessages = useCallback(async (showLoading: boolean, isCancelled: () => boolean = () => false) => {
    if (!discussionId) return;

    if (showLoading) setLoading(true);
    setError(null);

    try {
      const data = await discussionApi.getMessages(discussionId);
      if (!isCancelled()) setMessages(data);
    } catch (err) {
      if (!isCancelled()) setError(discussionErrorMessage(err, t('issues.discussion.error')));
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, [discussionId]);

  const refetch = useCallback(() => loadMessages(false), [loadMessages]);

  useEffect(() => {
    if (!discussionId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    void loadMessages(true, () => cancelled);

    return () => {
      cancelled = true;
    };
  }, [discussionId, loadMessages]);

  const postMessage = useCallback(async (payload: PostDiscussionMessagePayload): Promise<boolean> => {
    if (!discussionId) return false;

    setPosting(true);
    setError(null);
    try {
      await discussionApi.postMessage(discussionId, payload);
      await loadMessages(false);
      return true;
    } catch (err) {
      setError(discussionErrorMessage(err, t('issues.discussion.postError')));
      return false;
    } finally {
      setPosting(false);
    }
  }, [discussionId, loadMessages]);

  return { messages, loading, posting, error, refetch, postMessage };
}
