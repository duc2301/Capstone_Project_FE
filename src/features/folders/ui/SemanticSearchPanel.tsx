import { useState } from 'react';

import type { DocumentSearchResult } from '@/entities/document-search';
import { documentSearchApi } from '@/entities/document-search';
import { t } from '@/shared/lib/i18n';

interface Props {
  projectId: string;
  /* Bấm 1 kết quả -> mở trang "Xem chi tiết" của file đó */
  onOpenFile: (result: DocumentSearchResult) => void;
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/* Thanh tìm kiếm ngữ nghĩa + danh sách kết quả.
 * Chỉ hiện ở vùng Published/Archived (nơi tài liệu đã được index vào RAG). */
export function SemanticSearchPanel({ projectId, onOpenFile }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DocumentSearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async () => {
    const q = query.trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);
    try {
      const { data } = await documentSearchApi.search(projectId, q);
      setResults(data.result ?? []);
    } catch {
      setError(t('docSearch.error'));
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults(null);
    setError(null);
  };

  return (
    <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <SparkIcon />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-text">{t('docSearch.title')}</p>
          <p className="text-xs text-text-muted">{t('docSearch.hint')}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void runSearch(); }}
            placeholder={t('docSearch.placeholder')}
            className="w-full rounded-xl border border-card-border bg-card py-2.5 pl-9 pr-3 text-sm text-text outline-none transition-colors placeholder:text-text-muted focus:border-primary"
          />
        </div>
        <button
          type="button"
          onClick={() => void runSearch()}
          disabled={loading || query.trim().length === 0}
          className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? t('docSearch.searching') : t('docSearch.submit')}
        </button>
        {results !== null && (
          <button
            type="button"
            onClick={clearSearch}
            className="shrink-0 rounded-xl border border-card-border px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-content-bg"
          >
            {t('docSearch.clear')}
          </button>
        )}
      </div>

      {error && <p className="text-sm font-medium text-danger">{error}</p>}

      {results !== null && !error && (
        results.length === 0 ? (
          <p className="py-4 text-center text-sm text-text-muted">{t('docSearch.empty')}</p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
              {results.length} {t('docSearch.resultCount')}
            </p>
            <ul className="space-y-2">
              {results.map((r) => (
                <li key={r.fileItemId}>
                  <button
                    type="button"
                    onClick={() => onOpenFile(r)}
                    title={t('docSearch.openHint')}
                    className="w-full rounded-xl border border-card-border bg-card p-3.5 text-left transition-colors hover:border-primary/40 hover:bg-primary-ghost"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-text">{r.fileName}</p>
                      <span className="shrink-0 rounded-full bg-success-light px-2.5 py-0.5 text-xs font-bold text-success">
                        {Math.round(r.similarity * 100)}% {t('docSearch.match')}
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-text-secondary">
                      {r.snippet}
                    </p>
                    <p className="mt-1.5 text-xs text-text-muted">
                      {r.matchCount} {t('docSearch.passages')}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )
      )}
    </div>
  );
}
