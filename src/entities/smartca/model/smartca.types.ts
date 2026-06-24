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
