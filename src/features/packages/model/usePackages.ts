import { useCallback } from 'react';
import { contractPackageApi } from '@/entities/contractPackage';
import type { ContractPackage, CreateContractPackagePayload, UpdateContractPackagePayload } from '@/entities/contractPackage';
import { getApiErrorMessage } from '@/shared/api';
import { useAsyncData } from '@/shared/lib/async';
import { t } from '@/shared/lib/i18n';
import { sortByNewest } from '@/shared/lib/sort';

const EMPTY_PACKAGES: ContractPackage[] = [];

export function usePackages(projectId?: string) {
  const fetchPackages = useCallback(async () => {
    if (projectId) {
      const response = await contractPackageApi.getByProjectId(projectId);
      return sortByNewest(response.data?.result ?? [], (p) => p.createdAt);
    }
    const response = await contractPackageApi.getAll();
    return sortByNewest(response.data?.result?.items ?? [], (p) => p.createdAt);
  }, [projectId]);

  const { data: packages, loading, error, reload } = useAsyncData(
    projectId ?? '',
    fetchPackages,
    {
      fallback: EMPTY_PACKAGES,
      toErrorMessage: (err) => getApiErrorMessage(err, t('common.error')),
    },
  );

  const refetch = useCallback(async () => reload(), [reload]);

  const createPackage = async (payload: CreateContractPackagePayload) => {
    const res = await contractPackageApi.create(payload);
    await reload();
    return res.data?.result;
  };

  const updatePackage = async (id: string, payload: UpdateContractPackagePayload) => {
    const res = await contractPackageApi.update(id, payload);
    await reload();
    return res.data?.result;
  };

  const deletePackage = async (id: string) => {
    await contractPackageApi.delete(id);
    await reload();
  };

  return { packages, loading, error, createPackage, updatePackage, deletePackage, refetch };
}
