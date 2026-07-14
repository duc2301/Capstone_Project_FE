import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type { DocumentSearchResult } from '../model/documentSearch.types';

export const documentSearchApi = {
  /** Tìm tài liệu theo NGỮ NGHĨA trong 1 dự án (RAG: embed câu hỏi -> so vector với nội dung file).
   *  Timeout nới rộng vì BE phải gọi Ollama để embed câu hỏi (có thể vài giây). */
  search: (projectId: string, query: string) =>
    axiosInstance.get<ApiResponse<DocumentSearchResult[]>>('/documents/search', {
      params: { projectId, query },
      timeout: 60_000,
    }),
};
