import { useState } from 'react';

import type { LoiRuleParameter } from '@/entities/loi-check';
import { Modal } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

interface LoiAliasFormModalProps {
  parameters: LoiRuleParameter[];
  busy: boolean;
  onSubmit: (values: { paramNameInModel: string; standardParamName: string }) => void;
  onClose: () => void;
}

export function LoiAliasFormModal({ parameters, busy, onSubmit, onClose }: LoiAliasFormModalProps) {
  const [paramNameInModel, setParamNameInModel] = useState('');
  const [standardParamName, setStandardParamName] = useState(parameters[0]?.name ?? '');

  const canSubmit = paramNameInModel.trim().length > 0 && standardParamName.trim().length > 0 && !busy;

  return (
    <Modal title={t('loiRule.alias.addTitle')} onClose={onClose} maxWidth="max-w-lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSubmit) return;
          onSubmit({
            paramNameInModel: paramNameInModel.trim(),
            standardParamName: standardParamName.trim(),
          });
        }}
        className="space-y-4"
      >
        <div>
          <label className="field-label mb-1.5">{t('loiRule.alias.modelNameLabel')}</label>
          <input
            autoFocus
            value={paramNameInModel}
            onChange={(e) => setParamNameInModel(e.target.value)}
            placeholder={t('loiRule.alias.modelNamePlaceholder')}
            className="field-input w-full"
          />
          <p className="field-hint mt-1.5">{t('loiRule.alias.modelNameHint')}</p>
        </div>

        <div>
          <label className="field-label mb-1.5">{t('loiRule.alias.standardNameLabel')}</label>
          {parameters.length > 0 ? (
            <select
              value={standardParamName}
              onChange={(e) => setStandardParamName(e.target.value)}
              className="field-select w-full"
            >
              {parameters.map((parameter) => (
                <option key={parameter.id} value={parameter.name}>
                  {parameter.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={standardParamName}
              onChange={(e) => setStandardParamName(e.target.value)}
              placeholder={t('loiRule.alias.standardNamePlaceholder')}
              className="field-input w-full"
            />
          )}
          <p className="field-hint mt-1.5">{t('loiRule.alias.standardNameHint')}</p>
        </div>

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
