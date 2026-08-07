export function buildDownloadName(name: string | null | undefined, format?: string | null): string {
  const baseName = (name ?? '').trim();
  const extension = (format ?? '').trim().replace(/^\./, '').toLowerCase();

  if (!extension) return baseName;

  return baseName.toLowerCase().endsWith(`.${extension}`) ? baseName : `${baseName}.${extension}`;
}

export function downloadBlob(data: Blob, fileName: string): void {
  const blobUrl = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}
