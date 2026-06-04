export const SUPPORTED_EXTENSIONS = [
  '.dwg',
  '.dxf',
  '.rvt',
  '.pln',
  '.skp',
  '.ifc',
  '.nwd',
  '.nwc',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
] as const;

export const ACCEPT_ATTRIBUTE = SUPPORTED_EXTENSIONS.join(',');

export const getFileExtension = (fileName: string): string => {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex === -1 ? '' : fileName.slice(dotIndex).toLowerCase();
};

export const isSupportedFile = (fileName: string): boolean =>
  (SUPPORTED_EXTENSIONS as readonly string[]).includes(getFileExtension(fileName));
