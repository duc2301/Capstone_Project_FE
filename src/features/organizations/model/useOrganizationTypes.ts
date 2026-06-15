import { useCallback, useEffect, useState } from 'react';

import type { CreateOrganizationTypePayload, OrganizationType } from '@/entities/organization-type';
import { organizationTypeApi } from '@/entities/organization-type';

export function useOrganizationTypes() {
  const [orgTypes, setOrgTypes] = useState<OrganizationType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrgTypes = useCallback(async () => {
    try {
      const { data } = await organizationTypeApi.getAll();
      setOrgTypes(data.result ?? []);
    } catch {
      console.error('Failed to fetch organization types');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrgTypes();
  }, [fetchOrgTypes]);

  const createOrgType = useCallback(async (payload: CreateOrganizationTypePayload): Promise<OrganizationType | null> => {
    try {
      const { data } = await organizationTypeApi.create(payload);
      const created = data.result;
      if (created) {
        setOrgTypes((prev) => [...prev, created]);
      }
      return created ?? null;
    } catch {
      console.error('Failed to create organization type');
      return null;
    }
  }, []);

  return { orgTypes, loading, createOrgType, refetch: fetchOrgTypes };
}
