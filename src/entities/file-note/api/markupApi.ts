import type { ApiResponse } from '@/shared/api';
import { axiosInstance } from '@/shared/api';
import type {
  CreateFileNotePayload,
  CreateMarkupSetPayload,
  FileNote,
  MarkupSet,
  MarkupSetStatus,
  UpdateFileNotePayload,
} from '../model/fileNote.types';


export const markupApi = {
  createSet: (payload: CreateMarkupSetPayload) =>
    axiosInstance.post<ApiResponse<MarkupSet>>('/markups/sets', payload),

  getSetsByFile: (fileItemId: string) =>
    axiosInstance.get<ApiResponse<MarkupSet[]>>(`/markups/sets/by-file/${fileItemId}`),

  getSetsByIssue: (issueId: string) =>
    axiosInstance.get<ApiResponse<MarkupSet[]>>(`/markups/sets/by-issue/${issueId}`),

  getSetDetail: (setId: string) =>
    axiosInstance.get<ApiResponse<MarkupSet>>(`/markups/sets/${setId}`),

  updateSetStatus: (setId: string, status: MarkupSetStatus) =>
    axiosInstance.post<ApiResponse<MarkupSet>>(`/markups/sets/${setId}/status`, { status }),

  linkToIssue: (setId: string, issueId: string | null) =>
    axiosInstance.post<ApiResponse<MarkupSet>>(`/markups/sets/${setId}/issue`, { issueId }),

  addNote: (setId: string, payload: CreateFileNotePayload) =>
    axiosInstance.post<ApiResponse<FileNote>>(`/markups/sets/${setId}/notes`, payload),

  updateNote: (noteId: string, payload: UpdateFileNotePayload) =>
    axiosInstance.put<ApiResponse<FileNote>>(`/markups/notes/${noteId}`, payload),

  deleteNote: (noteId: string) =>
    axiosInstance.delete<ApiResponse<unknown>>(`/markups/notes/${noteId}`),
};
