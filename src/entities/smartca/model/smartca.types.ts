export type SignatureTransactionStatus = 'Created' | 'WaitingConfirm' | 'Signed' | 'Failed' | 'Expired';

export interface Certificate {
  serialNumber: string;
  subject: string | null;
  issuer: string | null;
  validFrom: string | null;
  validTo: string | null;
  status: string | null;
}

export interface SignRequestResult {
  approvalRequestId: string;
  fileItemId: string;
  transactionId: string;
  sad: string | null;
  status: SignatureTransactionStatus;
  message: string | null;
}

export interface TransactionStatusInfo {
  transactionId: string;
  status: SignatureTransactionStatus;
  message: string | null;
  rawResponse: string | null;
}

export interface SignatureInfo {
  approvalRequestId: string;
  fileItemId: string;
  transactionId: string;
  certificateSerial: string | null;
  signedBy: string | null;
  signedAt: string | null;
  status: SignatureTransactionStatus;
}

export interface SignaturePosition {
  id: string;
  fileItemId: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface SaveSignaturePositionPayload {
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfPageInfo {
  fileItemId: string;
  pageNumber: number;
  pageCount: number;
  width: number;
  height: number;
}

export interface SignedFileInfo {
  fileItemId: string;
  fileName: string | null;
  signedVersionId: string;
  versionNumber: number;
  storagePath: string | null;
  url: string | null;
  signedAt: string | null;
  signedBy: string | null;
  certificateSerial: string | null;
  transactionId: string | null;
}
