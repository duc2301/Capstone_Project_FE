import { useCallback, useState } from 'react';

import { projectApi } from '@/entities/project';
import { getBlobApiErrorMessage } from '@/shared/api';
import { downloadBlob, fileNameFromDisposition } from '@/shared/lib/download';
import { t } from '@/shared/lib/i18n';

const FALLBACK_BUNDLE_NAME = 'tai-lieu-du-an.zip';

export function useProjectFileBundle(projectId: string | undefined) {
  const [downloading, setDownloading] = useState(false);

  const downloadBundle = useCallback(async () => {
    if (!projectId) return;

    setDownloading(true);
    try {
      const response = await projectApi.downloadFileBundle(projectId);
      downloadBlob(
        response.data as Blob,
        fileNameFromDisposition(response.headers['content-disposition'], FALLBACK_BUNDLE_NAME),
      );
    } catch (error) {
      throw new Error(await getBlobApiErrorMessage(error, t('projectDetail.bundle.error')), {
        cause: error,
      });
    } finally {
      setDownloading(false);
    }
  }, [projectId]);

  return { downloading, downloadBundle };
}
