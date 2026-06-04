/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APS_VIEWER_VERSION?: string;
  readonly VITE_APS_VIEWER_ENV?: string;
  readonly VITE_APS_VIEWER_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
