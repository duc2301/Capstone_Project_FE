import type { ApiResponse } from '@/shared/api';
import { axiosInstance, getApiErrorMessage } from '@/shared/api';

import type {
  Certificate,
  PdfPageInfo,
  SaveSignaturePositionPayload,
  SignatureInfo,
  SignaturePosition,
  SignatureTransactionStatus,
  SignedFileInfo,
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

type RawSignaturePosition = SignaturePosition;
interface RawSignedFileInfo {
  fileItemId: string;
  fileName?: string | null;
  signedVersionId: string;
  versionNumber: number;
  storagePath?: string | null;
  url?: string | null;
  signedAt?: string | null;
  signedBy?: string | null;
  certificateSerial?: string | null;
  transactionId?: string | null;
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

function mapTransactionStatus(item: RawTransactionStatusInfo, message?: string | null): TransactionStatusInfo {
  return {
    transactionId: item.transactionId,
    status: normalizeStatus(item.status),
    message: message ?? null,
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

function mapSignedFileInfo(item: RawSignedFileInfo): SignedFileInfo {
  return {
    fileItemId: item.fileItemId,
    fileName: item.fileName ?? null,
    signedVersionId: item.signedVersionId,
    versionNumber: item.versionNumber,
    storagePath: item.storagePath ?? null,
    url: item.url ?? null,
    signedAt: item.signedAt ?? null,
    signedBy: item.signedBy ?? null,
    certificateSerial: item.certificateSerial ?? null,
    transactionId: item.transactionId ?? null,
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

    return mapTransactionStatus(unwrap(data), data.message);
  },

  getSignatureInfo: async (approvalId: string): Promise<SignatureInfo> => {
    const { data } = await axiosInstance.get<ApiResponse<RawSignatureInfo>>(
      `/approvals/${approvalId}/vnpt-smartca/signature`,
    );

    return mapSignatureInfo(unwrap(data));
  },

  saveSignaturePosition: async (
    fileId: string,
    payload: SaveSignaturePositionPayload,
  ): Promise<SignaturePosition> => {
    const { data } = await axiosInstance.post<ApiResponse<RawSignaturePosition>>(
      `/file-items/${fileId}/signature-position`,
      payload,
    );

    return unwrap(data);
  },

  getSignaturePosition: async (fileId: string): Promise<SignaturePosition> => {
    const { data } = await axiosInstance.get<ApiResponse<RawSignaturePosition>>(
      `/file-items/${fileId}/signature-position`,
    );

    return unwrap(data);
  },

  getPdfPageInfo: async (fileId: string, pageNumber = 1): Promise<PdfPageInfo> => {
    const { data } = await axiosInstance.get<ApiResponse<PdfPageInfo>>(
      `/file-items/${fileId}/pdf-page-info`,
      { params: { pageNumber } },
    );

    return unwrap(data);
  },

  generateSignedPdf: async (approvalId: string): Promise<SignedFileInfo> => {
    const { data } = await axiosInstance.post<ApiResponse<RawSignedFileInfo>>(
      `/approvals/${approvalId}/generate-signed-pdf`,
    );

    return mapSignedFileInfo(unwrap(data));
  },

  getSignedFile: async (fileId: string): Promise<SignedFileInfo> => {
    const { data } = await axiosInstance.get<ApiResponse<RawSignedFileInfo>>(
      `/file-items/${fileId}/signed-file`,
    );

    return mapSignedFileInfo(unwrap(data));
  },
};

/* Lỗi BE khi actor không đủ điều kiện thao tác Team-Leader-only (đặt vị trí ký, sinh PDF đã ký...) —
 * dịch rõ để phân biệt 2 nguyên nhân khác nhau: (1) folder CHƯA được cấp quyền CanApprove cho nhóm
 * nào cả (lỗi cấu hình phân quyền, không phải do actor thiếu vai trò Leader); (2) đã có nhóm được
 * cấp quyền nhưng actor không phải Leader của nhóm đó. */
const TEAM_LEADER_MESSAGES: Record<string, string> = {
  'No group has been granted approve permission on this folder yet. Please ask the project Admin to configure it.':
    'Thư mục này chưa được cấp quyền Duyệt (CanApprove) cho nhóm nào cả. Hãy nhờ quản trị dự án vào "Phân quyền" cấu hình quyền Duyệt cho đúng nhóm phụ trách trước khi thao tác.',
  'Only the Team Leader can perform this action.':
    'Bạn chưa được phân quyền để thực hiện thao tác này trên tài liệu này.',
};

function translateTeamLeaderMessage(message: string): string {
  const knownKey = Object.keys(TEAM_LEADER_MESSAGES).find((m) => message.includes(m));
  return knownKey ? TEAM_LEADER_MESSAGES[knownKey] : message;
}

export function smartcaErrorMessage(err: unknown, fallback: string): string {
  const apiMessage = getApiErrorMessage(err, '');
  if (apiMessage) return translateTeamLeaderMessage(apiMessage);
  // unwrap() ném Error(data.message) khi API trả isSuccess:false (không phải lỗi HTTP) — vẫn cần dịch
  // các thông báo Team-Leader-only ở đây, không chỉ nhánh apiMessage phía trên.
  if (err instanceof Error && err.message) return translateTeamLeaderMessage(err.message);
  return fallback;
}
