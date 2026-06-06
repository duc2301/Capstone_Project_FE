const APS_SDK_BASE_URL =
  'https://developer.api.autodesk.com/modelderivative/v2/viewers';

const version = import.meta.env.VITE_APS_VIEWER_VERSION || '7.*';

export const apsConfig = {
  env: import.meta.env.VITE_APS_VIEWER_ENV || 'AutodeskProduction',
  api: import.meta.env.VITE_APS_VIEWER_API || 'streamingV2',
  version,
  scriptUrl: `${APS_SDK_BASE_URL}/${version}/viewer3D.min.js`,
  styleUrl: `${APS_SDK_BASE_URL}/${version}/style.min.css`,
} as const;
