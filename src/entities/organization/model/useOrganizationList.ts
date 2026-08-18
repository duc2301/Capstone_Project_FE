import { useCallback, useEffect, useState } from 'react';

import { t } from '@/shared/lib/i18n';
import { sortByNewest } from '@/shared/lib/sort';

import { organizationApi } from '../api/organizationApi';
import type { Organization } from './organization.types';

interface UseOrganizationListReturn {
  organizations: Organization[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useOrganizationList(): UseOrganizationListReturn {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await organizationApi.getAll();
      setOrganizations(sortByNewest(data.result?.items ?? [], (o) => o.createdAt));
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await organizationApi.getAll();
        if (!cancelled) setOrganizations(sortByNewest(data.result?.items ?? [], (o) => o.createdAt));
      } catch {
        if (!cancelled) setError(t('common.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { organizations, loading, error, refresh };
}
