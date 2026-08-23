export const ProjectStatus = {
  Active: 0,
  Completed: 1,
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

/** Tên trạng thái gửi cho BE lọc (`?status=`). BE nhận cả tên lẫn số; ta gửi tên. */
export type ProjectStatusName = 'Active' | 'Completed';

/** Tham số truy vấn cho GET /projects (đã phân trang + lọc phía server).
 *  Trường rỗng phải được bỏ hẳn khỏi query string. */
export interface ProjectListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ProjectStatusName;
  ownerOrganizationId?: string;
}

/** Envelope phân trang của GET /projects — `items` là dữ liệu trang hiện tại,
 *  còn `totalCount`/`totalPages` phản ánh TẬP ĐÃ LỌC. */
export interface ProjectPage {
  items: Project[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ProjectLocation {
  id: string;
  projectId: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
  createdAt?: string | null;
}

export interface Project {
  id: string;
  projectName: string;
  projectCode?: string | null;
  projectImageUrl?: string | null;
  projectDescription?: string | null;
  managerAccountId?: string | null;
  status: ProjectStatus;
  ownerOrganizationId?: string | null;
  ownerOrganizationName?: string | null;
  contactAddress?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  location?: ProjectLocation | null;
}

export interface CreateProjectPayload {
  projectName: string;
  projectCode?: string;
  projectDescription?: string;
  ownerOrganizationId?: string;
  contactAddress?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

/** Mọi trường tùy chọn — chỉ gửi cái muốn đổi. `address/latitude/longitude`
 *  cập nhật địa điểm công trình (ProjectLocation), khác `contactAddress`. */
export interface UpdateProjectPayload {
  projectName?: string;
  projectCode?: string;
  projectDescription?: string;
  managerAccountId?: string;
  status?: ProjectStatus;
  ownerOrganizationId?: string;
  contactAddress?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

/* ── Khởi tạo nhanh từ BEP: AI đọc file BEP -> field prefill cho stepper ── */
export interface BepGroup {
  name: string;
  description?: string | null;
  partnerOrganizationName?: string | null;
}

export interface BepPackage {
  name: string;
  description?: string | null;
  contractValue?: number | null;
  currency?: string | null;
  contractorOrganizationName?: string | null;
}

export interface BepParseResult {
  projectName?: string | null;
  projectCode?: string | null;
  projectDescription?: string | null;
  ownerOrganizationName?: string | null;
  contactAddress?: string | null;
  address?: string | null;
  groups: BepGroup[];
  packages: BepPackage[];
  extractionEmpty: boolean;
}

export interface AssignManagerPayload {
  accountId: string;
}

export const ProjectParticipantRole = {
  ProjectAdmin: 0,
  Member: 1,
} as const;
export type ProjectParticipantRole =
  (typeof ProjectParticipantRole)[keyof typeof ProjectParticipantRole];

export const ProjectParticipantStatus = {
  Active: 0,
  Inactive: 1,
} as const;
export type ProjectParticipantStatus =
  (typeof ProjectParticipantStatus)[keyof typeof ProjectParticipantStatus];

export interface Participant {
  id: string;
  projectId: string;
  groupId: string;
  role: ProjectParticipantRole;
  status: ProjectParticipantStatus;
  joinedAt?: string | null;
}

export interface UpdateParticipantStatusPayload {
  status: ProjectParticipantStatus;
}

export interface AddParticipantPayload {
  groupId: string;
  role: ProjectParticipantRole;
}

export interface AddParticipantsBulkPayload {
  participants: AddParticipantPayload[];
}
