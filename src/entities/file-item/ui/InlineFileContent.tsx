import { t } from '@/shared/lib/i18n';

import { useInlineFileContent } from '../lib/useInlineFileContent';

interface Props {
  /** URL tương đối BE trả trong /view (dto.url) — sẽ fetch KÈM token rồi dựng Object URL. */
  url: string | null | undefined;
  contentType: string | null | undefined;
  fileName: string;
}

function InlineSpinner() {
  return (
    <svg className="h-7 w-7 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  );
}

function CenteredMessage({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-viewer-canvas px-6 text-center">
      <p className={`text-sm font-medium ${danger ? 'text-danger' : 'text-text-muted'}`}>{children}</p>
    </div>
  );
}

/**
 * Hiển thị file "xem trực tiếp" (kind = 'inline') sau khi đã fetch nội dung KÈM Bearer token:
 *  - image/*            -> <img> từ Object URL
 *  - text/plain, /csv   -> <pre> từ nội dung text
 *  - còn lại (pdf...)   -> <iframe> từ Object URL
 * Lấp đầy khung cha (h-full w-full); phần khung/nền do nơi gọi lo.
 */
export function InlineFileContent({ url, contentType, fileName }: Props) {
  const { src, text, status } = useInlineFileContent(url, contentType);

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-viewer-canvas">
        <InlineSpinner />
        <p className="text-sm text-text-muted">{t('common.loading')}</p>
      </div>
    );
  }

  if (status === 'unauthorized') {
    return <CenteredMessage danger>{t('fileView.noAccess')}</CenteredMessage>;
  }

  if (status === 'error') {
    return <CenteredMessage danger>{t('fileView.error')}</CenteredMessage>;
  }

  if (contentType?.startsWith('image/') && src) {
    return (
      <div className="flex h-full items-center justify-center overflow-auto bg-viewer-canvas p-8">
        <img src={src} alt={fileName} className="max-h-full max-w-full rounded-xl object-contain shadow-lg" />
      </div>
    );
  }

  if (text !== null) {
    return (
      <pre className="h-full w-full overflow-auto whitespace-pre-wrap break-words bg-white p-6 font-mono text-sm leading-relaxed text-text">
        {text}
      </pre>
    );
  }

  if (src) {
    return <iframe src={src} title={fileName} className="h-full w-full border-0 bg-white" />;
  }

  return null;
}
