import { useEffect, useState } from 'react';

import type { EffectivePermission } from '@/entities/folder';
import { folderApi } from '@/entities/folder';

const NO_PERMISSION = (folderId: string): EffectivePermission => ({
  folderId,
  canView: false,
  canEdit: false,
  canApprove: false,
});

const FULL_PERMISSION = (folderId: string): EffectivePermission => ({
  folderId,
  canView: true,
  canEdit: true,
  canApprove: true,
});

export function useFolderPermission(folderId: string | null, hasFullAccess: boolean) {
  const [fetched, setFetched] = useState<EffectivePermission | null>(null);

  useEffect(() => {
    if (!folderId || hasFullAccess) return;
    let stopped = false;

    void (async () => {
      try {
        const res = await folderApi.getMyPermission(folderId);
        if (stopped) return;
        const row = res.data.isSuccess ? res.data.result?.permission ?? null : null;
        setFetched(
          row
            ? { folderId, canView: row.canView, canEdit: row.canEdit, canApprove: row.canApprove }
            : NO_PERMISSION(folderId),
        );
      } catch {
        if (!stopped) setFetched(NO_PERMISSION(folderId));
      }
    })();

    return () => { stopped = true; };
  }, [folderId, hasFullAccess]);

  if (!folderId) return { permission: null };
  if (hasFullAccess) return { permission: FULL_PERMISSION(folderId) };
  if (fetched && fetched.folderId === folderId) return { permission: fetched };
  return { permission: NO_PERMISSION(folderId) };
}
