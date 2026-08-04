import { CONFIDENCE_OPTIONS } from './confidence-options';
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
      <label htmlFor="tracememo-confidence" className="text-xs font-medium text-slate-600">
        Your confidence
      </label>
      <select
        id="tracememo-confidence"
        value={value}
        onChange={event => onChange(event.target.value as Confidence)}
        disabled={disabled}
        className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500">
        {CONFIDENCE_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {active && <p className="text-[11px] text-slate-500">{active.description}</p>}
    </div>
  );
};
