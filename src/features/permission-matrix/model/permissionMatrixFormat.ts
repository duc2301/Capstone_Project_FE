import type { MatrixArea, MatrixCell, PermissionLevel } from '@/entities/permission-matrix';
import { MatrixArea as Area, PermissionLevel as Level } from '@/entities/permission-matrix';
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

/* Màu sắc theo mức: N xám, R xanh dương, W xanh lá (theo gợi ý UX).
 * Dùng nền pha alpha từ màu gốc -> đậm hơn biến thể *-light. */
export const levelSwatchClass = (level: PermissionLevel): string => {
  switch (level) {
    case Level.Write:
      return 'bg-success/20 text-success border-success/45';
    case Level.Read:
      return 'bg-info/20 text-info border-info/45';
    case Level.NoAccess:
      return 'bg-text-muted/20 text-text-secondary border-text-muted/40';
    default:
      return 'bg-transparent text-text-placeholder border-dashed border-card-border';
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

/* Giá trị "đang chọn" của dropdown cho 1 ô = mức hiệu lực của ô.
 * File đang kế thừa vẫn hiển thị chữ cái mức hiệu lực (tô nhạt/nghiêng ở UI),
 * còn tuỳ chọn "Kế thừa" (—) là hành động đặt lại về kế thừa. */
export const cellSelectValue = (cell: MatrixCell): PermissionLevel => cell.level;

/* ── Khu vực CDE ─────────────────────────────────────────── */
const AREA_LABEL_KEY: Record<MatrixArea, TranslationKey> = {
  [Area.Wip]: 'matrix.area.wip',
  [Area.Shared]: 'matrix.area.shared',
  [Area.Published]: 'matrix.area.published',
  [Area.Archived]: 'matrix.area.archived',
};

export const areaLabel = (area: MatrixArea): string => t(AREA_LABEL_KEY[area]);

export const AREA_OPTIONS: MatrixArea[] = [Area.Wip, Area.Shared, Area.Published, Area.Archived];
