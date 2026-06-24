import type { ApiResponse } from '@/shared/api';
import { axiosInstance, getApiErrorMessage } from '@/shared/api';

import type {
  Certificate,
  SignatureInfo,
  SignatureTransactionStatus,
  SignRequestResult,
  TransactionStatusInfo,
} from '../model/smartca.types';

interface RawCertificate {
  serialNumber: string;
  subject?: string | null;
  issuer?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  status?: string | null;
}

interface RawSignRequestResult {
  approvalRequestId: string;
  fileItemId: string;
  transactionId: string;
  sad?: string | null;
  status: number | string;
  message?: string | null;
}

interface RawTransactionStatusInfo {
  transactionId: string;
  status: number | string;
  rawResponse?: string | null;
}

interface RawSignatureInfo {
  approvalRequestId: string;
  fileItemId: string;
  transactionId: string;
  certificateSerial?: string | null;
  signedBy?: string | null;
  signedAt?: string | null;
  status: number | string;
}

function unwrap<T>(data: ApiResponse<T>): T {
  if (!data.isSuccess) throw new Error(data.message || 'Co loi xay ra.');
  return data.result as T;
}

function normalizeStatus(status: number | string): SignatureTransactionStatus {
  if (status === 0 || status === 'Created') return 'Created';
  if (status === 1 || status === 'WaitingConfirm') return 'WaitingConfirm';
  if (status === 2 || status === 'Signed') return 'Signed';
  if (status === 3 || status === 'Failed') return 'Failed';
  if (status === 4 || status === 'Expired') return 'Expired';
  return 'Failed';
}

function mapCertificate(item: RawCertificate): Certificate {
  return {
    serialNumber: item.serialNumber,
    subject: item.subject ?? null,
    issuer: item.issuer ?? null,
    validFrom: item.validFrom ?? null,
    validTo: item.validTo ?? null,
    status: item.status ?? null,
  };
}

function mapSignRequest(item: RawSignRequestResult): SignRequestResult {
  return {
    approvalRequestId: item.approvalRequestId,
    fileItemId: item.fileItemId,
    transactionId: item.transactionId,
    sad: item.sad ?? null,
    status: normalizeStatus(item.status),
    message: item.message ?? null,
  };
}

function mapTransactionStatus(item: RawTransactionStatusInfo): TransactionStatusInfo {
  return {
    transactionId: item.transactionId,
    status: normalizeStatus(item.status),
    rawResponse: item.rawResponse ?? null,
  };
}

function mapSignatureInfo(item: RawSignatureInfo): SignatureInfo {
  return {
    approvalRequestId: item.approvalRequestId,
    fileItemId: item.fileItemId,
    transactionId: item.transactionId,
    certificateSerial: item.certificateSerial ?? null,
    signedBy: item.signedBy ?? null,
    signedAt: item.signedAt ?? null,
    status: normalizeStatus(item.status),
  };
}

export const smartcaApi = {
  getCertificates: async (
    approvalId: string,
    userId: string,
    serialNumber?: string,
  ): Promise<Certificate[]> => {
    const { data } = await axiosInstance.post<ApiResponse<RawCertificate[]>>(
      `/approvals/${approvalId}/vnpt-smartca/certificates`,
      { userId, serialNumber: serialNumber || null },
    );

    return (unwrap(data) ?? []).map(mapCertificate);
  },

  createSignRequest: async (
    approvalId: string,
    userId: string,
    certificateSerial: string,
  ): Promise<SignRequestResult> => {
    const { data } = await axiosInstance.post<ApiResponse<RawSignRequestResult>>(
      `/approvals/${approvalId}/vnpt-smartca/sign-request`,
      { userId, certificateSerial },
    );

    return mapSignRequest(unwrap(data));
  },

  getTransactionStatus: async (
    approvalId: string,
    transactionId: string,
  ): Promise<TransactionStatusInfo> => {
    const { data } = await axiosInstance.get<ApiResponse<RawTransactionStatusInfo>>(
      `/approvals/${approvalId}/vnpt-smartca/transaction-status/${transactionId}`,
    );

    return mapTransactionStatus(unwrap(data));
  },

  getSignatureInfo: async (approvalId: string): Promise<SignatureInfo> => {
    const { data } = await axiosInstance.get<ApiResponse<RawSignatureInfo>>(
      `/approvals/${approvalId}/vnpt-smartca/signature`,
    );

    return mapSignatureInfo(unwrap(data));
  },
};

export function smartcaErrorMessage(err: unknown, fallback: string): string {
  const apiMessage = getApiErrorMessage(err, '');
  if (apiMessage) return apiMessage;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
