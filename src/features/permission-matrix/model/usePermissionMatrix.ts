import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';

import type {
  MatrixArea,
  MatrixCell,
  MatrixCellChange,
  MatrixCellResult,
  MatrixRow,
  PermissionLevel,
  PermissionMatrixResponse,
} from '@/entities/permission-matrix';
import { MatrixTargetType, PermissionLevel as Level, permissionMatrixApi } from '@/entities/permission-matrix';
import { getApiErrorMessage } from '@/shared/api';
import { t } from '@/shared/lib/i18n';
import { cellKey, cellSelectValue } from './permissionMatrixFormat';

export interface SaveOutcome {
  ok: boolean;
  message: string;
}

export interface UsePermissionMatrixReturn {
  data: PermissionMatrixResponse | null;
  loading: boolean;
  saving: boolean;
  /** Lỗi tải chung (không phải 403/404). */
  error: string | null;
  /** BE trả 403 — người dùng không được xem ma trận. */
  forbidden: boolean;
  /** BE trả 404 — không tìm thấy dự án. */
  notFound: boolean;
  /** Thông điệp kèm theo 403/404 từ envelope. */
  accessMessage: string | null;
  area: MatrixArea | undefined;
  setArea: (area: MatrixArea | undefined) => void;
  dirtyCount: number;
  /** Giá trị đang chọn của 1 ô (ưu tiên chỉnh sửa cục bộ). */
  valueOf: (row: MatrixRow, cell: MatrixCell) => PermissionLevel;
  isDirty: (targetId: string, projectParticipantId: string) => boolean;
  /** Đổi mức 1 ô. Bỏ qua ô không editable hoặc mức không hợp lệ. */
  setCell: (row: MatrixRow, cell: MatrixCell, level: PermissionLevel) => void;
  discardChanges: () => void;
  reload: () => Promise<void>;
  save: () => Promise<SaveOutcome>;
}

/* Kiểm tra mức hợp lệ theo loại đối tượng (mirror ràng buộc BE để đỡ round-trip). */
function isLevelAllowed(targetType: MatrixTargetType, level: PermissionLevel): boolean {
  if (targetType === MatrixTargetType.Folder) {
    return level === Level.NoAccess || level === Level.Read || level === Level.Write;
  }
  return level >= Level.Inherit && level <= Level.Write;
}

/* Dựng danh sách thay đổi (diff) từ dirty-set. */
function buildChanges(
  rowByTarget: Map<string, MatrixRow>,
  overrides: Map<string, PermissionLevel>,
): MatrixCellChange[] {
  const changes: MatrixCellChange[] = [];
  for (const [key, level] of overrides) {
    const [targetId, projectParticipantId] = key.split('|');
    const row = rowByTarget.get(targetId);
    if (!row || !isLevelAllowed(row.targetType, level)) continue;
    changes.push({ targetId, targetType: row.targetType, projectParticipantId, level });
  }
  return changes;
}

/* Hoà trạng thái đọc lại của các ô đã lưu vào state cục bộ (không refetch). */
function applyResults(
  prev: PermissionMatrixResponse,
  results: MatrixCellResult[],
): PermissionMatrixResponse {
  if (results.length === 0) return prev;
  const byRow = new Map<string, Map<string, MatrixCellResult>>();
  for (const r of results) {
    const bucket = byRow.get(r.targetId) ?? new Map<string, MatrixCellResult>();
    bucket.set(r.projectParticipantId, r);
    byRow.set(r.targetId, bucket);
  }

  const rows = prev.rows.map((row) => {
    const bucket = byRow.get(row.targetId);
    if (!bucket) return row;
    const cells = row.cells.map((cell) => {
      const res = bucket.get(cell.projectParticipantId);
      return res ? { ...cell, level: res.level, isInherited: res.isInherited } : cell;
    });
    return { ...row, cells };
  });

  return { ...prev, rows };
}

/* Kết quả 1 lần tải — tách khỏi setState để effect không gọi setState đồng bộ. */
type LoadOutcome =
  | { kind: 'ok'; data: PermissionMatrixResponse }
  | { kind: 'forbidden'; message: string }
  | { kind: 'notFound'; message: string }
  | { kind: 'error'; message: string };

async function fetchMatrixOutcome(projectId: string, area: MatrixArea | undefined): Promise<LoadOutcome> {
  try {
    const { data: res } = await permissionMatrixApi.getMatrix(projectId, area);
    if (!res.isSuccess || !res.result) return { kind: 'error', message: res.message || t('common.error') };
    return { kind: 'ok', data: res.result };
  } catch (err) {
    const status = isAxiosError(err) ? err.response?.status : undefined;
    const message = getApiErrorMessage(err, t('common.error'));
    if (status === 403) return { kind: 'forbidden', message };
    if (status === 404) return { kind: 'notFound', message };
    return { kind: 'error', message };
  }
}

