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

function decodePercentEncoded(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function fileNameFromDisposition(disposition: unknown, fallback: string): string {
  const raw = typeof disposition === 'string' ? disposition : '';

  const extended = /filename\*=[\w-]*''([^;]+)/i.exec(raw);
  if (extended) return decodePercentEncoded(extended[1].trim()) || fallback;

  const plain = /filename="?([^";]+)"?/i.exec(raw);
  return plain ? plain[1].trim() || fallback : fallback;
}
