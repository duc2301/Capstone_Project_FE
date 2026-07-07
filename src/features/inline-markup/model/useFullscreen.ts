import { useCallback, useEffect, useState, type RefObject } from 'react';

/** Hook hỗ trợ bật tắt full màn hình lẹ */
export function useFullscreen(ref: RefObject<HTMLElement | null>): {
  isFullscreen: boolean;
  toggle: () => void;
} {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === ref.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [ref]);

  const toggle = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  }, [ref]);

  return { isFullscreen, toggle };
}