export function usePermissionMatrix(projectId: string | undefined): UsePermissionMatrixReturn {
  const [data, setData] = useState<PermissionMatrixResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [accessMessage, setAccessMessage] = useState<string | null>(null);
  const [area, setAreaState] = useState<MatrixArea | undefined>(undefined);
  // dirty-set: cellKey -> mức đang chọn (khác trạng thái đã tải).
  const [overrides, setOverrides] = useState<Map<string, PermissionLevel>>(new Map());

  const rowByTarget = useMemo(() => {
    const map = new Map<string, MatrixRow>();
    for (const row of data?.rows ?? []) map.set(row.targetId, row);
    return map;
  }, [data]);

  // Áp kết quả tải vào state. Gọi sau await -> không phải setState đồng bộ trong effect.
  const applyOutcome = useCallback((o: LoadOutcome) => {
    setForbidden(o.kind === 'forbidden');
    setNotFound(o.kind === 'notFound');
    setAccessMessage(o.kind === 'forbidden' || o.kind === 'notFound' ? o.message : null);
    if (o.kind === 'ok') {
      setData(o.data);
      setError(null);
      setOverrides(new Map()); // dữ liệu mới -> xoá dirty-set
    } else {
      setData(null);
      setError(o.kind === 'error' ? o.message : null);
    }
    setLoading(false);
  }, []);

  // Tải khi đổi projectId/area. Effect chỉ setState sau await (qua applyOutcome).
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    void (async () => {
      const outcome = await fetchMatrixOutcome(projectId, area);
      if (!cancelled) applyOutcome(outcome);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, area, applyOutcome]);

  // reload thủ công (nút "Thử lại") — là event handler nên được setState đồng bộ.
  const reload = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const outcome = await fetchMatrixOutcome(projectId, area);
    applyOutcome(outcome);
  }, [projectId, area, applyOutcome]);

  const setArea = useCallback((next: MatrixArea | undefined) => {
    setAreaState(next);
  }, []);

  const valueOf = useCallback(
    (row: MatrixRow, cell: MatrixCell): PermissionLevel => {
      const override = overrides.get(cellKey(row.targetId, cell.projectParticipantId));
      return override ?? cellSelectValue(cell, row.targetType);
    },
    [overrides],
  );

  const isDirty = useCallback(
    (targetId: string, projectParticipantId: string): boolean =>
      overrides.has(cellKey(targetId, projectParticipantId)),
    [overrides],
  );

  const setCell = useCallback(
    (row: MatrixRow, cell: MatrixCell, level: PermissionLevel) => {
      if (!cell.editable || !row.assignable) return;
      if (!isLevelAllowed(row.targetType, level)) return;
      const key = cellKey(row.targetId, cell.projectParticipantId);
      const original = cellSelectValue(cell, row.targetType);
      setOverrides((prev) => {
        const next = new Map(prev);
        if (level === original) next.delete(key);
        else next.set(key, level);
        return next;
      });
    },
    [],
  );

  const discardChanges = useCallback(() => setOverrides(new Map()), []);

  const save = useCallback(async (): Promise<SaveOutcome> => {
    if (!projectId || !data || overrides.size === 0) {
      return { ok: false, message: '' };
    }
    const changes = buildChanges(rowByTarget, overrides);
    if (changes.length === 0) return { ok: false, message: '' };

    setSaving(true);
    try {
      const { data: res } = await permissionMatrixApi.saveMatrix(projectId, { changes });
      if (!res.isSuccess) {
        return { ok: false, message: res.message || t('common.error') };
      }
      const results = res.result ?? [];
      setData((prev) => (prev ? applyResults(prev, results) : prev));
      // Xoá khỏi dirty-set đúng các ô vừa lưu (giữ lại ô người dùng đổi trong lúc lưu).
      setOverrides((prev) => {
        const next = new Map(prev);
        for (const c of changes) next.delete(cellKey(c.targetId, c.projectParticipantId));
        return next;
      });
      return { ok: true, message: res.message || t('matrix.toast.saved') };
    } catch (err) {
      return { ok: false, message: getApiErrorMessage(err, t('common.error')) };
    } finally {
      setSaving(false);
    }
  }, [projectId, data, overrides, rowByTarget]);

  return {
    data,
    loading,
    saving,
    error,
    forbidden,
    notFound,
    accessMessage,
    area,
    setArea,
    dirtyCount: overrides.size,
    valueOf,
    isDirty,
    setCell,
    discardChanges,
    reload,
    save,
  };
}
