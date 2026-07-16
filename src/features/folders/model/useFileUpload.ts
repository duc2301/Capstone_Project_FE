import { useCallback } from 'react';

import { FileType, fileItemApi } from '@/entities/file-item';

function inferFileType(fileName: string): FileType {
  const ext = (fileName.split('.').pop() ?? '').toLowerCase();
  if (ext === 'pdf') return FileType.Pdf;
  if (ext === 'ifc') return FileType.Ifc;
  if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext)) return FileType.Image;
  if (['dwg', 'dxf', 'rvt', 'nwc', 'nwd', 'dgn'].includes(ext)) return FileType.Cad;
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'txt'].includes(ext)) return FileType.Office;
  return FileType.Other;
}

export function useFileUpload() {
  const uploadToFolder = useCallback(
    (
      folderId: string,
      file: File,
      onProgress?: (pct: number) => void,
      relatedFileItemIds: string[] = [],
    ) => {
      const form = new FormData();
      form.append('file', file);
      form.append('FolderId', folderId);
      form.append('FileType', String(inferFileType(file.name)));
      for (const id of relatedFileItemIds) form.append('RelatedFileItemIds', id);
      return fileItemApi.upload(form, onProgress);
    },
    [],
  );

  return { uploadToFolder };
}
