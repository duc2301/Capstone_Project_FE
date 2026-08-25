import { useCallback, useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';

import type {
  MatrixArea,
  MatrixCell,
  MatrixCellChange,
  MatrixCellResult,
  MatrixFilter,
  MatrixRow,
  PermissionLevel,
  PermissionMatrixResponse,
} from '@/entities/permission-matrix';
import { MatrixTargetType, PermissionLevel as Level, permissionMatrixApi } from '@/entities/permission-matrix';
import { getApiErrorMessage } from '@/shared/api';
import { t } from '@/shared/lib/i18n';
import { areaAllowsWrite, cellKey, cellSelectValue } from './permissionMatrixFormat';

export interface SaveOutcome {
  ok: boolean;
  message: string;
}

/* 1 tuỳ chọn của bộ lọc đa chọn (nhóm/thư mục/tệp). */
export interface MatrixFilterOption {
  value: string;
  label: string;
}

const EMPTY_FILTER: MatrixFilter = {};

/* Không có tiêu chí nào => coi như không lọc (trả toàn bộ). */
function isFilterEmpty(f: MatrixFilter): boolean {
  return (
    f.area === undefined &&
    !(f.groupIds && f.groupIds.length > 0) &&
    !(f.folderIds && f.folderIds.length > 0)
  );
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
  /** Bộ lọc đang áp dụng. Refetch mỗi khi đổi. */
  filter: MatrixFilter;
  setFilter: (filter: MatrixFilter) => void;
  /** Đặt lại bộ lọc về rỗng (refetch toàn bộ ma trận). */
  clearFilters: () => void;
  /** Có ít nhất 1 tiêu chí lọc đang bật. */
  hasActiveFilters: boolean;
  /** Tuỳ chọn bộ lọc dựng từ ma trận CHƯA lọc (giữ nguyên khi đang lọc). */
  groupOptions: MatrixFilterOption[];
  folderOptions: MatrixFilterOption[];
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

/* Kiểm tra mức hợp lệ theo khu vực (mirror ràng buộc BE để đỡ round-trip).
 * Ma trận chỉ còn hàng folder: N/R mọi vùng, W chỉ ở WIP. */
function isLevelAllowed(area: MatrixArea, level: PermissionLevel): boolean {
  // Ghi (W) chỉ cho phép ở WIP — các vùng khác là chỉ đọc.
  if (level === Level.Write && !areaAllowsWrite(area)) return false;
  return level === Level.NoAccess || level === Level.Read || level === Level.Write;
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
    if (!row || !isLevelAllowed(row.area, level)) continue;
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

async function fetchMatrixOutcome(projectId: string, filter: MatrixFilter): Promise<LoadOutcome> {
  try {
    const { data: res } = await permissionMatrixApi.getMatrix(projectId, filter);
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
  // Ma trận CHƯA lọc — nguồn dựng tuỳ chọn bộ lọc. Chỉ cập nhật khi tải rỗng lọc.
  const [baseData, setBaseData] = useState<PermissionMatrixResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [accessMessage, setAccessMessage] = useState<string | null>(null);
  const [filter, setFilterState] = useState<MatrixFilter>(EMPTY_FILTER);
  // dirty-set: cellKey -> mức đang chọn (khác trạng thái đã tải).
  const [overrides, setOverrides] = useState<Map<string, PermissionLevel>>(new Map());

  const rowByTarget = useMemo(() => {
    const map = new Map<string, MatrixRow>();
    for (const row of data?.rows ?? []) map.set(row.targetId, row);
    return map;
  }, [data]);

  // Áp kết quả tải vào state. Gọi sau await -> không phải setState đồng bộ trong effect.
  // `captureBase`: lần tải này không có bộ lọc -> dùng làm nguồn tuỳ chọn bộ lọc.
  const applyOutcome = useCallback((o: LoadOutcome, captureBase: boolean) => {
    setForbidden(o.kind === 'forbidden');
    setNotFound(o.kind === 'notFound');
    setAccessMessage(o.kind === 'forbidden' || o.kind === 'notFound' ? o.message : null);
    if (o.kind === 'ok') {
      setData(o.data);
      if (captureBase) setBaseData(o.data);
      setError(null);
      setOverrides(new Map()); // dữ liệu mới -> xoá dirty-set
    } else {
      setData(null);
      if (captureBase) setBaseData(null);
      setError(o.kind === 'error' ? o.message : null);
    }
    setLoading(false);
  }, []);

  // Tải khi đổi projectId/filter. Effect chỉ setState sau await (qua applyOutcome).
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    const captureBase = isFilterEmpty(filter);
    void (async () => {
      const outcome = await fetchMatrixOutcome(projectId, filter);
      if (!cancelled) applyOutcome(outcome, captureBase);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, filter, applyOutcome]);

  // reload thủ công (nút "Thử lại") — là event handler nên được setState đồng bộ.
  const reload = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    const outcome = await fetchMatrixOutcome(projectId, filter);
    applyOutcome(outcome, isFilterEmpty(filter));
  }, [projectId, filter, applyOutcome]);

  const setFilter = useCallback((next: MatrixFilter) => {
    setFilterState(next);
  }, []);

  const clearFilters = useCallback(() => {
    setFilterState(EMPTY_FILTER);
  }, []);

  // Tuỳ chọn bộ lọc dựng từ ma trận CHƯA lọc để không bị co lại khi đang lọc:
  // Nhóm = cột; Thư mục = hàng Folder (bỏ hàng root-area). Ma trận chỉ còn hàng folder.
  const groupOptions = useMemo<MatrixFilterOption[]>(
    () => (baseData?.columns ?? []).map((c) => ({ value: c.groupId, label: c.groupName })),
    [baseData],
  );
  const folderOptions = useMemo<MatrixFilterOption[]>(
    () =>
      (baseData?.rows ?? [])
        .filter((r) => r.targetType === MatrixTargetType.Folder && !r.isRootArea)
        .map((r) => ({ value: r.targetId, label: r.name })),
    [baseData],
  );

  const valueOf = useCallback(
    (row: MatrixRow, cell: MatrixCell): PermissionLevel => {
      const override = overrides.get(cellKey(row.targetId, cell.projectParticipantId));
      return override ?? cellSelectValue(cell);
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
      if (!isLevelAllowed(row.area, level)) return;
      const key = cellKey(row.targetId, cell.projectParticipantId);
      const original = cellSelectValue(cell);
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
    filter,
    setFilter,
    clearFilters,
    hasActiveFilters: !isFilterEmpty(filter),
    groupOptions,
    folderOptions,
    dirtyCount: overrides.size,
    valueOf,
    isDirty,
    setCell,
    discardChanges,
    reload,
    save,
  };
}
