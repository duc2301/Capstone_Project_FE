import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';

import type {
  CreateLoiComponentPayload,
  CreateLoiParameterPayload,
  LoiDiscipline,
  LoiImportCommitPayload,
  LoiImportPreview,
  LoiMatrix,
  LoiRuleComponent,
  LoiRuleParameter,
  LoiRuleSet,
  RenameLoiVariantPayload,
  SaveLoiMatrixPayload,
  UpdateLoiComponentPayload,
  UpdateLoiParameterPayload,
  UpdateLoiRuleSetPayload,
} from '../model/loiRule.types';

const base = (projectId: string) => `/projects/${projectId}/loi-rules`;

export const loiRuleApi = {
  getRuleSetSummary: (projectId: string) =>
    axiosInstance.get<ApiResponse<LoiRuleSet | null>>(`${base(projectId)}/summary`),

  getRuleSet: (projectId: string) =>
    axiosInstance.get<ApiResponse<LoiRuleSet | null>>(base(projectId)),

  updateRuleSet: (projectId: string, payload: UpdateLoiRuleSetPayload) =>
    axiosInstance.put<ApiResponse<LoiRuleSet>>(base(projectId), payload),

  deleteRuleSet: (projectId: string) =>
    axiosInstance.delete<ApiResponse<unknown>>(base(projectId)),

  getComponents: (projectId: string, discipline?: LoiDiscipline, search?: string) =>
    axiosInstance.get<ApiResponse<LoiRuleComponent[]>>(`${base(projectId)}/components`, {
      params: { discipline, search: search || undefined },
    }),

  createComponent: (projectId: string, payload: CreateLoiComponentPayload) =>
    axiosInstance.post<ApiResponse<LoiRuleComponent>>(`${base(projectId)}/components`, payload),

  updateComponent: (projectId: string, componentId: string, payload: UpdateLoiComponentPayload) =>
    axiosInstance.put<ApiResponse<LoiRuleComponent>>(
      `${base(projectId)}/components/${componentId}`,
      payload,
    ),

  deleteComponent: (projectId: string, componentId: string) =>
    axiosInstance.delete<ApiResponse<unknown>>(`${base(projectId)}/components/${componentId}`),

  getMatrix: (projectId: string, componentId: string) =>
    axiosInstance.get<ApiResponse<LoiMatrix>>(`${base(projectId)}/components/${componentId}/matrix`),

  saveMatrix: (projectId: string, componentId: string, payload: SaveLoiMatrixPayload) =>
    axiosInstance.put<ApiResponse<LoiMatrix>>(
      `${base(projectId)}/components/${componentId}/matrix`,
      payload,
    ),

  renameVariant: (projectId: string, componentId: string, payload: RenameLoiVariantPayload) =>
    axiosInstance.put<ApiResponse<LoiMatrix>>(
      `${base(projectId)}/components/${componentId}/variant`,
      payload,
    ),

  deleteVariant: (projectId: string, componentId: string, variant: string | null) =>
    axiosInstance.delete<ApiResponse<LoiMatrix>>(
      `${base(projectId)}/components/${componentId}/variant`,
      { params: { variant: variant ?? undefined } },
    ),

  getParameters: (projectId: string) =>
    axiosInstance.get<ApiResponse<LoiRuleParameter[]>>(`${base(projectId)}/parameters`),

  createParameter: (projectId: string, payload: CreateLoiParameterPayload) =>
    axiosInstance.post<ApiResponse<LoiRuleParameter>>(`${base(projectId)}/parameters`, payload),

  updateParameter: (projectId: string, parameterId: string, payload: UpdateLoiParameterPayload) =>
    axiosInstance.put<ApiResponse<LoiRuleParameter>>(
      `${base(projectId)}/parameters/${parameterId}`,
      payload,
    ),

  deleteParameter: (projectId: string, parameterId: string) =>
    axiosInstance.delete<ApiResponse<unknown>>(`${base(projectId)}/parameters/${parameterId}`),

  downloadImportTemplate: (projectId: string) =>
    axiosInstance.get(`${base(projectId)}/import-template`, {
      responseType: 'blob',
      timeout: 120_000,
    }),

  importPreview: (projectId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return axiosInstance.post<ApiResponse<LoiImportPreview>>(`${base(projectId)}/import-preview`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120_000,
    });
  },

  importCommit: (projectId: string, payload: LoiImportCommitPayload) =>
    axiosInstance.post<ApiResponse<LoiRuleSet>>(`${base(projectId)}/import-commit`, payload, {
      timeout: 180_000,
    }),
};
