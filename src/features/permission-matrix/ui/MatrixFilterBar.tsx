import type { MatrixArea, MatrixFilter } from '@/entities/permission-matrix';
import { t } from '@/shared/lib/i18n';
import { areaLabel, AREA_OPTIONS } from '../model/permissionMatrixFormat';
import type { MatrixFilterOption } from '../model/usePermissionMatrix';
import { MatrixMultiSelect } from './MatrixMultiSelect';

interface MatrixFilterBarProps {
  filter: MatrixFilter;
  groupOptions: MatrixFilterOption[];
  folderOptions: MatrixFilterOption[];
  hasActiveFilters: boolean;
  /** Áp bộ lọc mới (đã gồm mọi tiêu chí). Trang tự chặn khi có thay đổi chưa lưu. */
  onChange: (next: MatrixFilter) => void;
  /** Xoá toàn bộ bộ lọc. */
  onClear: () => void;
}

function ClearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function MatrixFilterBar({
  filter,
  groupOptions,
  folderOptions,
  hasActiveFilters,
  onChange,
  onClear,
}: MatrixFilterBarProps) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2.5">
      <MatrixMultiSelect
        mode="single"
        label={t('matrix.filter.area')}
        allLabel={t('matrix.filter.allAreas')}
        options={AREA_OPTIONS.map((a) => ({ value: String(a), label: areaLabel(a) }))}
        selected={filter.area === undefined ? [] : [String(filter.area)]}
        onChange={(values) =>
          onChange({ ...filter, area: values.length === 0 ? undefined : (Number(values[0]) as MatrixArea) })
        }
      />

      <MatrixMultiSelect
        label={t('matrix.filter.group')}
        allLabel={t('matrix.filter.allGroups')}
        title={t('matrix.filter.groupHint')}
        options={groupOptions}
        selected={filter.groupIds ?? []}
        onChange={(groupIds) => onChange({ ...filter, groupIds })}
      />

      <MatrixMultiSelect
        label={t('matrix.filter.folder')}
        allLabel={t('matrix.filter.allFolders')}
        title={t('matrix.filter.folderHint')}
        options={folderOptions}
        selected={filter.folderIds ?? []}
        onChange={(folderIds) => onChange({ ...filter, folderIds })}
      />

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1.5 rounded-[var(--radius-input)] border border-card-border bg-card px-3.5 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-content-bg hover:text-text"
        >
          <ClearIcon />
          {t('matrix.filter.clearAll')}
        </button>
      )}
    </div>
  );
}
