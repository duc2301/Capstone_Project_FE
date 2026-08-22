import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  const q = query.trim();
  if (!q) return null;

  const { data } = await axiosInstance.get<ApiResponse<GeocodeResult | null>>('/geocoding/search', {
    params: { q },
    timeout: 20_000,
  });
  if (!data.isSuccess) throw new Error(data.message);

  return data.result ?? null;
}
