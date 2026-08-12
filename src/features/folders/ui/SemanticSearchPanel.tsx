import type { DocumentSearchResult } from '@/entities/document-search';
import { t } from '@/shared/lib/i18n';

import type { SemanticSearchState } from '../model/useSemanticSearch';
import { zoneLabel } from '../model/zoneTransferFormat';

interface BarProps {
  search: SemanticSearchState;
}

interface ResultsProps {
  search: SemanticSearchState;
  onOpenFile: (result: DocumentSearchResult) => void;
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function SemanticSearchBar({ search }: BarProps) {
  const { query, setQuery, results, loading, runSearch, clearSearch } = search;

  return (
    <div
      title={`${t('docSearch.title')} — ${t('docSearch.hint')}`}
      className="flex min-w-0 flex-1 items-center gap-1.5 rounded-[var(--radius-input)] border border-input-border bg-input-bg py-1 pl-3 pr-1 sm:max-w-sm"
    >
      <span className="pointer-events-none shrink-0 text-text-muted">
        <SearchIcon />
      </span>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') void runSearch(); }}
        placeholder={t('docSearch.placeholder')}
        className="min-w-0 flex-1 bg-transparent py-1 text-sm text-text outline-none placeholder:text-text-placeholder"
      />
      {results !== null && (
        <button
          type="button"
          onClick={clearSearch}
          title={t('docSearch.clear')}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-content-bg hover:text-text"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
      <button
        type="button"
        onClick={() => void runSearch()}
        disabled={loading || query.trim().length === 0}
        className="shrink-0 rounded-[var(--radius-button)] bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? t('docSearch.searching') : t('docSearch.submit')}
      </button>
    </div>
  );
}

export function SemanticSearchResults({ search, onOpenFile }: ResultsProps) {
  const { results, error } = search;

  if (error) {
    return <p className="shrink-0 text-sm font-medium text-danger">{error}</p>;
  }
  if (results === null) return null;

  if (results.length === 0) {
    return (
      <p className="shrink-0 rounded-[var(--radius-card)] border border-card-border bg-content-bg/40 py-2 text-center text-sm text-text-muted">
        {t('docSearch.empty')}
      </p>
    );
  }

  return (
    <div className="shrink-0 space-y-1.5 rounded-[var(--radius-card)] border border-primary/20 bg-primary/5 p-2.5">
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
        {results.length} {t('docSearch.resultCount')}
      </p>
      <ul className="admin-scrollbar max-h-56 space-y-2 overflow-y-auto pr-1">
        {results.map((r) => (
          <li key={r.fileItemId}>
            <button
              type="button"
              onClick={() => onOpenFile(r)}
              title={t('docSearch.openHint')}
              className="w-full rounded-[var(--radius-card)] border border-card-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-primary-ghost"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 flex-1 cell-wrap text-sm font-semibold text-text">{r.fileName}</p>
                {r.isUnderRevision ? (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-warning-light px-2.5 py-0.5 text-xs font-bold text-warning">
                    <WarningIcon />
                    {t('docSearch.underRevision')}
                  </span>
                ) : r.area === 'Archived' ? (
                  <span
                    title={t('docSearch.archivedHint')}
                    className="shrink-0 rounded-full bg-content-bg px-2.5 py-0.5 text-xs font-bold text-text-secondary"
                  >
                    {zoneLabel(r.area)}
                  </span>
                ) : null}
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
              {/* Giải thích vì sao kết quả không phải bản mới nhất — tránh người dùng hiểu nhầm RAG bỏ sót. */}
              {r.isUnderRevision && (
                <p className="mt-2 rounded-[var(--radius-card)] border border-warning/20 bg-warning-light px-2.5 py-1.5 text-xs leading-relaxed text-warning">
                  {t('docSearch.underRevisionHint')}
                </p>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
