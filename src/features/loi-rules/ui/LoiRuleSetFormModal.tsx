import { useState } from 'react';

import type { LoiRuleSet } from '@/entities/loi-check';
import { Modal } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

interface LoiRuleSetFormModalProps {
  ruleSet: LoiRuleSet | null;
  busy: boolean;
  onSubmit: (values: { name: string; description: string | null }) => void;
  onClose: () => void;
}

export function LoiRuleSetFormModal({ ruleSet, busy, onSubmit, onClose }: LoiRuleSetFormModalProps) {
  const [name, setName] = useState(ruleSet?.name ?? '');
  const [description, setDescription] = useState(ruleSet?.description ?? '');

  const canSubmit = name.trim().length > 0 && !busy;

  return (
    <Modal
      title={ruleSet ? t('loiRule.ruleSet.editTitle') : t('loiRule.ruleSet.addTitle')}
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSubmit) return;
          onSubmit({ name: name.trim(), description: description.trim() || null });
        }}
        className="space-y-4"
      >
        <div>
          <label className="field-label mb-1.5">{t('loiRule.ruleSet.nameLabel')}</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('loiRule.ruleSet.namePlaceholder')}
            className="field-input w-full"
          />
        </div>

        <div>
          <label className="field-label mb-1.5">{t('loiRule.ruleSet.descriptionLabel')}</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('loiRule.ruleSet.descriptionPlaceholder')}
            className="field-input w-full resize-none"
          />
        </div>

        {!ruleSet && <p className="field-hint">{t('loiRule.ruleSet.addHint')}</p>}

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
