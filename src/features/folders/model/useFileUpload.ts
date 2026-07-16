import { useCallback } from 'react';

import { FileType, fileItemApi } from '@/entities/file-item';
import type { NamingSelection } from '@/entities/naming-convention';

/* Suy ra FileType từ đuôi tệp (khớp ràng buộc đuôi↔loại ở BE) */
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
      selections?: NamingSelection[],
      bypassNaming?: boolean,
    ) => {
      const form = new FormData();
      form.append('file', file);
      form.append('FolderId', folderId);
      form.append('FileType', String(inferFileType(file.name)));
      if (bypassNaming) {
        // Tệp ngoại lệ (văn bản hành chính...): giữ tên gốc, bỏ qua quy tắc đặt tên.
        form.append('BypassNamingConvention', 'true');
      } else if (selections && selections.length > 0) {
        // Folder có naming convention: BE sinh tên file từ các lựa chọn này (field khóa BE tự chèn).
        form.append('NamingSelections', JSON.stringify(selections));
      }
      return fileItemApi.upload(form, onProgress);
    },
    [],
  );

  return { uploadToFolder };
}
