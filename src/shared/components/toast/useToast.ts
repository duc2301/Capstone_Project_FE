import { useCallback, useEffect, useRef, useState } from 'react';

import type { ToastMessage, ToastType } from './Toast';

const TOAST_DURATION_MS = 3000;

interface UseToastReturn {
  toast: ToastMessage | null;
  showToast: (msg: string, type?: ToastType) => void;
}

export function useToast(): UseToastReturn {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, type: ToastType = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ msg, type });
    timerRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  return { toast, showToast };
}
