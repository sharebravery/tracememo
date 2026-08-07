import { useCopyAddress } from '../hooks/use-copy-address';
import { t } from '@extension/i18n';

interface CopyAddressProps {
  address: string;
  className?: string;
}

const STATUS_TEXT: Record<string, string> = {
  copied: 'copied',
  failed: 'copy_failed',
};

/**
 * Reusable address display with copy button. Shows the truncated address,
 * a copy icon, and "Copied"/"Copy failed" feedback for ~1.5s.
 */
export const CopyAddress = ({ address, className = '' }: CopyAddressProps) => {
  const { copy, status } = useCopyAddress();

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={() => void copy(address)}
        className="block max-w-full truncate font-mono text-xs text-slate-500 hover:text-slate-300 focus:outline-none focus-visible:underline"
        title={t('copy_address_label')}
        aria-label={t('copy_address_label')}>
        {address}
      </button>
      {status !== 'idle' && (
        <span className={`shrink-0 text-[10px] ${status === 'copied' ? 'text-emerald-400' : 'text-rose-400'}`}>
          {t(STATUS_TEXT[status] as 'copy_copied')}
        </span>
      )}
    </div>
  );
};
