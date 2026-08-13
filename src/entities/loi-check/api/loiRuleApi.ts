import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';

import type { LoiAlias } from '../model/loiCheck.types';
import type {
  CreateLoiComponentPayload,
  CreateLoiParameterPayload,
  CreateLoiRuleSetPayload,
  CreateSystemLoiAliasPayload,
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

export const loiRuleApi = {
  getRuleSets: () => axiosInstance.get<ApiResponse<LoiRuleSet[]>>('/loi-rule-sets'),

  createRuleSet: (payload: CreateLoiRuleSetPayload) =>
    axiosInstance.post<ApiResponse<LoiRuleSet>>('/loi-rule-sets', payload),

  updateRuleSet: (ruleSetId: string, payload: UpdateLoiRuleSetPayload) =>
    axiosInstance.put<ApiResponse<LoiRuleSet>>(`/loi-rule-sets/${ruleSetId}`, payload),

  deleteRuleSet: (ruleSetId: string) =>
    axiosInstance.delete<ApiResponse<unknown>>(`/loi-rule-sets/${ruleSetId}`),

  setDefaultRuleSet: (ruleSetId: string) =>
    axiosInstance.put<ApiResponse<LoiRuleSet>>(`/loi-rule-sets/${ruleSetId}/default`),

  getComponents: (ruleSetId: string, discipline?: LoiDiscipline, search?: string) =>
    axiosInstance.get<ApiResponse<LoiRuleComponent[]>>(`/loi-rule-sets/${ruleSetId}/components`, {
      params: { discipline, search: search || undefined },
    }),

  createComponent: (ruleSetId: string, payload: CreateLoiComponentPayload) =>
    axiosInstance.post<ApiResponse<LoiRuleComponent>>(`/loi-rule-sets/${ruleSetId}/components`, payload),

  updateComponent: (ruleSetId: string, componentId: string, payload: UpdateLoiComponentPayload) =>
    axiosInstance.put<ApiResponse<LoiRuleComponent>>(
      `/loi-rule-sets/${ruleSetId}/components/${componentId}`,
      payload,
    ),

  deleteComponent: (ruleSetId: string, componentId: string) =>
    axiosInstance.delete<ApiResponse<unknown>>(`/loi-rule-sets/${ruleSetId}/components/${componentId}`),

  getMatrix: (ruleSetId: string, componentId: string) =>
    axiosInstance.get<ApiResponse<LoiMatrix>>(
      `/loi-rule-sets/${ruleSetId}/components/${componentId}/matrix`,
    ),

  saveMatrix: (ruleSetId: string, componentId: string, payload: SaveLoiMatrixPayload) =>
    axiosInstance.put<ApiResponse<LoiMatrix>>(
      `/loi-rule-sets/${ruleSetId}/components/${componentId}/matrix`,
      payload,
    ),

  renameVariant: (ruleSetId: string, componentId: string, payload: RenameLoiVariantPayload) =>
    axiosInstance.put<ApiResponse<LoiMatrix>>(
      `/loi-rule-sets/${ruleSetId}/components/${componentId}/variant`,
      payload,
    ),

  deleteVariant: (ruleSetId: string, componentId: string, variant: string | null) =>
    axiosInstance.delete<ApiResponse<LoiMatrix>>(
      `/loi-rule-sets/${ruleSetId}/components/${componentId}/variant`,
      { params: { variant: variant ?? undefined } },
    ),

  getParameters: (ruleSetId: string) =>
    axiosInstance.get<ApiResponse<LoiRuleParameter[]>>(`/loi-rule-sets/${ruleSetId}/parameters`),

  createParameter: (ruleSetId: string, payload: CreateLoiParameterPayload) =>
    axiosInstance.post<ApiResponse<LoiRuleParameter>>(`/loi-rule-sets/${ruleSetId}/parameters`, payload),

  updateParameter: (ruleSetId: string, parameterId: string, payload: UpdateLoiParameterPayload) =>
    axiosInstance.put<ApiResponse<LoiRuleParameter>>(
      `/loi-rule-sets/${ruleSetId}/parameters/${parameterId}`,
      payload,
    ),

  deleteParameter: (ruleSetId: string, parameterId: string) =>
    axiosInstance.delete<ApiResponse<unknown>>(`/loi-rule-sets/${ruleSetId}/parameters/${parameterId}`),

  getSystemAliases: (search?: string) =>
    axiosInstance.get<ApiResponse<LoiAlias[]>>('/loi-aliases', {
      params: { search: search || undefined },
    }),

  createSystemAlias: (payload: CreateSystemLoiAliasPayload) =>
    axiosInstance.post<ApiResponse<LoiAlias>>('/loi-aliases', payload),

  deleteSystemAlias: (aliasId: string) =>
    axiosInstance.delete<ApiResponse<unknown>>(`/loi-aliases/${aliasId}`),

  getProjectRuleSet: (projectId: string) =>
    axiosInstance.get<ApiResponse<LoiRuleSet | null>>(`/projects/${projectId}/loi-rule-set`),

  getSelectableRuleSets: (projectId: string) =>
    axiosInstance.get<ApiResponse<LoiRuleSet[]>>(`/projects/${projectId}/loi-rule-sets`),

  setProjectRuleSet: (projectId: string, ruleSetId: string | null) =>
    axiosInstance.put<ApiResponse<LoiRuleSet | null>>(`/projects/${projectId}/loi-rule-set`, { ruleSetId }),

  downloadImportTemplate: (ruleSetId: string) =>
    axiosInstance.get(`/loi-rule-sets/${ruleSetId}/import-template`, {
      responseType: 'blob',
      timeout: 120_000,
    }),

  importPreview: (file: File, ruleSetId: string | null) => {
    const form = new FormData();
    form.append('file', file);
    return axiosInstance.post<ApiResponse<LoiImportPreview>>('/loi-rule-sets/import-preview', form, {
      params: ruleSetId ? { ruleSetId } : undefined,
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120_000,
    });
  },

  importCommit: (payload: LoiImportCommitPayload) =>
    axiosInstance.post<ApiResponse<LoiRuleSet>>('/loi-rule-sets/import-commit', payload, {
      timeout: 180_000,
    }),
};
