import { apsConfig } from '@/shared/config';
import { t } from '@/shared/lib/i18n';

let sdkPromise: Promise<void> | null = null;

const SDK_MARKER = 'aps-viewer';

const ensureStylesheet = (): void => {
  if (document.querySelector(`link[data-${SDK_MARKER}]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = apsConfig.styleUrl;
  link.dataset.apsViewer = 'true';
  document.head.appendChild(link);
};

export const loadViewerSdk = (): Promise<void> => {
  if (sdkPromise) return sdkPromise;

  if (window.Autodesk?.Viewing) {
    sdkPromise = Promise.resolve();
    return sdkPromise;
  }

  sdkPromise = new Promise<void>((resolve, reject) => {
    ensureStylesheet();

    const script = document.createElement('script');
    script.src = apsConfig.scriptUrl;
    script.async = true;
    script.dataset.apsViewer = 'true';
    script.onload = () => resolve();
    script.onerror = () => {
      sdkPromise = null;
      script.remove();
      reject(new Error(t('viewer.error.sdkLoadFailed')));
    };

    document.head.appendChild(script);
  });

  return sdkPromise;
};
