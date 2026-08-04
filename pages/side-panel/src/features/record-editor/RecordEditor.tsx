import { ConfidenceSelect } from './ConfidenceSelect';
import { SourceList } from './SourceList';
import { sendMessage } from '../../messaging';
import { CHAIN_LABELS, isEvmAddress, LABEL_MAX, NOTE_MAX, SOURCE_MAX_PER_RECORD } from '@extension/shared';
import { useState } from 'react';
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
  const [chainId, setChainId] = useState<SupportedChainId>(initial?.chainId ?? initialChainId ?? 1);
  const [address, setAddress] = useState(initial?.address ?? initialAddress ?? '');
  const [label, setLabel] = useState(initial?.label ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [confidence, setConfidence] = useState<Confidence>(initial?.confidence ?? 'unverified');
  const [sources, setSources] = useState<SourceInput[]>(
    initial?.sources.map(s => ({ url: s.url, title: s.title })) ?? defaultSources ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const validate = (): string | null => {
    if (!isEvmAddress(address)) {
      return 'Enter a valid EVM address (0x followed by 40 hexadecimal characters).';
    }
    const trimmedLabel = label.trim();
    if (trimmedLabel.length < 1 || trimmedLabel.length > LABEL_MAX) {
      return `Label must be 1-${LABEL_MAX} characters.`;
    }
    if (note.length > NOTE_MAX) {
      return `Note must be ${NOTE_MAX} characters or fewer.`;
    }
    if (sources.length > SOURCE_MAX_PER_RECORD) {
      return `A record may have at most ${SOURCE_MAX_PER_RECORD} sources.`;
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

    try {
      if (isEdit && initial) {
        const input: RecordUpdateInput = {
          key: initial.key,
          label: label.trim(),
          note,
          confidence,
          sources,
        };
        await sendMessage({ type: 'RECORD_UPDATE', payload: input });
      } else {
        const input: RecordCreateInput = {
          chainId,
          address: address as EvmAddress,
          label: label.trim(),
          note,
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
        <label htmlFor="tracememo-chain" className="text-xs font-medium text-slate-600">
          Chain
        </label>
        <select
          id="tracememo-chain"
          value={chainId}
          onChange={event => setChainId(Number(event.target.value) as SupportedChainId)}
          disabled={isEdit}
          className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500">
          {(Object.keys(CHAIN_LABELS) as unknown as SupportedChainId[]).map(id => (
            <option key={id} value={id}>
              {CHAIN_LABELS[id]}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-slate-400">
          A record is specific to one chain. The same address on Ethereum and Base is separate.
        </p>
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
          <p className="text-[11px] text-slate-400">The address and chain cannot be changed on an existing record.</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="tracememo-label" className="text-xs font-medium text-slate-600">
          Label
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

      <ConfidenceSelect value={confidence} onChange={setConfidence} />

      <div className="flex flex-col gap-1">
        <label htmlFor="tracememo-note" className="text-xs font-medium text-slate-600">
          Note (optional)
        </label>
        <textarea
          id="tracememo-note"
          value={note}
          onChange={event => setNote(event.target.value)}
          maxLength={NOTE_MAX}
          rows={4}
          placeholder="Why does this address matter? What did you find?"
          className="w-full resize-y rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="text-[11px] text-slate-400">
          {note.length}/{NOTE_MAX}
        </p>
      </div>

      <SourceList sources={sources} onChange={setSources} />

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
