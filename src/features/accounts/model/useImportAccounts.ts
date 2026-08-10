import { useCallback, useState } from 'react';

import type { AccountImportResult } from '@/entities/account';
import { accountApi } from '@/entities/account';
import { downloadBlob } from '@/shared/lib/download';
import { t } from '@/shared/lib/i18n';

const TEMPLATE_FILE_NAME = 'account-import-template.xlsx';

interface UseImportAccountsReturn {
  downloadingTemplate: boolean;
  importing: boolean;
  downloadTemplate: () => Promise<void>;
  importFile: (file: File) => Promise<AccountImportResult>;
}

export function useImportAccounts(): UseImportAccountsReturn {
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [importing, setImporting] = useState(false);

  const downloadTemplate = useCallback(async () => {
    setDownloadingTemplate(true);
    try {
      const res = await accountApi.downloadImportTemplate();
      downloadBlob(res.data as Blob, TEMPLATE_FILE_NAME);
    } finally {
      setDownloadingTemplate(false);
    }
  }, []);

  const importFile = useCallback(async (file: File): Promise<AccountImportResult> => {
    setImporting(true);
    try {
      const { data } = await accountApi.importAccounts(file);
      if (!data.isSuccess || !data.result) {
        throw new Error(data.message || t('common.error'));
      }
      return data.result;
    } finally {
      setImporting(false);
    }
  }, []);

  return { downloadingTemplate, importing, downloadTemplate, importFile };
}
