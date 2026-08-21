const FILE_VIEW = /^\/projects\/([^/]+)\/files\/([^/]+)\/view\/?$/;
const FILE_SUB_PAGE = /^\/projects\/([^/]+)\/files\/([^/]+)\/(?:issues\/[^/]+|loi-report)\/?$/;
const PACKAGE_DETAIL = /^\/projects\/([^/]+)\/packages\/[^/]+\/?$/;
const ORGANIZATION_DETAIL = /^\/organizations\/([^/]+)\/?$/;

function withFolder(path: string, folderId: string | null, separator: '?' | '&'): string {
  return folderId ? `${path}${separator}folder=${folderId}` : path;
}

export function resolveBackTarget(pathname: string, search: string): string | null {
  const folderId = new URLSearchParams(search).get('folder');

  const fileView = FILE_VIEW.exec(pathname);
  if (fileView) {
    return withFolder(`/projects/${fileView[1]}?tab=documents`, folderId, '&');
  }

  const fileSubPage = FILE_SUB_PAGE.exec(pathname);
  if (fileSubPage) {
    return withFolder(`/projects/${fileSubPage[1]}/files/${fileSubPage[2]}/view`, folderId, '?');
  }

  const packageDetail = PACKAGE_DETAIL.exec(pathname);
  if (packageDetail) return `/projects/${packageDetail[1]}?tab=packages`;

  if (ORGANIZATION_DETAIL.test(pathname)) return '/organizations';

  return null;
}

export function hasInAppHistory(): boolean {
  const state: unknown = window.history.state;
  if (typeof state !== 'object' || state === null) return false;
  const index = (state as { idx?: unknown }).idx;
  return typeof index === 'number' && index > 0;
}
