import { t } from '@/shared/lib/i18n';

export type MarkupStatusFilter = 'all' | 'open' | 'resolved';

export interface MarkupAuthorOption {
  id: string;
  name: string;
}

interface MarkupNoteFilterProps {
  authors: MarkupAuthorOption[];
  authorId: string;
  onAuthorChange: (id: string) => void;
  status: MarkupStatusFilter;
  onStatusChange: (status: MarkupStatusFilter) => void;
  total: number;
  shown: number;
}

const SELECT_CLASS =
  'min-w-0 flex-1 rounded-lg border border-card-border bg-content-bg/50 px-2 py-1.5 text-xs font-medium text-text outline-none focus:border-primary';

export function MarkupNoteFilter({
  authors,
  authorId,
  onAuthorChange,
  status,
  onStatusChange,
  total,
  shown,
}: MarkupNoteFilterProps) {
  return (
    <div className="space-y-2 rounded-xl border border-card-border bg-content-bg/40 p-2.5">
      <div className="flex items-center gap-2">
        <select
          value={authorId}
          onChange={(e) => onAuthorChange(e.target.value)}
          aria-label={t('markup.filter.author')}
          className={SELECT_CLASS}
        >
          <option value="">{t('markup.filter.allAuthors')}</option>
          {authors.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as MarkupStatusFilter)}
          aria-label={t('markup.filter.status')}
          className={SELECT_CLASS}
        >
          <option value="all">{t('markup.filter.allStatus')}</option>
          <option value="open">{t('markup.status.open')}</option>
          <option value="resolved">{t('markup.status.resolved')}</option>
        </select>
      </div>
      <p className="text-[11px] text-text-muted">
        {t('markup.filter.showing')}: {shown}/{total}
      </p>
    </div>
  );
}
