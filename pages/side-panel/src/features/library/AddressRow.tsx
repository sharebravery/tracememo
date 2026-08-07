import { InlineDeleteConfirm } from './InlineDeleteConfirm';
import { CopyAddress } from '../../components/CopyAddress';
import { t } from '@extension/i18n';
import { CHAIN_LABELS } from '@extension/shared';
import type { AddressRecord, Confidence } from '@extension/shared';

interface AddressRowProps {
  record: AddressRecord;
  onEdit: (chainId: number) => void;
  onDelete: () => void;
}

const CONFIDENCE_KEY: Record<Confidence, string> = {
  confirmed: 'confidence_confirmed',
  likely: 'confidence_likely',
  unverified: 'confidence_unverified',
};

const CONFIDENCE_DOT: Record<Confidence, string> = {
  confirmed: 'text-emerald-400',
  likely: 'text-amber-400',
  unverified: 'text-slate-500',
};

export const AddressRow = ({ record, onEdit, onDelete }: AddressRowProps) => (
  <li className="rounded-lg border border-slate-800 bg-slate-900/40 p-2.5">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-slate-100">{record.label}</span>
          <span className="shrink-0 rounded bg-slate-700 px-1 py-0.5 text-[9px] font-medium text-slate-300">
            {t('badge_private')}
          </span>
        </div>
        <CopyAddress address={record.address} className="mt-0.5" />
        {record.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {record.tags.map(tag => (
              <span key={tag} className="rounded border border-slate-700 px-1 py-0.5 text-[10px] text-slate-400">
                #{tag}
              </span>
            ))}
          </div>
        )}
        {record.note && <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs text-slate-500">{record.note}</p>}
      </div>
    </div>

    {/* Each chain badge shows its own confidence, not a shared one. */}
    <div className="mt-2 flex flex-wrap gap-1">
      {record.chains.map(ctx => (
        <button
          key={ctx.chainId}
          type="button"
          onClick={() => onEdit(ctx.chainId)}
          className="flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-300 hover:border-slate-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/50">
          <span className="text-cyan-400">{CHAIN_LABELS[ctx.chainId]}</span>
          <span className="text-slate-600">·</span>
          <span className={CONFIDENCE_DOT[ctx.confidence]}>●</span>
          <span>{t(CONFIDENCE_KEY[ctx.confidence] as 'confidence_confirmed')}</span>
        </button>
      ))}
    </div>

    <div className="mt-2 flex items-center gap-3 border-t border-slate-800 pt-1.5">
      <button
        type="button"
        onClick={() => onEdit(record.chains[0]?.chainId ?? 1)}
        className="text-xs font-medium text-violet-400 hover:text-violet-300 focus:outline-none focus-visible:underline">
        {t('library_edit')}
      </button>
      <InlineDeleteConfirm onConfirm={onDelete} onCancel={() => {}} />
    </div>
  </li>
);
