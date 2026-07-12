import { useCallback, useEffect, useState } from 'react';
import { contractPackageApi } from '@/entities/contractPackage';
import type { ContractPackage, CreateContractPackagePayload, UpdateContractPackagePayload } from '@/entities/contractPackage';

export function usePackages(projectId?: string) {
  const [packages, setPackages] = useState<ContractPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = projectId 
        ? await contractPackageApi.getByProjectId(projectId)
        : await contractPackageApi.getAll();
      setPackages(response.data?.result || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch contract packages');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const createPackage = async (payload: CreateContractPackagePayload) => {
    const res = await contractPackageApi.create(payload);
    await fetchPackages();
    return res.data?.result;
  };

  const updatePackage = async (id: string, payload: UpdateContractPackagePayload) => {
    const res = await contractPackageApi.update(id, payload);
    await fetchPackages();
    return res.data?.result;
  };

  const deletePackage = async (id: string) => {
    await contractPackageApi.delete(id);
    await fetchPackages();
  };

  return { packages, loading, error, createPackage, updatePackage, deletePackage, refetch: fetchPackages };
}
