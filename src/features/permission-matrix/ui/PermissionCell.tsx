import type { MatrixCell, MatrixRow, PermissionLevel } from '@/entities/permission-matrix';
import { MatrixTargetType, PermissionLevel as Level } from '@/entities/permission-matrix';
import {
  FILE_LEVEL_OPTIONS,
  FOLDER_LEVEL_OPTIONS,
  levelLabel,
  levelLetter,
  levelSwatchClass,
} from '../model/permissionMatrixFormat';

interface PermissionCellProps {
  row: MatrixRow;
  cell: MatrixCell;
  /** Mức đang chọn (đã tính chỉnh sửa cục bộ). */
  value: PermissionLevel;
  dirty: boolean;
  onChange: (level: PermissionLevel) => void;
}

export function PermissionCell({ row, cell, value, dirty, onChange }: PermissionCellProps) {
  const isFile = row.targetType === MatrixTargetType.File;
  const options = isFile ? FILE_LEVEL_OPTIONS : FOLDER_LEVEL_OPTIONS;
  const inheritSelected = isFile && value === Level.Inherit;
  // Mức hiển thị (màu + chữ cái): khi kế thừa -> mức hiệu lực của thư mục cha.
  const effective = inheritSelected ? cell.level : value;
  const disabled = !cell.editable;

  const className = [
    'w-full min-w-[68px] cursor-pointer appearance-none rounded-md border px-2 py-1.5 text-center',
    'text-xs font-semibold outline-none transition-colors focus:ring-2 focus:ring-primary/30',
    levelSwatchClass(effective),
    inheritSelected ? 'italic opacity-75' : '',
    dirty ? 'ring-2 ring-primary ring-offset-1 ring-offset-card' : '',
    disabled ? 'cursor-not-allowed opacity-60' : '',
  ].join(' ');

  return (
    <select
      className={className}
      value={value}
      disabled={disabled}
      aria-label={`${row.name} · ${levelLabel(effective)}`}
      title={
        disabled
          ? levelLabel(effective)
          : inheritSelected
            ? `${levelLabel(Level.Inherit)} → ${levelLabel(cell.level)}`
            : levelLabel(effective)
      }
      onChange={(e) => onChange(Number(e.target.value) as PermissionLevel)}
    >
      {options.map((lvl) =>
        lvl === Level.Inherit ? (
          <option key={lvl} value={lvl}>
            {levelLabel(lvl)} ({levelLetter(cell.level)})
          </option>
        ) : (
          <option key={lvl} value={lvl}>
            {levelLetter(lvl)} · {levelLabel(lvl)}
          </option>
        ),
      )}
    </select>
  );
}
