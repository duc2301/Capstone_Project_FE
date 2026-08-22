/* Bật/tắt 1 id trong Set (bất biến) — dùng cho danh sách item đã đánh dấu ở mỗi panel
 * của các modal phân quyền (nhóm & thành viên). */
export function toggleInSet(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}
