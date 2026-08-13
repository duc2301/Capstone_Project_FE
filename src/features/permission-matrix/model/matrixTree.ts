import type { MatrixRow } from '@/entities/permission-matrix';

/* 1 hàng đã được làm phẳng để render, kèm độ sâu và cờ có con. */
export interface FlatMatrixRow {
  row: MatrixRow;
  depth: number;
  hasChildren: boolean;
}

/* Dựng cây từ parentRowId rồi duyệt DFS theo đúng thứ tự BE trả về.
 * Ẩn con của các hàng đang bị thu gọn (collapsed).
 * An toàn với parentRowId trỏ tới hàng không tồn tại (coi như gốc) và với
 * chu trình (mỗi hàng chỉ xuất hiện 1 lần). */
export function flattenMatrixRows(
  rows: MatrixRow[],
  collapsed: ReadonlySet<string>,
): FlatMatrixRow[] {
  const childrenByParent = new Map<string | null, MatrixRow[]>();
  const known = new Set(rows.map((r) => r.targetId));

  for (const row of rows) {
    // parentRowId trỏ tới hàng không có trong tập -> treo lên gốc để không mất hàng.
    const parent = row.parentRowId && known.has(row.parentRowId) ? row.parentRowId : null;
    const bucket = childrenByParent.get(parent);
    if (bucket) bucket.push(row);
    else childrenByParent.set(parent, [row]);
  }

  const out: FlatMatrixRow[] = [];
  const visited = new Set<string>();

  const walk = (parentId: string | null, depth: number): void => {
    const children = childrenByParent.get(parentId);
    if (!children) return;
    for (const row of children) {
      if (visited.has(row.targetId)) continue; // chặn chu trình
      visited.add(row.targetId);
      const hasChildren = (childrenByParent.get(row.targetId)?.length ?? 0) > 0;
      out.push({ row, depth, hasChildren });
      if (hasChildren && !collapsed.has(row.targetId)) {
        walk(row.targetId, depth + 1);
      }
    }
  };

  walk(null, 0);
  return out;
}

/* Tập id mọi hàng có con — dùng cho nút "mở/thu tất cả". */
export function collapsibleRowIds(rows: MatrixRow[]): string[] {
  const withChildren = new Set<string>();
  const known = new Set(rows.map((r) => r.targetId));
  for (const row of rows) {
    if (row.parentRowId && known.has(row.parentRowId)) withChildren.add(row.parentRowId);
  }
  return [...withChildren];
}
