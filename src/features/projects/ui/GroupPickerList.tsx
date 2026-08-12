import type { Group } from '@/entities/group';
import { t } from '@/shared/lib/i18n';

interface Props {
  groups: Group[];
  loading: boolean;
  selectedGroupId: string;
  onSelect: (groupId: string) => void;
}

/** Danh sách nhóm dạng dòng chọn được — dùng chung cho mọi luồng "chọn nhóm rồi mới làm tiếp". */
export function GroupPickerList({ groups, loading, selectedGroupId, onSelect }: Props) {
  return (
    <div className="space-y-2">
      <span className="field-label">{t('projects.invite.group')}</span>

      {loading ? (
        <p className="text-sm text-text-muted">{t('common.loading')}</p>
      ) : groups.length === 0 ? (
        <p className="rounded-[var(--radius-input)] border border-dashed border-card-border bg-input-bg px-4 py-3 text-sm text-text-muted">
          {t('projects.invite.noGroups')}
        </p>
      ) : (
        <div
          role="radiogroup"
          aria-label={t('projects.invite.group')}
          className="admin-scrollbar max-h-60 space-y-2 overflow-y-auto pr-1"
        >
          {groups.map((group) => {
            const active = group.id === selectedGroupId;
            return (
              <button
                key={group.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onSelect(group.id)}
                className={`flex w-full items-center gap-3 rounded-[var(--radius-input)] border px-4 py-3 text-left transition-colors ${active ? 'border-primary bg-primary/5' : 'border-card-border bg-card hover:border-primary/50'}`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${active ? 'border-primary' : 'border-input-border'}`}
                >
                  {active && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-text">{group.name}</span>
                  {group.description && (
                    <span className="block truncate text-xs text-text-muted">{group.description}</span>
                  )}
                </span>
                <span className="shrink-0 text-xs font-semibold text-text-muted">
                  {group.members.length} {t('projects.group.memberSuffix')}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
