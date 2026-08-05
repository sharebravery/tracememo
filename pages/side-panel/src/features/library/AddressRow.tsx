import { InlineDeleteConfirm } from './InlineDeleteConfirm';
import { CHAIN_LABELS } from '@extension/shared';
import type { AddressRecord, Confidence, SupportedChainId } from '@extension/shared';

interface AddressRowProps {
  record: AddressRecord;
  onEdit: (chainId: number) => void;
  onDelete: () => void;
}

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  confirmed: 'Confirmed',
  likely: 'Likely',
  unverified: 'Unverified',
};

const CONFIDENCE_BADGE_CLASS: Record<Confidence, string> = {
  confirmed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  likely: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  unverified: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
};

const CHAIN_BADGE_CLASS: Record<SupportedChainId, string> = {
  1: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  8453: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
};

const copyAddress = async (address: string) => {
  try {
    await navigator.clipboard.writeText(address);
  } catch {
    // Clipboard is unavailable without a user gesture or in some contexts;
    // the full address remains visible for manual copy.
  }
};

export const AddressRow = ({ record, onEdit, onDelete }: AddressRowProps) => {
  const chains = record.chains;
  const primary = chains[0];

  return (
    <li className="rounded-xl border border-white/10 bg-white/[0.03] p-3 shadow-lg shadow-black/20 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/[0.05]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-slate-100">{record.label}</span>
            <span
              className="shrink-0 rounded-full border border-violet-500/30 bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-medium text-violet-300"
              aria-label="Your private note, not a platform verification">
              Private
            </span>
            {primary && (
              <span
                className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${CONFIDENCE_BADGE_CLASS[primary.confidence]}`}
                aria-label={`Confidence on ${CHAIN_LABELS[primary.chainId]}: ${CONFIDENCE_LABEL[primary.confidence]} (your own assessment)`}>
                {CONFIDENCE_LABEL[primary.confidence]}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => void copyAddress(record.address)}
            className="mt-1 block max-w-full truncate font-mono text-xs text-slate-400 transition hover:text-cyan-300 focus:outline-none focus-visible:underline"
            title={`Copy address ${record.address}`}>
            {record.address}
          </button>
          {record.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {record.tags.map(tag => (
                <span
                  key={tag}
                  className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {record.note && (
            <p className="mt-1.5 line-clamp-2 whitespace-pre-wrap text-xs text-slate-400">{record.note}</p>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {chains.map(ctx => (
          <button
            key={ctx.chainId}
            type="button"
            onClick={() => onEdit(ctx.chainId)}
            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition hover:brightness-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 ${CHAIN_BADGE_CLASS[ctx.chainId]}`}>
            {CHAIN_LABELS[ctx.chainId]}
          </button>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-3 border-t border-white/5 pt-2">
        <button
          type="button"
          onClick={() => onEdit(chains[0]?.chainId ?? 1)}
          className="text-xs font-medium text-violet-300 transition hover:text-violet-200 focus:outline-none focus-visible:underline">
          Edit
        </button>
        <InlineDeleteConfirm onConfirm={onDelete} onCancel={() => {}} />
      </div>
    </li>
  );
};
