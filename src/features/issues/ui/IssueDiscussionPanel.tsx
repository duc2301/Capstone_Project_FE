import { useLayoutEffect, useRef, useState } from 'react';

import type { DiscussionMessage } from '@/entities/discussion';
import { t } from '@/shared/lib/i18n';

import { formatIssueDateTime } from '../model/issueFormat';
import { useIssueDiscussion } from '../model/useIssueDiscussion';

interface IssueDiscussionPanelProps {
  discussionId: string | null;
  fileItemId: string;
  currentAccountId: string | null;
  canDiscuss: boolean;
  resolved: boolean;
}

export function IssueDiscussionPanel({
  discussionId,
  fileItemId,
  currentAccountId,
  canDiscuss,
  resolved,
}: IssueDiscussionPanelProps) {
  const { messages, loading, posting, postMessage } = useIssueDiscussion(discussionId, fileItemId);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content) return;
    const ok = await postMessage({ content });
    if (ok) setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {loading ? (
          <p className="py-8 text-center text-sm text-text-muted">{t('common.loading')}</p>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">{t('issues.discussion.empty')}</p>
        ) : (
          messages.map((m) => (
            <MessageBubble key={m.id} message={m} mine={!!currentAccountId && m.authorAccountId === currentAccountId} />
          ))
        )}
      </div>

      <div className="border-t border-card-border bg-card px-4 py-3">
        {resolved ? (
          <p className="rounded-xl border border-card-border bg-content-bg/40 px-3 py-2.5 text-center text-xs text-text-muted">
            {t('issues.discussion.closed')}
          </p>
        ) : !canDiscuss ? (
          <p className="rounded-xl border border-card-border bg-content-bg/40 px-3 py-2.5 text-xs text-text-muted">
            {t('issues.discussion.notMember')}
          </p>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('issues.discussion.placeholder')}
              className="max-h-32 min-h-11 flex-1 resize-none rounded-(--radius-input) border border-input-border bg-input-bg px-3.5 py-2.5 text-sm text-text outline-none focus:border-input-focus"
            />
            <button
              type="button"
              disabled={posting || !text.trim()}
              onClick={handleSend}
              className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
              </svg>
              {t('issues.discussion.send')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message, mine }: { message: DiscussionMessage; mine: boolean }) {
  return (
    <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
      <div className="mb-1 flex items-center gap-2 px-1">
        <span className="text-xs font-semibold text-text">{mine ? t('issues.discussion.you') : message.authorName ?? message.authorAccountId}</span>
        <span className="text-[11px] text-text-muted">{formatIssueDateTime(message.createdAt)}</span>
      </div>
      <div
        className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm ${mine
            ? 'rounded-br-md bg-primary text-white'
            : 'rounded-bl-md border border-card-border bg-content-bg/60 text-text'
          }`}
      >
        {message.content}
      </div>
    </div>
  );
}
