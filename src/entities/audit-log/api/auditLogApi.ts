import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type { AuditLogPage, AuditLogQuery } from '../model/auditLog.types';

export const auditLogApi = {
  /** Admin hệ thống: nhật ký MỌI dự án (lọc 1 dự án bằng query.projectId). */
  getSystem: (query: AuditLogQuery) =>
    axiosInstance.get<ApiResponse<AuditLogPage>>('/audit-logs/system', { params: query }),

  /** Admin hoặc PM dự án: TOÀN BỘ nhật ký của dự án. */
  getByProject: (projectId: string, query: AuditLogQuery) =>
    axiosInstance.get<ApiResponse<AuditLogPage>>(`/audit-logs/projects/${projectId}`, { params: query }),

  /** Thành viên: CHỈ nhật ký của thư mục mình có quyền xem hoặc của nhóm mình.
   *  BE lọc quyền trong query DB — FE không tự lọc. */
  getMine: (projectId: string, query: AuditLogQuery) =>
    axiosInstance.get<ApiResponse<AuditLogPage>>(`/audit-logs/projects/${projectId}/my`, { params: query }),

  getMyActivity: (query: AuditLogQuery) =>
    axiosInstance.get<ApiResponse<AuditLogPage>>('/audit-logs/me', { params: query }),

  getByFileItem: (fileItemId: string, query: AuditLogQuery) =>
    axiosInstance.get<ApiResponse<AuditLogPage>>(`/audit-logs/files/${fileItemId}`, { params: query }),

  exportSystem: (query: AuditLogQuery) =>
    axiosInstance.get('/audit-logs/system/export', {
      params: query,
      responseType: 'blob',
      timeout: 60_000,
    }),

  exportByProject: (projectId: string, query: AuditLogQuery) =>
    axiosInstance.get(`/audit-logs/projects/${projectId}/export`, {
      params: query,
      responseType: 'blob',
      timeout: 60_000,
    }),
};
