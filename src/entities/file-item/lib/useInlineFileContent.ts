import { useEffect, useState } from 'react';

import { fileItemApi } from '../api/fileItemApi';

export type InlineContentStatus = 'idle' | 'loading' | 'ready' | 'unauthorized' | 'error';

export interface InlineFileContent {
  /** Nguồn để gắn vào <img>/<iframe> src (Object URL). null khi chưa tải xong / là text / lỗi. */
  src: string | null;
  /** Nội dung dạng text — chỉ với text/plain & text/csv. null với loại khác. */
  text: string | null;
  status: InlineContentStatus;
}

const IDLE: InlineFileContent = { src: null, text: null, status: 'idle' };
const LOADING: InlineFileContent = { src: null, text: null, status: 'loading' };

function isTextContentType(contentType: string | null | undefined): boolean {
  return contentType === 'text/plain' || contentType === 'text/csv';
}

function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function errorStatusOf(err: unknown): 'unauthorized' | 'error' {
  const status = (err as { response?: { status?: number } })?.response?.status;
  // 401/403 -> chưa đăng nhập / không có quyền xem file này: hiện UI "không truy cập" bình thường.
  return status === 401 || status === 403 ? 'unauthorized' : 'error';
}

/**
 * Nạp nội dung file xem-trực-tiếp qua endpoint view-content KÈM Bearer token, rồi trả về Object URL
 * (blob) để gắn vào <img>/<iframe> src — vì gán thẳng URL vào src sẽ KHÔNG kèm header Authorization
 * và nhận 401. Với text/plain & text/csv trả luôn nội dung text để render <pre>.
 *
 * URL tuyệt đối (http/https — vd link cũ dạng presigned) được dùng thẳng, không fetch, để an toàn
 * ngược. Object URL tự thu hồi khi url đổi / component unmount, tránh rò bộ nhớ (giữ per-view, không
 * cache qua phiên).
 */
export function useInlineFileContent(
  url: string | null | undefined,
  contentType: string | null | undefined,
): InlineFileContent {
  const shouldFetch = Boolean(url) && !isAbsoluteUrl(url as string);
  // Kết quả fetch được gắn "key" = url đang tải; khi url đổi, key lệch -> tự coi như đang tải lại
  // (không setState đồng bộ trong effect, tránh cascading render mà eslint chặn).
  const [fetched, setFetched] = useState<{ key: string; content: InlineFileContent } | null>(null);

  useEffect(() => {
    if (!url || !shouldFetch) return;

    let cancelled = false;
    let objectUrl: string | null = null;
    const wantsText = isTextContentType(contentType);

    (async () => {
      try {
        const res = await fileItemApi.getInlineContent(url);
        const blob = res.data as Blob;
        if (cancelled) return;
        if (wantsText) {
          const text = await blob.text();
          if (!cancelled) setFetched({ key: url, content: { src: null, text, status: 'ready' } });
        } else {
          objectUrl = URL.createObjectURL(blob);
          setFetched({ key: url, content: { src: objectUrl, text: null, status: 'ready' } });
        }
      } catch (err) {
        if (!cancelled) setFetched({ key: url, content: { src: null, text: null, status: errorStatusOf(err) } });
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, contentType, shouldFetch]);

  if (!url) return IDLE;
  if (!shouldFetch) return { src: url, text: null, status: 'ready' };
  // Chỉ dùng kết quả nếu đúng của url hiện tại — nếu không, đang tải (hoặc chờ tải url mới).
  if (fetched && fetched.key === url) return fetched.content;
  return LOADING;
}
