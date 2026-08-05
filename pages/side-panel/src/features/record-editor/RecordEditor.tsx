import { ConfidenceSelect } from './ConfidenceSelect';
import { SourceList } from './SourceList';
import { sendMessage } from '../../messaging';
import { CHAIN_LABELS, isEvmAddress, LABEL_MAX, NOTE_MAX, SOURCE_MAX_PER_RECORD, TAGS_MAX } from '@extension/shared';
import { useMemo, useState } from 'react';
import type {
  AddressRecord,
  Confidence,
  EvmAddress,
  RecordCreateInput,
  RecordUpdateInput,
  SourceInput,
  SupportedChainId,
} from '@extension/shared';

interface RecordEditorProps {
  mode: 'create' | 'update';
  initial?: AddressRecord;
  initialChainId?: SupportedChainId;
  initialAddress?: EvmAddress;
  defaultSources?: SourceInput[];
  onSaved: () => void;
  onCancel: () => void;
}

const parseTags = (text: string): string[] =>
  text
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)
    .slice(0, TAGS_MAX);

export const RecordEditor = ({
  mode,
  initial,
  initialChainId,
  initialAddress,
  defaultSources,
  onSaved,
  onCancel,
}: RecordEditorProps) => {
  const isEdit = mode === 'update';
  const firstChainId = initialChainId ?? 1;

  const [chainId, setChainId] = useState<SupportedChainId>(firstChainId);
  const [address, setAddress] = useState(initial?.address ?? initialAddress ?? '');
  const [label, setLabel] = useState(initial?.label ?? '');
  const [tagsText, setTagsText] = useState(initial?.tags.join(', ') ?? '');
  const [note, setNote] = useState(initial?.note ?? '');

  const initialChain = useMemo(() => initial?.chains.find(c => c.chainId === firstChainId), [initial, firstChainId]);
  const [chainNote, setChainNote] = useState(initialChain?.note ?? '');
  const [confidence, setConfidence] = useState<Confidence>(initialChain?.confidence ?? 'unverified');
  const [sources, setSources] = useState<SourceInput[]>(
    initialChain?.sources.map(s => ({ url: s.url, title: s.title })) ?? defaultSources ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const switchChain = (next: SupportedChainId) => {
    setChainId(next);
    const ctx = initial?.chains.find(c => c.chainId === next);
    setChainNote(ctx?.note ?? '');
    setConfidence(ctx?.confidence ?? 'unverified');
    setSources(ctx ? ctx.sources.map(s => ({ url: s.url, title: s.title })) : []);
  };

  const validate = (): string | null => {
    if (!isEvmAddress(address)) {
      return 'Enter a valid EVM address (0x followed by 40 hexadecimal characters).';
    }
    const trimmedLabel = label.trim();
    if (trimmedLabel.length < 1 || trimmedLabel.length > LABEL_MAX) {
      return `Label must be 1-${LABEL_MAX} characters.`;
    }
    if (note.length > NOTE_MAX) {
      return `Global note must be ${NOTE_MAX} characters or fewer.`;
    }
    if (chainNote.length > NOTE_MAX) {
      return `Chain note must be ${NOTE_MAX} characters or fewer.`;
    }
    if (sources.length > SOURCE_MAX_PER_RECORD) {
      return `A chain context may have at most ${SOURCE_MAX_PER_RECORD} sources.`;
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    const tags = parseTags(tagsText);
    try {
      if (isEdit && initial) {
        const input: RecordUpdateInput = {
          key: initial.key,
          chainId,
          label: label.trim(),
          tags,
          note,
          chainNote,
          confidence,
          sources,
        };
        await sendMessage({ type: 'RECORD_UPDATE', payload: input });
      } else {
        const input: RecordCreateInput = {
          address: address as EvmAddress,
          chainId,
          label: label.trim(),
          tags,
          note,
          chainNote,
          confidence,
          sources,
        };
        await sendMessage({ type: 'RECORD_CREATE', payload: input });
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save record.');
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">{isEdit ? 'Edit record' : 'New record'}</h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-medium text-slate-600 hover:text-slate-800 focus:outline-none focus-visible:underline">
          Back
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="tracememo-address" className="text-xs font-medium text-slate-600">
          Address
        </label>
        <input
          id="tracememo-address"
          type="text"
          value={address}
          onChange={event => setAddress(event.target.value)}
          readOnly={isEdit}
          spellCheck={false}
          autoComplete="off"
          placeholder="0x…"
          className="w-full rounded border border-slate-300 px-2 py-1.5 font-mono text-xs read-only:bg-slate-100 read-only:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {isEdit && (
          <p className="text-[11px] text-slate-400">One global record per address; the address cannot change.</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="tracememo-label" className="text-xs font-medium text-slate-600">
          Label (shared across chains)
        </label>
        <input
          id="tracememo-label"
          type="text"
          value={label}
          onChange={event => setLabel(event.target.value)}
          maxLength={LABEL_MAX}
          placeholder="Short label for this address"
          className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="text-[11px] text-slate-400">
          {label.length}/{LABEL_MAX}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="tracememo-tags" className="text-xs font-medium text-slate-600">
          Tags (shared, comma-separated)
        </label>
        <input
          id="tracememo-tags"
          type="text"
          value={tagsText}
          onChange={event => setTagsText(event.target.value)}
          placeholder="wallet, exchange, suspicious"
          className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="text-[11px] text-slate-400">Up to {TAGS_MAX} tags; shared across chains.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="tracememo-note" className="text-xs font-medium text-slate-600">
          Global note (shared across chains)
        </label>
        <textarea
          id="tracememo-note"
          value={note}
          onChange={event => setNote(event.target.value)}
          maxLength={NOTE_MAX}
          rows={2}
          placeholder="Notes that apply to this address on every chain"
          className="w-full resize-y rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="rounded border border-slate-200 bg-slate-50 p-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="tracememo-chain" className="text-xs font-medium text-slate-600">
            Chain context
          </label>
          <select
            id="tracememo-chain"
            value={chainId}
            onChange={event => switchChain(Number(event.target.value) as SupportedChainId)}
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
            {(Object.keys(CHAIN_LABELS) as unknown as SupportedChainId[]).map(id => (
              <option key={id} value={id}>
                {CHAIN_LABELS[id]}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400">
            Note, confidence, and sources are stored per chain and are not shared.
          </p>
        </div>

        <div className="mt-2">
          <ConfidenceSelect value={confidence} onChange={setConfidence} />
        </div>

        <div className="mt-2 flex flex-col gap-1">
          <label htmlFor="tracememo-chain-note" className="text-xs font-medium text-slate-600">
            Chain note
          </label>
          <textarea
            id="tracememo-chain-note"
            value={chainNote}
            onChange={event => setChainNote(event.target.value)}
            maxLength={NOTE_MAX}
            rows={3}
            placeholder={`Notes specific to ${CHAIN_LABELS[chainId]}`}
            className="w-full resize-y rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="mt-2">
          <SourceList sources={sources} onChange={setSources} />
        </div>
      </div>

      {error && <p className="rounded bg-red-50 px-2 py-1.5 text-xs text-red-700">{error}</p>}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save record'}
        </button>
      </div>
    </div>
  );
};
