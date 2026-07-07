import { createContext, useContext, type Dispatch, type SetStateAction } from 'react';

import type { FileNote, FileNoteStatus } from '@/entities/file-note';
import type { SurfaceBinding } from './binding';
import type { MarkupStyle, ToolId } from './tools';

/** State markup 2D dùng chung giữa vùng xem (stage) và tab "Ghi chú" (panel). */
export interface InlineMarkupContextValue {
  fileItemId: string;
  url: string | null;
  contentType: string | null;
  fileName: string;
  isImage: boolean;

  notes: FileNote[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  resolveNote: (noteId: string, status: FileNoteStatus) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;

  tool: ToolId;
  setTool: Dispatch<SetStateAction<ToolId>>;
  style: MarkupStyle;
  applyStyle: (patch: Partial<MarkupStyle>) => void;
  selectedId: string | null;
  setSelectedId: Dispatch<SetStateAction<string | null>>;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  pageCount: number;
  setPageCount: Dispatch<SetStateAction<number>>;
  zoom: number;
  setZoom: Dispatch<SetStateAction<number>>;
  loadError: string | null;
  setLoadError: Dispatch<SetStateAction<string | null>>;

  binding: SurfaceBinding;
}

export const InlineMarkupContext = createContext<InlineMarkupContextValue | null>(null);

export function useInlineMarkupContext(): InlineMarkupContextValue {
  const ctx = useContext(InlineMarkupContext);
  if (!ctx) throw new Error('useInlineMarkupContext must be used within InlineMarkupProvider');
  return ctx;
}
