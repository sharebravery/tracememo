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
        className="text-xs font-medium text-red-600 hover:text-red-700 focus:outline-none focus-visible:underline">
        Delete
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2" role="group" aria-label="Confirm delete">
      <button
        type="button"
        onClick={onConfirm}
        className="rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
        Confirm delete
      </button>
      <button
        type="button"
        onClick={() => {
          setArmed(false);
          onCancel();
        }}
        className="text-xs font-medium text-slate-600 hover:text-slate-800 focus:outline-none focus-visible:underline">
        Cancel
      </button>
    </span>
  );
};
