export const FILE_KINDS = [
  'pdf', 'ifc', 'rvt', 'dwg', 'model', 'doc', 'sheet', 'slide', 'image', 'archive', 'other',
] as const;
export type FileKind = (typeof FILE_KINDS)[number];

const EXT_KIND: Record<string, FileKind> = {
  pdf: 'pdf',
  ifc: 'ifc', ifczip: 'ifc', ifcxml: 'ifc',
  rvt: 'rvt', rfa: 'rvt', rte: 'rvt',
  dwg: 'dwg', dxf: 'dwg', dwt: 'dwg',
  nwd: 'model', nwc: 'model', nwf: 'model', dgn: 'model', skp: 'model',
  doc: 'doc', docx: 'doc', odt: 'doc', rtf: 'doc',
  xls: 'sheet', xlsx: 'sheet', xlsm: 'sheet', csv: 'sheet', ods: 'sheet',
  ppt: 'slide', pptx: 'slide', odp: 'slide',
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', bmp: 'image', webp: 'image', svg: 'image', tif: 'image', tiff: 'image',
  zip: 'archive', rar: 'archive', '7z': 'archive',
};

const KIND_LABEL: Record<FileKind, string> = {
  pdf: 'PDF', ifc: 'IFC', rvt: 'RVT', dwg: 'DWG', model: '3D',
  doc: 'DOC', sheet: 'XLS', slide: 'PPT', image: 'IMG', archive: 'ZIP', other: 'FILE',
};

const KIND_COLOR: Record<FileKind, string> = {
  pdf: 'var(--color-file-pdf)',
  ifc: 'var(--color-file-ifc)',
  rvt: 'var(--color-file-rvt)',
  dwg: 'var(--color-file-dwg)',
  model: 'var(--color-file-model)',
  doc: 'var(--color-file-doc)',
  sheet: 'var(--color-file-sheet)',
  slide: 'var(--color-file-slide)',
  image: 'var(--color-file-image)',
  archive: 'var(--color-file-archive)',
  other: 'var(--color-file-other)',
};

export function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  if (dot <= 0 || dot === fileName.length - 1) return '';
  return fileName.slice(dot + 1).toLowerCase();
}

export function fileKindOf(fileName: string, fallback?: string | null): FileKind {
  const ext = extensionOf(fileName) || (fallback ?? '').toLowerCase();
  return EXT_KIND[ext] ?? 'other';
}

export function fileKindLabel(kind: FileKind): string {
  return KIND_LABEL[kind];
}

export function fileKindColor(kind: FileKind): string {
  return KIND_COLOR[kind];
}
