export const MarkupType = {
  Rectangle: 0,
  Ellipse: 1,
  Arrow: 2,
  Polyline: 3,
  Freehand: 4,
  Text: 5,
  Callout: 6,
  Cloud: 7,
  Viewpoint: 8,
} as const;
export type MarkupType = (typeof MarkupType)[keyof typeof MarkupType];

export const MarkupSetStatus = {
  Open: 0,
  Resolved: 1,
  Closed: 2,
} as const;
export type MarkupSetStatus = (typeof MarkupSetStatus)[keyof typeof MarkupSetStatus];

export const FileNoteStatus = {
  Open: 0,
  Resolved: 1,
} as const;
export type FileNoteStatus = (typeof FileNoteStatus)[keyof typeof FileNoteStatus];

export interface FileNote {
  id: string;
  markupSetId: string;
  fileVersionId: string;
  pageNumber: number | null;
  markupType: MarkupType;
  coordinateJson: string;
  styleJson: string | null;
  content: string | null;
  viewpointStateJson: string | null;
  markupSvg: string | null;
  thumbnailDataUrl: string | null;
  status: FileNoteStatus;
  authorAccountId: string | null;
  authorName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface MarkupSet {
  id: string;
  fileItemId: string;
  fileVersionId: string;
  versionNumber: number;
  title: string | null;
  status: MarkupSetStatus;
  issueId: string | null;
  snapshotStoragePath: string | null;
  createdByAccountId: string | null;
  createdByName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  noteCount: number;
  openNoteCount: number;
  notes: FileNote[];
}

export interface CreateMarkupSetPayload {
  fileItemId: string;
  fileVersionId?: string | null;
  title?: string | null;
  issueId?: string | null;
}

export interface CreateFileNotePayload {
  markupType: MarkupType;
  pageNumber?: number | null;
  coordinateJson?: string | null;
  styleJson?: string | null;
  content?: string | null;
  viewpointStateJson?: string | null;
  markupSvg?: string | null;
  thumbnailDataUrl?: string | null;
}

export interface UpdateFileNotePayload {
  markupType?: MarkupType;
  pageNumber?: number | null;
  coordinateJson?: string;
  styleJson?: string | null;
  content?: string | null;
  status?: FileNoteStatus;
}
