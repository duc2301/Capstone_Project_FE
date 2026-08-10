import { isAxiosError } from 'axios';

import { getBlobApiErrorMessage } from '@/shared/api';
import { t } from '@/shared/lib/i18n';

export function apiErrorMessage(err: unknown): string {
  if (isAxiosError<{ message?: string }>(err)) {
    const message = err.response?.data?.message;
    if (message) return message;
  }
  if (err instanceof Error && err.message) return err.message;
  return t('common.error');
}

export function blobApiErrorMessage(err: unknown): Promise<string> {
  return getBlobApiErrorMessage(err, t('common.error'));
}
