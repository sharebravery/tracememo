import { InlineDeleteConfirm } from './InlineDeleteConfirm';
import { CHAIN_LABELS } from '@extension/shared';
import type { AddressRecord, Confidence } from '@extension/shared';

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
  confirmed: 'bg-emerald-100 text-emerald-800',
  likely: 'bg-amber-100 text-amber-800',
  unverified: 'bg-slate-100 text-slate-700',
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
    <li className="rounded border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-medium text-slate-900">{record.label}</span>
            <span
              className="shrink-0 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
              aria-label="Your private note, not a platform verification">
              Private
            </span>
            {primary && (
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${CONFIDENCE_BADGE_CLASS[primary.confidence]}`}
                aria-label={`Confidence on ${CHAIN_LABELS[primary.chainId]}: ${CONFIDENCE_LABEL[primary.confidence]} (your own assessment)`}>
                {CONFIDENCE_LABEL[primary.confidence]}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => void copyAddress(record.address)}
            className="mt-0.5 block max-w-full truncate text-xs text-slate-500 hover:text-slate-700 focus:outline-none focus-visible:underline"
            title={`Copy address ${record.address}`}>
            {record.address}
          </button>
          {record.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {record.tags.map(tag => (
                <span key={tag} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {record.note && <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs text-slate-600">{record.note}</p>}
        </div>
      </div>

      <div className="mt-1 flex flex-wrap gap-1">
        {chains.map(ctx => (
          <button
            key={ctx.chainId}
            type="button"
            onClick={() => onEdit(ctx.chainId)}
            className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 hover:bg-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            {CHAIN_LABELS[ctx.chainId]}
          </button>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => onEdit(chains[0]?.chainId ?? 1)}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus-visible:underline">
          Edit
        </button>
        <InlineDeleteConfirm onConfirm={onDelete} onCancel={() => {}} />
      </div>
    </li>
  );
};
