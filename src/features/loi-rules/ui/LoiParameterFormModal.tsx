import { useState } from 'react';

import type { LoiDiscipline, LoiParamGroup, LoiRuleParameter } from '@/entities/loi-check';
import { LOI_DISCIPLINE_OPTIONS, LOI_PARAM_GROUP_OPTIONS, LoiDiscipline as Discipline } from '@/entities/loi-check';
import { Modal } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

import { disciplineLabel, paramGroupLabel } from './loiRuleMeta';

interface LoiParameterFormModalProps {
  parameter: LoiRuleParameter | null;
  defaultDiscipline: LoiDiscipline;
  nextOrderIndex: number;
  busy: boolean;
  onSubmit: (values: {
    name: string;
    discipline: LoiDiscipline;
    paramGroup: LoiParamGroup;
    orderIndex: number;
  }) => void;
  onClose: () => void;
}

export function LoiParameterFormModal({
  parameter,
  defaultDiscipline,
  nextOrderIndex,
  busy,
  onSubmit,
  onClose,
}: LoiParameterFormModalProps) {
  const [name, setName] = useState(parameter?.name ?? '');
  const [discipline, setDiscipline] = useState<LoiDiscipline>(
    parameter?.discipline ?? defaultDiscipline ?? Discipline.KienTrucKetCau,
  );
  const [paramGroup, setParamGroup] = useState<LoiParamGroup>(parameter?.paramGroup ?? 1);
  const [orderIndex, setOrderIndex] = useState(parameter?.orderIndex ?? nextOrderIndex);

  const canSubmit = name.trim().length > 0 && !busy;

  return (
    <Modal
      title={parameter ? t('loiRule.parameter.editTitle') : t('loiRule.parameter.addTitle')}
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSubmit) return;
          onSubmit({ name: name.trim(), discipline, paramGroup, orderIndex });
        }}
        className="space-y-4"
      >
        <div>
          <label className="field-label mb-1.5">{t('loiRule.parameter.disciplineLabel')}</label>
          <select
            value={discipline}
            disabled={parameter !== null}
            onChange={(e) => setDiscipline(Number(e.target.value) as LoiDiscipline)}
            className="field-select w-full disabled:opacity-60"
          >
            {LOI_DISCIPLINE_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {disciplineLabel(item)}
              </option>
            ))}
          </select>
          <p className="field-hint mt-1.5">{t('loiRule.parameter.disciplineHint')}</p>
        </div>

        <div>
          <label className="field-label mb-1.5">{t('loiRule.parameter.nameLabel')}</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('loiRule.parameter.namePlaceholder')}
            className="field-input w-full"
          />
          <p className="field-hint mt-1.5">{t('loiRule.parameter.nameHint')}</p>
        </div>

        <div>
          <label className="field-label mb-1.5">{t('loiRule.parameter.groupLabel')}</label>
          <select
            value={paramGroup}
            onChange={(e) => setParamGroup(Number(e.target.value) as LoiParamGroup)}
            className="field-select w-full"
          >
            {LOI_PARAM_GROUP_OPTIONS.map((group) => (
              <option key={group} value={group}>
                {paramGroupLabel(group)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label mb-1.5">{t('loiRule.parameter.orderLabel')}</label>
          <input
            type="number"
            min={0}
            value={orderIndex}
            onChange={(e) => setOrderIndex(Number(e.target.value))}
            className="field-input w-32"
          />
          <p className="field-hint mt-1.5">{t('loiRule.parameter.orderHint')}</p>
        </div>

        {parameter && parameter.usageCount > 0 && (
          <p className="field-hint text-warning">
            {t('loiRule.parameter.renameWarning')} ({parameter.usageCount})
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
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
      </form>
    </Modal>
  );
}
