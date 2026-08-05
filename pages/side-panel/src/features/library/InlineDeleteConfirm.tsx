import { useState } from 'react';

interface InlineDeleteConfirmProps {
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Two-step inline delete confirmation (no modal library).
 * First click arms the confirm state; the second click deletes.
 */
export const InlineDeleteConfirm = ({ onConfirm, onCancel }: InlineDeleteConfirmProps) => {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="text-xs font-medium text-rose-400 transition hover:text-rose-300 focus:outline-none focus-visible:underline">
        Delete
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2" role="group" aria-label="Confirm delete">
      <button
        type="button"
        onClick={onConfirm}
        className="rounded-md bg-gradient-to-r from-rose-600 to-red-600 px-2 py-0.5 text-xs font-medium text-white shadow-md shadow-rose-500/25 transition hover:from-rose-500 hover:to-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60">
        Confirm delete
      </button>
      <button
        type="button"
        onClick={() => {
          setArmed(false);
          onCancel();
        }}
        className="text-xs font-medium text-slate-400 transition hover:text-slate-200 focus:outline-none focus-visible:underline">
        Cancel
      </button>
    </span>
  );
};
