/* Kiểu dữ liệu khớp DTO của BE (JSON camelCase — System.Text.Json mặc định). */

/* ── Chi tiết cho trang cấu hình (admin) ───────────────── */

export interface NamingValue {
  id: string;
  code: string;
  displayName: string;
  description: string | null;
  orderIndex: number;
  isActive: boolean;
}

export interface NamingField {
  id: string;
  code: string;
  displayName: string;
  description: string | null;
  orderIndex: number;
  isRequired: boolean;
  isLocked: boolean;
  minLength: number | null;
  maxLength: number | null;
  fieldType: number;
  allowedValues: NamingValue[];
  /** Field bị khóa cứng vào đúng 1 value — BE luôn tự chèn value này khi sinh tên. */
  lockedValue: NamingValue | null;
}

export interface AssignedFolder {
  id: string;
  name: string;
}

export interface NamingConvention {
  id: string;
  projectId: string;
  name: string;
  delimiter: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  fields: NamingField[];
  assignedFolders: AssignedFolder[];
}

/* ── Payload gọn cho dialog upload (GET by-folder) ─────── */

export interface UploadNamingValue {
  id: string;
  code: string;
  displayName: string;
}

export interface UploadNamingField {
  id: string;
  displayName: string;
  orderIndex: number;
  required: boolean;
  locked: boolean;
  /** Chỉ có khi locked=true — hiển thị readonly, không render dropdown. */
  lockedValue: UploadNamingValue | null;
  /** Chỉ có khi locked=false — danh sách value cho dropdown. */
  values: UploadNamingValue[] | null;
}

export interface FolderNamingConvention {
  hasNamingConvention: boolean;
  namingConventionId: string | null;
  delimiter: string | null;
  fields: UploadNamingField[] | null;
}

/* ── Tùy chỉnh field theo folder ───────────────────────── */

/** 1 field của convention nhìn từ 1 folder: bắt buộc/khóa = luôn áp dụng; optional = bật/tắt. */
export interface FolderFieldOption {
  id: string;
  code: string;
  displayName: string;
  description: string | null;
  orderIndex: number;
  isRequired: boolean;
  isLocked: boolean;
  enabled: boolean;
}

export interface FolderFieldSelection {
  hasNamingConvention: boolean;
  namingConventionId: string | null;
  fields: FolderFieldOption[] | null;
}

/* ── Import xlsx (preview — chưa ghi DB) ───────────────── */

export interface ImportedNamingValue {
  code: string;
  displayName: string;
  description: string | null;
  orderIndex: number;
}

export interface ImportedNamingField {
  code: string;
  displayName: string;
  description: string | null;
  orderIndex: number;
  values: ImportedNamingValue[];
}

export interface NamingImportPreview {
  fields: ImportedNamingField[];
  warnings: string[];
}

/* ── Payload ghi ───────────────────────────────────────── */

export interface CreateNamingValuePayload {
  code: string;
  displayName: string;
  description?: string | null;
  orderIndex: number;
}

export interface CreateNamingFieldPayload {
  code: string;
  displayName: string;
  description?: string | null;
  orderIndex: number;
  isRequired: boolean;
  isLocked: boolean;
  minLength?: number | null;
  maxLength?: number | null;
  allowedValues: CreateNamingValuePayload[];
  /** Chỉ dùng khi isLocked=true: code của value (trong allowedValues) bị khóa cứng. */
  lockedValueCode?: string | null;
}

export interface CreateNamingConventionPayload {
  projectId: string;
  name: string;
  delimiter: string;
  fields: CreateNamingFieldPayload[];
}

export interface UpdateNamingConventionPayload {
  name?: string;
  delimiter?: string;
  isActive?: boolean;
}

export interface UpdateNamingFieldPayload {
  code?: string;
  displayName?: string;
  description?: string | null;
  orderIndex?: number;
  isRequired?: boolean;
  minLength?: number;
  maxLength?: number;
}

export interface UpdateNamingValuePayload {
  code?: string;
  displayName?: string;
  description?: string;
  orderIndex?: number;
  isActive?: boolean;
}

export interface AssignFoldersPayload {
  folderIds: string[];
  applyToSubfolders: boolean;
}

/** 1 lựa chọn của user trong dialog upload — gửi lên form field "NamingSelections" (JSON array). */
export interface NamingSelection {
  fieldId: string;
  valueId: string;
}

/** Delimiter BE hỗ trợ (khớp AllowedDelimiters trong NamingConventionService). */
export const NAMING_DELIMITERS = ['-', '_', '.'] as const;
