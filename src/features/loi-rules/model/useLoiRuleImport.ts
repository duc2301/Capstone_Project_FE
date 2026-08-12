import { useCallback, useState } from 'react';

import type { LoiImportCommitPayload, LoiImportPreview, LoiRuleSet } from '@/entities/loi-check';
import { loiRuleApi } from '@/entities/loi-check';
import { getApiErrorMessage, getBlobApiErrorMessage } from '@/shared/api';
import { downloadBlob } from '@/shared/lib/download';
import { t } from '@/shared/lib/i18n';

const TEMPLATE_FILE_NAME = 'bo-luat-kiem-loi.xlsx';

export function useLoiRuleImport() {
  const [preview, setPreview] = useState<LoiImportPreview | null>(null);
  const [parsing, setParsing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const downloadTemplate = useCallback(async (ruleSetId: string) => {
    setDownloading(true);
    try {
      const { data } = await loiRuleApi.downloadImportTemplate(ruleSetId);
      downloadBlob(data as Blob, TEMPLATE_FILE_NAME);
    } catch (err) {
      throw new Error(await getBlobApiErrorMessage(err, t('loiRule.import.templateError')), { cause: err });
    } finally {
      setDownloading(false);
    }
  }, []);

  const parseFile = useCallback(async (file: File, ruleSetId: string | null) => {
    setParsing(true);
    try {
      const { data } = await loiRuleApi.importPreview(file, ruleSetId);
      if (!data.isSuccess || !data.result) throw new Error(data.message);
      setPreview(data.result);
      return data.result;
    } catch (err) {
      throw new Error(getApiErrorMessage(err, t('loiRule.import.parseError')), { cause: err });
    } finally {
      setParsing(false);
    }
  }, []);

  const commit = useCallback(async (payload: LoiImportCommitPayload): Promise<LoiRuleSet> => {
    setCommitting(true);
    try {
      const { data } = await loiRuleApi.importCommit(payload);
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
