import type {
  MatrixArea,
  MatrixCell,
  MatrixRow,
  PermissionLevel,
} from '@/entities/permission-matrix';
import { MatrixArea as Area, MatrixTargetType, PermissionLevel as Level } from '@/entities/permission-matrix';
import type { TranslationKey } from '@/shared/lib/i18n';
import { t } from '@/shared/lib/i18n';

/* Khoá định danh 1 ô = targetId + participantId. Dùng cho dirty-set. */
export const cellKey = (targetId: string, projectParticipantId: string): string =>
  `${targetId}|${projectParticipantId}`;

/* Chữ cái hiển thị trong ô cho từng mức. */
export const levelLetter = (level: PermissionLevel): string => {
  switch (level) {
    case Level.Write:
      return 'W';
    case Level.Read:
      return 'R';
    case Level.NoAccess:
      return 'N';
    default:
      return '—'; // Inherit không hiển thị chữ cái riêng
  }
};

const LEVEL_LABEL_KEY: Record<PermissionLevel, TranslationKey> = {
  [Level.Inherit]: 'matrix.level.inherit',
  [Level.NoAccess]: 'matrix.level.noAccess',
  [Level.Read]: 'matrix.level.read',
  [Level.Write]: 'matrix.level.write',
};

export const levelLabel = (level: PermissionLevel): string => t(LEVEL_LABEL_KEY[level]);

/* Màu sắc theo mức: N xám, R xanh dương, W xanh lá (theo gợi ý UX). */
export const levelSwatchClass = (level: PermissionLevel): string => {
  switch (level) {
    case Level.Write:
      return 'bg-success-light text-success border-success/30';
    case Level.Read:
      return 'bg-info-light text-info border-info/30';
    case Level.NoAccess:
      return 'bg-content-bg text-text-muted border-card-border';
    default:
      return 'bg-content-bg text-text-placeholder border-dashed border-card-border';
  }
};

/* Các tuỳ chọn của dropdown theo loại đối tượng.
 * Folder: N/R/W. File: Inherit + N/R/W. */
export const FOLDER_LEVEL_OPTIONS: PermissionLevel[] = [Level.NoAccess, Level.Read, Level.Write];
export const FILE_LEVEL_OPTIONS: PermissionLevel[] = [
  Level.Inherit,
  Level.NoAccess,
  Level.Read,
  Level.Write,
];

/* Giá trị "đang chọn" của dropdown cho 1 ô.
 * File đang kế thừa -> Inherit; ngược lại -> chính mức của ô. */
export const cellSelectValue = (cell: MatrixCell, targetType: MatrixRow['targetType']): PermissionLevel => {
  if (targetType === MatrixTargetType.File && cell.isInherited) return Level.Inherit;
  return cell.level;
};

/* ── Khu vực CDE ─────────────────────────────────────────── */
const AREA_LABEL_KEY: Record<MatrixArea, TranslationKey> = {
  [Area.Wip]: 'matrix.area.wip',
  [Area.Shared]: 'matrix.area.shared',
  [Area.Published]: 'matrix.area.published',
  [Area.Archived]: 'matrix.area.archived',
};

export const areaLabel = (area: MatrixArea): string => t(AREA_LABEL_KEY[area]);

export const AREA_OPTIONS: MatrixArea[] = [Area.Wip, Area.Shared, Area.Published, Area.Archived];
