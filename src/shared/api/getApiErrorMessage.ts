import { isAxiosError } from 'axios';

import type { ApiResponse } from './apiResponse.types';

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as Partial<ApiResponse> | undefined;
    if (data && typeof data.message === 'string' && data.message.trim()) {
      return data.message;
    }
  }
  return fallback;
}

export async function getBlobApiErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (isAxiosError(error) && error.response?.data instanceof Blob) {
    const text = await error.response.data.text().catch(() => '');
    if (text) {
      const parsed = parseApiResponse(text);
      if (parsed?.message?.trim()) return parsed.message;
    }
  }
  return getApiErrorMessage(error, fallback);
}

function parseApiResponse(text: string): Partial<ApiResponse> | null {
  try {
    return JSON.parse(text) as Partial<ApiResponse>;
  } catch {
    return null;
  }
}
