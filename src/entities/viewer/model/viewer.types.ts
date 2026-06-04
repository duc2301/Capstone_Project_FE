export interface ViewerToken {
  accessToken: string;
  expiresIn: number;
}

export interface UploadModelResult {
  urn: string;
  fileName: string;
}

export type TranslationStatus =
  | 'pending'
  | 'inprogress'
  | 'success'
  | 'failed'
  | 'timeout';

export interface TranslationStatusResult {
  status: TranslationStatus;
  progress: string;
}
