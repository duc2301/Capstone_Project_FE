import { useEffect, useState } from 'react';

import type { Organization } from '@/entities/organization';
import { organizationApi } from '@/entities/organization';
import { t } from '@/shared/lib/i18n';
import { sortByNewest } from '@/shared/lib/sort';

export interface OrganizationOption {
  id: string;
  name: string;
}

interface UseOrganizationOptionsReturn {
  options: OrganizationOption[];
  loading: boolean;
  error: string | null;
}

const toOption = (organization: Organization): OrganizationOption => ({
  id: organization.id,
  name: organization.displayName ?? organization.legalName,
});

export function useOrganizationOptions(): UseOrganizationOptionsReturn {
  const [options, setOptions] = useState<OrganizationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await organizationApi.getAll();
        if (cancelled) return;
        if (!data.isSuccess) {
          setError(t('common.error'));
          return;
        }
        setOptions(sortByNewest(data.result ?? [], (o) => o.createdAt).map(toOption));
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

  return { options, loading, error };
}
