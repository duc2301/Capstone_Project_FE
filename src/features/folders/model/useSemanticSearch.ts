import { useCallback, useState } from 'react';

import type { DocumentSearchResult } from '@/entities/document-search';
import { documentSearchApi } from '@/entities/document-search';
import { t } from '@/shared/lib/i18n';

export interface SemanticSearchState {
  query: string;
  setQuery: (value: string) => void;
  results: DocumentSearchResult[] | null;
  loading: boolean;
  error: string | null;
  runSearch: () => Promise<void>;
  clearSearch: () => void;
}

export function useSemanticSearch(projectId: string): SemanticSearchState {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DocumentSearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async () => {
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
  }, [projectId, query, loading]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults(null);
    setError(null);
  }, []);

  return { query, setQuery, results, loading, error, runSearch, clearSearch };
}
