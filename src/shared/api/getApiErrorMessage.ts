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
