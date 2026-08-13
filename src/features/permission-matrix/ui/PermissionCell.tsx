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
  // Người dùng vừa chọn "đặt lại về kế thừa" (chưa lưu).
  const inheritPending = value === Level.Inherit;
  // File đang kế thừa từ thư mục cha và chưa bị sửa -> tô nhạt/nghiêng.
  const showInherited = isFile && cell.isInherited && !dirty;
  const disabled = !cell.editable;

  const className = [
    'w-full min-w-[52px] cursor-pointer appearance-none rounded border px-1.5 py-1 text-center',
    'text-sm font-bold outline-none transition-colors focus:ring-2 focus:ring-primary/30',
    levelSwatchClass(inheritPending ? Level.Inherit : value),
    showInherited || inheritPending ? 'italic opacity-70' : '',
    dirty ? 'ring-2 ring-primary ring-offset-1 ring-offset-content-bg' : '',
    disabled ? 'cursor-not-allowed opacity-60' : '',
  ].join(' ');

  const title = showInherited
    ? `${levelLabel(cell.level)} · ${levelLabel(Level.Inherit)}`
    : levelLabel(inheritPending ? Level.Inherit : value);

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
