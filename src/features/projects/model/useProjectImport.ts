import { useCallback, useState } from 'react';

import type { ProjectImportPreview } from '@/entities/project';
import { projectApi } from '@/entities/project';
import { getApiErrorMessage, getBlobApiErrorMessage } from '@/shared/api';
import { downloadBlob } from '@/shared/lib/download';
import { t } from '@/shared/lib/i18n';

const TEMPLATE_FILE_NAME = 'khoi-tao-du-an-mau.xlsx';

interface UseProjectImportReturn {
  downloading: boolean;
  parsing: boolean;
  downloadTemplate: () => Promise<void>;
  parseFile: (file: File) => Promise<ProjectImportPreview>;
}

export function useProjectImport(): UseProjectImportReturn {
  const [downloading, setDownloading] = useState(false);
  const [parsing, setParsing] = useState(false);

  const downloadTemplate = useCallback(async () => {
    setDownloading(true);
    try {
      const { data } = await projectApi.downloadImportTemplate();
      downloadBlob(data as Blob, TEMPLATE_FILE_NAME);
    } catch (err) {
      throw new Error(await getBlobApiErrorMessage(err, t('projects.import.templateError')), { cause: err });
    } finally {
      setDownloading(false);
    }
  }, []);

  const parseFile = useCallback(async (file: File): Promise<ProjectImportPreview> => {
    setParsing(true);
    try {
      const { data } = await projectApi.importPreview(file);
      if (!data.isSuccess || !data.result) throw new Error(data.message || t('projects.import.parseError'));
      return data.result;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, t('projects.import.parseError')), { cause: err });
    } finally {
      setParsing(false);
    }
  }, []);

  return { downloading, parsing, downloadTemplate, parseFile };
}
