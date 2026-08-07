import { t } from '@extension/i18n';
import { useState } from 'react';

interface InlineDeleteConfirmProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const InlineDeleteConfirm = ({ onConfirm, onCancel }: InlineDeleteConfirmProps) => {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="text-xs font-medium text-rose-400 transition hover:text-rose-300 focus:outline-none focus-visible:underline">
        {t('library_delete')}
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2" role="group" aria-label={t('library_confirm_delete')}>
      <button
        type="button"
        onClick={onConfirm}
        className="rounded-md bg-rose-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60">
        {t('library_confirm_delete')}
      </button>
      <button
        type="button"
        onClick={() => {
          setArmed(false);
          onCancel();
        }}
        className="text-xs font-medium text-slate-400 transition hover:text-slate-200 focus:outline-none focus-visible:underline">
        {t('library_cancel')}
      </button>
    </span>
  );
};
