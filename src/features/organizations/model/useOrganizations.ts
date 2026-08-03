import { useCallback } from 'react';

import type { CreateOrganizationPayload, Organization, UpdateOrganizationPayload } from '@/entities/organization';
import { organizationApi, useOrganizationList } from '@/entities/organization';

interface UseOrganizationsReturn {
  organizations: Organization[];
  loading: boolean;
  error: string | null;
  fetchOrganizations: () => Promise<void>;
  createOrganization: (payload: CreateOrganizationPayload) => Promise<Organization | null>;
  updateOrganization: (id: string, payload: UpdateOrganizationPayload) => Promise<void>;
  deleteOrganization: (id: string) => Promise<void>;
}

export function useOrganizations(): UseOrganizationsReturn {
  const { organizations, loading, error, refresh } = useOrganizationList();

  const createOrganization = useCallback(async (payload: CreateOrganizationPayload) => {
    const res = await organizationApi.create(payload);
    await refresh();
    return res.data.result;
  }, [refresh]);

  const updateOrganization = useCallback(async (id: string, payload: UpdateOrganizationPayload) => {
    await organizationApi.update(id, payload);
    await refresh();
  }, [refresh]);

  const deleteOrganization = useCallback(async (id: string) => {
    await organizationApi.remove(id);
    await refresh();
  }, [refresh]);

  return {
    organizations,
    loading,
    error,
    fetchOrganizations: refresh,
    createOrganization,
    updateOrganization,
    deleteOrganization,
  };
}
