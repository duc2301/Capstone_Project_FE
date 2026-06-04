import { useCallback, useEffect, useState } from 'react';

import type { CreateOrganizationPayload, Organization, UpdateOrganizationPayload } from '@/entities/organization';
import { organizationApi } from '@/entities/organization';
import { t } from '@/shared/lib/i18n';

interface UseOrganizationsReturn {
  organizations: Organization[];
  loading: boolean;
  error: string | null;
  fetchOrganizations: () => Promise<void>;
  createOrganization: (payload: CreateOrganizationPayload) => Promise<void>;
  updateOrganization: (id: string, payload: UpdateOrganizationPayload) => Promise<void>;
  deleteOrganization: (id: string) => Promise<void>;
}

export function useOrganizations(): UseOrganizationsReturn {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await organizationApi.getAll();
      setOrganizations(data.result ?? []);
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrganization = useCallback(async (payload: CreateOrganizationPayload) => {
    await organizationApi.create(payload);
    await fetchOrganizations();
  }, [fetchOrganizations]);

  const updateOrganization = useCallback(async (id: string, payload: UpdateOrganizationPayload) => {
    await organizationApi.update(id, payload);
    await fetchOrganizations();
  }, [fetchOrganizations]);

  const deleteOrganization = useCallback(async (id: string) => {
    await organizationApi.remove(id);
    await fetchOrganizations();
  }, [fetchOrganizations]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await organizationApi.getAll();
        if (!cancelled) setOrganizations(data.result ?? []);
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

  return { organizations, loading, error, fetchOrganizations, createOrganization, updateOrganization, deleteOrganization };
}
