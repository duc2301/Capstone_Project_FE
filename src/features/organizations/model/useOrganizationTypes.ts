import { useCallback, useEffect, useState } from 'react';

import type { OrganizationType } from '@/entities/organization-type';
import { organizationTypeApi } from '@/entities/organization-type';
import { t } from '@/shared/lib/i18n';

interface UseOrganizationTypesReturn {
  orgTypes: OrganizationType[];
  loading: boolean;
  error: string | null;
  fetchOrgTypes: () => Promise<void>;
}

export function useOrganizationTypes(): UseOrganizationTypesReturn {
  const [orgTypes, setOrgTypes] = useState<OrganizationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrgTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await organizationTypeApi.getAll();
      setOrgTypes(data.result ?? []);
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
        const { data } = await organizationTypeApi.getAll();
        if (!cancelled) setOrgTypes(data.result ?? []);
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

  return { orgTypes, loading, error, fetchOrgTypes };
}
