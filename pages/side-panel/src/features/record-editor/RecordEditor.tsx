import { ConfidenceSelect } from './ConfidenceSelect';
import { SourceList } from './SourceList';
import { sendMessage } from '../../messaging';
import { t } from '@extension/i18n';
import {
  CHAIN_LABELS,
  isEvmAddress,
  LABEL_MAX,
  NOTE_MAX,
  SOURCE_MAX_PER_RECORD,
  SUPPORTED_CHAINS,
  TAGS_MAX,
} from '@extension/shared';
import { useMemo, useRef, useState } from 'react';
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

  // chainId is undefined for a global-only record (generic page, or a saved
  // record with no chain contexts yet). The Chain Context section only appears
  // once the user explicitly chooses a chain - we never fabricate a chain
  // context by default (no Ethereum default). `chainPickerOpen` reveals the
  // chain selector before any chain is chosen.
  const [chainId, setChainId] = useState<SupportedChainId | undefined>(initialChainId);
  const [chainPickerOpen, setChainPickerOpen] = useState(false);
  const [address, setAddress] = useState(initial?.address ?? initialAddress ?? '');
  const [label, setLabel] = useState(initial?.label ?? '');
  const [tagsText, setTagsText] = useState(initial?.tags.join(', ') ?? '');
  const [note, setNote] = useState(initial?.note ?? '');

  const initialChain = useMemo(
    () => (initialChainId ? initial?.chains.find(c => c.chainId === initialChainId) : undefined),
    [initial, initialChainId],
  );
  const [chainNote, setChainNote] = useState(initialChain?.note ?? '');
  const [confidence, setConfidence] = useState<Confidence>(initialChain?.confidence ?? 'unverified');
  const [sources, setSources] = useState<SourceInput[]>(
    initialChain?.sources.map(s => ({ url: s.url, title: s.title })) ?? defaultSources ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Per-chain drafts so switching chains never silently discards unsaved input.
  const drafts = useRef<
    Partial<Record<SupportedChainId, { chainNote: string; confidence: Confidence; sources: SourceInput[] }>>
  >({});

  const switchChain = (next: SupportedChainId) => {
    if (next === chainId) {
      return;
    }
    // Stash the current chain's input.
    if (chainId) {
      drafts.current[chainId] = { chainNote, confidence, sources };
    }
    setChainId(next);
    // Restore a draft if we have one for the target chain; else load saved.
    const draft = drafts.current[next];
    if (draft) {
      setChainNote(draft.chainNote);
      setConfidence(draft.confidence);
      setSources(draft.sources);
      return;
    }
    const ctx = initial?.chains.find(c => c.chainId === next);
    setChainNote(ctx?.note ?? '');
    setConfidence(ctx?.confidence ?? 'unverified');
    setSources(ctx ? ctx.sources.map(s => ({ url: s.url, title: s.title })) : []);
  };

  const validate = (): string | null => {
    if (!isEvmAddress(address)) {
      return t('validation_address');
    }
    const trimmedLabel = label.trim();
    if (trimmedLabel.length < 1 || trimmedLabel.length > LABEL_MAX) {
      return t('validation_label', String(LABEL_MAX));
    }
    if (note.length > NOTE_MAX) {
      return t('validation_global_note', String(NOTE_MAX));
    }
    if (chainId && chainNote.length > NOTE_MAX) {
      return t('validation_chain_note', String(NOTE_MAX));
    }
    if (sources.length > SOURCE_MAX_PER_RECORD) {
      return t('validation_sources_max', String(SOURCE_MAX_PER_RECORD));
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
        // Without a chainId, only global fields are updated - no chain context
        // is created. With a chainId, that one chain context is upserted.
        const input: RecordUpdateInput = {
          key: initial.key,
          label: label.trim(),
          tags,
          note,
          ...(chainId ? { chainId, chainNote, confidence, sources } : {}),
        };
        await sendMessage({ type: 'RECORD_UPDATE', payload: input });
      } else {
        const input: RecordCreateInput = {
          address: address as EvmAddress,
          ...(chainId ? { chainId, chainNote, confidence, sources } : {}),
          label: label.trim(),
          tags,
          note,
        };
        await sendMessage({ type: 'RECORD_CREATE', payload: input });
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('msg_error_save'));
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">
          {isEdit ? t('editor_edit_record') : t('editor_new_record')}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-medium text-slate-400 transition hover:text-slate-200 focus:outline-none focus-visible:underline">
          {t('editor_back')}
        </button>
      </div>

      {/* Global section - always shown. */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-2.5">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">
          {t('editor_global_section')}
        </p>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="tracememo-address" className="text-[11px] font-medium text-slate-400">
              {t('editor_address')}
            </label>
            <input
              id="tracememo-address"
              type="text"
              value={address}
              onChange={event => setAddress(event.target.value)}
              readOnly={isEdit}
              spellCheck={false}
              autoComplete="off"
              placeholder={t('editor_address_placeholder')}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 font-mono text-xs text-slate-100 placeholder:text-slate-500 read-only:opacity-60 focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
            />
            {isEdit && <p className="text-[11px] text-slate-500">{t('editor_address_readonly')}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="tracememo-label" className="text-[11px] font-medium text-slate-400">
              {t('editor_label')}
            </label>
            <input
              id="tracememo-label"
              type="text"
              value={label}
              onChange={event => setLabel(event.target.value)}
              maxLength={LABEL_MAX}
              placeholder={t('editor_label_placeholder')}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
            />
            <p className="text-[10px] text-slate-600">
              {label.length}/{LABEL_MAX}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="tracememo-tags" className="text-[11px] font-medium text-slate-400">
              {t('editor_tags')}
            </label>
            <input
              id="tracememo-tags"
              type="text"
              value={tagsText}
              onChange={event => setTagsText(event.target.value)}
              placeholder={t('editor_tags_placeholder')}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
            />
            <p className="text-[10px] text-slate-600">{t('editor_tags_hint', String(TAGS_MAX))}</p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="tracememo-note" className="text-[11px] font-medium text-slate-400">
              {t('editor_global_note')}
            </label>
            <textarea
              id="tracememo-note"
              value={note}
              onChange={event => setNote(event.target.value)}
              maxLength={NOTE_MAX}
              rows={2}
              placeholder={t('editor_global_note_placeholder')}
              className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800/50 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
            />
          </div>
        </div>
      </div>

      {/* Chain Context section - only when a chain is set (existing or added). */}
      {chainId ? (
        <div className="rounded-lg border border-slate-700 bg-slate-800/20 p-2.5">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-cyan-500">
            {t('editor_chain_section')}
          </p>
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1">
              <label htmlFor="tracememo-chain" className="text-[11px] font-medium text-slate-400">
                {t('editor_choose_chain')}
              </label>
              <select
                id="tracememo-chain"
                value={chainId}
                onChange={event => switchChain(Number(event.target.value) as SupportedChainId)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-2 py-1.5 text-sm text-slate-100 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30">
                {SUPPORTED_CHAINS.map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-900">
                    {CHAIN_LABELS[c.id]}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-600">{t('editor_chain_hint')}</p>
            </div>

            <ConfidenceSelect value={confidence} onChange={setConfidence} />

            <div className="flex flex-col gap-1">
              <label htmlFor="tracememo-chain-note" className="text-[11px] font-medium text-slate-400">
                {t('editor_chain_note')}
              </label>
              <textarea
                id="tracememo-chain-note"
                value={chainNote}
                onChange={event => setChainNote(event.target.value)}
                maxLength={NOTE_MAX}
                rows={3}
                placeholder={t('editor_chain_note_placeholder', CHAIN_LABELS[chainId])}
                className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800/50 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
              />
            </div>

            <SourceList sources={sources} onChange={setSources} />
          </div>
        </div>
      ) : chainPickerOpen ? (
        <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/30 p-2.5">
          <div className="flex flex-col gap-1">
            <label htmlFor="tracememo-chain" className="text-[11px] font-medium text-slate-400">
              {t('editor_choose_chain')}
            </label>
            <select
              id="tracememo-chain"
              value=""
              onChange={event => {
                const next = Number(event.target.value);
                if (next) {
                  // Choosing a chain sets chainId; confidence/note/sources only
                  // appear after this choice. No ChainContext is created until
                  // the user picks a chain and saves.
                  switchChain(next as SupportedChainId);
                }
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-2 py-1.5 text-sm text-slate-100 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30">
              <option value="" disabled>
                {t('editor_choose_chain')}
              </option>
              {SUPPORTED_CHAINS.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-900">
                  {CHAIN_LABELS[c.id]}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-600">{t('editor_chain_hint')}</p>
          </div>
          <button
            type="button"
            onClick={() => setChainPickerOpen(false)}
            className="mt-1 self-start text-[11px] font-medium text-slate-500 transition hover:text-slate-300 focus:outline-none focus-visible:underline">
            {t('editor_cancel')}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setChainPickerOpen(true)}
          className="self-start rounded-lg border border-dashed border-slate-700 bg-slate-900/30 px-3 py-1.5 text-xs font-medium text-cyan-400 transition hover:border-cyan-500/50 hover:bg-slate-800/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50">
          + {t('editor_add_chain_context')}
        </button>
      )}

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-xs text-rose-300">{error}</p>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 disabled:opacity-50">
          {t('editor_cancel')}
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 disabled:opacity-50">
          {saving ? t('editor_saving') : t('editor_save')}
        </button>
      </div>
    </div>
  );
};
