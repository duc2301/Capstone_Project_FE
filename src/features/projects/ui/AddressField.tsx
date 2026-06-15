import { useState } from 'react';

import { geocodeAddress } from '@/shared/lib/geo';
import { t } from '@/shared/lib/i18n';

export interface LocationValue {
  address: string;
  latitude: string;
  longitude: string;
}

interface Props {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
}

const fieldClass =
  'w-full rounded-[var(--radius-input)] border border-input-border bg-input-bg px-4 py-3 text-sm text-text outline-none transition-all duration-200 placeholder:text-text-placeholder focus:border-primary focus:ring-2 focus:ring-primary/20';

export function AddressField({ value, onChange }: Props) {
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleLocate = async () => {
    const q = value.address.trim();
    if (!q) return;
    setLocating(true);
    setMessage(null);
    try {
      const result = await geocodeAddress(q);
      if (result) {
        onChange({ ...value, latitude: result.lat.toFixed(6), longitude: result.lng.toFixed(6) });
        setMessage({ type: 'success', text: result.displayName });
      } else {
        setMessage({ type: 'error', text: t('projects.form.geocodeNotFound') });
      }
    } catch {
      setMessage({ type: 'error', text: t('projects.form.geocodeError') });
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="project-address" className="block text-sm font-medium text-text-secondary">
        {t('projects.form.address')}
      </label>
      <div className="flex gap-2">
        <input
          id="project-address"
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void handleLocate();
            }
          }}
          placeholder={t('projects.form.addressPlaceholder')}
          className={`${fieldClass} flex-1`}
        />
        <button
          type="button"
          onClick={() => void handleLocate()}
          disabled={locating || !value.address.trim()}
          className="flex shrink-0 items-center gap-1.5 rounded-[var(--radius-button)] bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {locating ? t('projects.form.geocoding') : t('projects.form.geocode')}
        </button>
      </div>

      {value.latitude && value.longitude && (
        <p className="text-xs text-text-secondary">
          {t('projects.form.coordinates')}: <span className="font-mono">{value.latitude}, {value.longitude}</span>
        </p>
      )}
      {message && (
        <p className={`text-xs ${message.type === 'success' ? 'text-success' : 'text-danger'}`}>
          {message.type === 'success' ? `✓ ${t('projects.form.located')}: ${message.text}` : message.text}
        </p>
      )}
    </div>
  );
}
