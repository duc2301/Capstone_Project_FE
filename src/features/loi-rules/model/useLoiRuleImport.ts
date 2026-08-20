import { useCallback, useState } from 'react';

import type { LoiImportCommitPayload, LoiImportPreview, LoiRuleSet } from '@/entities/loi-check';
import { loiRuleApi } from '@/entities/loi-check';
import { getApiErrorMessage, getBlobApiErrorMessage } from '@/shared/api';
import { downloadBlob } from '@/shared/lib/download';
import { t } from '@/shared/lib/i18n';

const TEMPLATE_FILE_NAME = 'bo-luat-phi-hinh-hoc-mau.xlsx';

export function useLoiRuleImport() {
  const [preview, setPreview] = useState<LoiImportPreview | null>(null);
  const [parsing, setParsing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const downloadTemplate = useCallback(async (projectId: string) => {
    setDownloading(true);
    try {
      const { data } = await loiRuleApi.downloadImportTemplate(projectId);
      downloadBlob(data as Blob, TEMPLATE_FILE_NAME);
    } catch (err) {
      throw new Error(await getBlobApiErrorMessage(err, t('loiRule.import.templateError')), { cause: err });
    } finally {
      setDownloading(false);
    }
  }, []);

  const parseFile = useCallback(async (projectId: string, file: File) => {
    setParsing(true);
    try {
      const { data } = await loiRuleApi.importPreview(projectId, file);
      if (!data.isSuccess || !data.result) throw new Error(data.message);
      setPreview(data.result);
      return data.result;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, t('loiRule.import.parseError')), { cause: err });
    } finally {
      setParsing(false);
    }
  }, []);

  const commit = useCallback(async (projectId: string, payload: LoiImportCommitPayload): Promise<LoiRuleSet> => {
    setCommitting(true);
    try {
      const { data } = await loiRuleApi.importCommit(projectId, payload);
      if (!data.isSuccess || !data.result) throw new Error(data.message);
      return data.result;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, t('loiRule.import.commitError')), { cause: err });
    } finally {
      setCommitting(false);
    }
  }, []);

  return { preview, parsing, committing, downloading, downloadTemplate, parseFile, commit };
}
