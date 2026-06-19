const APS_SDK_BASE_URL =
  'https://developer.api.autodesk.com/modelderivative/v2/viewers';

const version = import.meta.env.VITE_APS_VIEWER_VERSION || '7.*';

export const apsConfig = {
  env: import.meta.env.VITE_APS_VIEWER_ENV || 'AutodeskProduction',
  // 'derivativeV2' = SVF classic (khớp định dạng dịch 'svf' ở BE); SVF2 dùng 'streamingV2'.
  api: import.meta.env.VITE_APS_VIEWER_API || 'derivativeV2',
  version,
  scriptUrl: `${APS_SDK_BASE_URL}/${version}/viewer3D.min.js`,
  styleUrl: `${APS_SDK_BASE_URL}/${version}/style.min.css`,
} as const;
