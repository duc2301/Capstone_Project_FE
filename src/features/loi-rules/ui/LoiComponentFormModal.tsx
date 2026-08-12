import { useState } from 'react';

import type { LoiDiscipline, LoiRuleComponent } from '@/entities/loi-check';
import { LOI_DISCIPLINE_OPTIONS, LoiDiscipline as Discipline } from '@/entities/loi-check';
import { Modal } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

import { disciplineLabel } from './loiRuleMeta';

interface LoiComponentFormModalProps {
  component: LoiRuleComponent | null;
  busy: boolean;
  onSubmit: (values: { code: string; name: string; discipline: LoiDiscipline }) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function LoiComponentFormModal({
  component,
  busy,
  onSubmit,
  onDelete,
  onClose,
}: LoiComponentFormModalProps) {
  const [code, setCode] = useState(component?.code ?? '');
  const [name, setName] = useState(component?.name ?? '');
  const [discipline, setDiscipline] = useState<LoiDiscipline>(
    component?.discipline ?? Discipline.KienTrucKetCau,
  );

  const canSubmit = code.trim().length > 0 && name.trim().length > 0 && !busy;

  return (
    <Modal
      title={component ? t('loiRule.component.editTitle') : t('loiRule.component.addTitle')}
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSubmit) return;
          onSubmit({ code: code.trim(), name: name.trim(), discipline });
        }}
        className="space-y-4"
      >
        <div>
          <label className="field-label mb-1.5">{t('loiRule.component.codeLabel')}</label>
          <input
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t('loiRule.component.codePlaceholder')}
            className="field-input w-full font-mono"
          />
          <p className="field-hint mt-1.5">{t('loiRule.component.codeHint')}</p>
        </div>

        <div>
          <label className="field-label mb-1.5">{t('loiRule.component.nameLabel')}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('loiRule.component.namePlaceholder')}
            className="field-input w-full"
          />
        </div>

        <div>
          <label className="field-label mb-1.5">{t('loiRule.component.disciplineLabel')}</label>
          <select
            value={discipline}
            onChange={(e) => setDiscipline(Number(e.target.value) as LoiDiscipline)}
            className="field-select w-full"
          >
            {LOI_DISCIPLINE_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {disciplineLabel(item)}
              </option>
            ))}
          </select>
          <p className="field-hint mt-1.5">{t('loiRule.component.disciplineHint')}</p>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          {component && onDelete ? (
            <button type="button" onClick={onDelete} disabled={busy} className="btn-modal-danger">
              {t('loiRule.component.remove')}
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-modal-ghost">
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="btn-modal-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.saveChanges')}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
