import type { CreateFileNotePayload, FileNote, UpdateFileNotePayload } from '@/entities/file-note';
import type { MarkupStyle, ToolId } from './tools';

/** Gói props điều khiển markup, truyền xuống các "stage" (ảnh/PDF) rồi tới MarkupSurface. */
export interface SurfaceBinding {
  notes: FileNote[];
  tool: ToolId;
  style: MarkupStyle;
  readOnly?: boolean;
  selectedId: string | null;
  onSelectedIdChange: (id: string | null) => void;
  onCreate: (payload: CreateFileNotePayload) => Promise<FileNote | null>;
  onUpdate: (noteId: string, payload: UpdateFileNotePayload) => void;
  onDelete: (noteId: string) => void;
  onToolReset: () => void;
}
