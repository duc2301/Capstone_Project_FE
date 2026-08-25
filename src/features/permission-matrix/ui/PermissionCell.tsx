import type { MatrixCell, MatrixRow, PermissionLevel } from '@/entities/permission-matrix';
import { levelLabel, levelLetter, levelOptionsFor, levelSwatchClass } from '../model/permissionMatrixFormat';

interface PermissionCellProps {
  row: MatrixRow;
  cell: MatrixCell;
  /** Mức đang chọn (đã tính chỉnh sửa cục bộ). */
  value: PermissionLevel;
  dirty: boolean;
  onChange: (level: PermissionLevel) => void;
}

export function PermissionCell({ row, cell, value, dirty, onChange }: PermissionCellProps) {
  // Tuỳ chọn theo khu vực (Shared/Published/Archived không có Ghi). Vẫn giữ giá trị
  // hiện tại nếu vì lý do nào đó nằm ngoài danh sách -> select không bị trống.
  const areaOptions = levelOptionsFor(row.area);
  const options = areaOptions.includes(value) ? areaOptions : [value, ...areaOptions];
  const disabled = !cell.editable;

  const className = [
    'h-9 w-full cursor-pointer appearance-none rounded-[var(--radius-input)] px-2 text-center',
    'text-sm font-bold outline-none transition-colors focus:ring-2 focus:ring-primary/30',
    levelSwatchClass(value),
    'border',
    dirty ? 'ring-2 ring-primary ring-offset-1 ring-offset-content-bg' : '',
    disabled ? 'cursor-not-allowed opacity-60' : '',
  ].join(' ');

  const title = levelLabel(value);

  return (
    <select
      className={className}
      value={value}
      disabled={disabled}
      aria-label={`${row.name} · ${title}`}
      title={title}
      onChange={(e) => onChange(Number(e.target.value) as PermissionLevel)}
    >
      {options.map((lvl) => (
        <option key={lvl} value={lvl} title={levelLabel(lvl)}>
          {levelLetter(lvl)}
        </option>
      ))}
    </select>
  );
}
