import { useState } from 'react';

import { useInlineFileContent } from '@/entities/file-item';
import { t } from '@/shared/lib/i18n';
import type { SurfaceBinding } from '../model/binding';
import { MarkupSurface } from './MarkupSurface';

interface Props {
  url: string;
  contentType: string | null;
  alt: string;
  zoom: number;
  binding: SurfaceBinding;
}

/** Canh đúng tỉ lệ ảnh rồi đặt markup đè lên cho chuẩn */
export function ImageStage({ url, contentType, alt, zoom, binding }: Props) {
  const [aspect, setAspect] = useState<number | null>(null);
  // Ảnh xem qua view-content cần Bearer token -> fetch rồi dựng Object URL, không gán thẳng url vào src.
  const { src, status } = useInlineFileContent(url, contentType);

  if (status !== 'ready' || !src) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-text-muted">
        {status === 'unauthorized' ? t('fileView.noAccess') : status === 'error' ? t('fileView.error') : t('common.loading')}
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-start justify-center overflow-auto p-4">
      <div
        className="relative shrink-0 shadow-card"
        style={{ width: `${zoom * 100}%`, maxWidth: aspect ? undefined : '100%', aspectRatio: aspect ?? undefined }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth && img.naturalHeight) setAspect(img.naturalWidth / img.naturalHeight);
          }}
          className="block h-full w-full select-none object-contain"
        />
        {aspect ? (
          <MarkupSurface pageNumber={null} {...binding} />
        ) : (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-text-muted">
            {t('common.loading')}
          </div>
        )}
      </div>
    </div>
  );
}
