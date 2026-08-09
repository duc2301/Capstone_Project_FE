import { useState } from 'react';

import type { CreateGroupPayload, Group } from '@/entities/group';
import { getApiErrorMessage } from '@/shared/api';
import { Modal } from '@/shared/components';
import { t } from '@/shared/lib/i18n';

interface Props {
  group: Group;
  onClose: () => void;
  onSubmit: (groupId: string, payload: Partial<CreateGroupPayload>) => Promise<void>;
  onError: (message: string) => void;
}

export function EditGroupModal({ group, onClose, onSubmit, onError }: Props) {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSubmit(group.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err) {
      onError(getApiErrorMessage(err, t('common.error')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={t('projectDetail.teams.editGroup.title')} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="field-label" htmlFor="edit-group-name">
            {t('projectDetail.teams.editGroup.name')}
          </label>
          <input
            id="edit-group-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field-input"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="field-label" htmlFor="edit-group-desc">
            {t('projectDetail.teams.editGroup.description')}
          </label>
          <textarea
            id="edit-group-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="field-input"
          />
        </div>

        <div className="mt-2 flex justify-end gap-3">
          <button type="button" disabled={saving} onClick={onClose} className="btn-modal-ghost">
            {t('projectDetail.teams.editGroup.cancel')}
          </button>
          <button
            type="button"
            disabled={!name.trim() || saving}
            onClick={() => void handleSave()}
            className="btn-modal-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? t('common.loading') : t('projectDetail.teams.editGroup.save')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
