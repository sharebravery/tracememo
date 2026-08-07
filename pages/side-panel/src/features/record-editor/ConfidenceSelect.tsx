import { CONFIDENCE_OPTIONS } from './confidence-options';
import { t } from '@extension/i18n';
import type { Confidence } from '@extension/shared';

interface ConfidenceSelectProps {
  value: Confidence;
  onChange: (value: Confidence) => void;
  disabled?: boolean;
}

export const ConfidenceSelect = ({ value, onChange, disabled }: ConfidenceSelectProps) => {
  const active = CONFIDENCE_OPTIONS.find(option => option.value === value);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="tracememo-confidence" className="text-[11px] font-medium text-slate-400">
        {t('editor_your_confidence')}
      </label>
      <select
        id="tracememo-confidence"
        value={value}
        onChange={event => onChange(event.target.value as Confidence)}
        disabled={disabled}
        className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-2 py-1.5 text-sm text-slate-100 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30 disabled:opacity-50">
        {CONFIDENCE_OPTIONS.map(option => (
          <option key={option.value} value={option.value} className="bg-slate-900">
            {option.label}
          </option>
        ))}
      </select>
      {active && <p className="text-[10px] text-slate-600">{active.description}</p>}
    </div>
  );
};
