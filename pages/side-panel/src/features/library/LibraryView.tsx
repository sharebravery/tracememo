import { AddressRow } from './AddressRow';
import { EmptyState } from './EmptyState';
import { filterRecords } from './filter-records';
import { SearchInput } from './SearchInput';
import { sendMessage } from '../../messaging';
import { RecordEditor } from '../record-editor/RecordEditor';
import { t } from '@extension/i18n';
import { useEffect, useState } from 'react';
import type { AddressKey, AddressRecord, Confidence, SupportedChainId } from '@extension/shared';

type ConfidenceFilter = Confidence | 'all';
type EditingState =
  | { mode: 'create' }
  | { mode: 'update'; record: AddressRecord; chainId: SupportedChainId | undefined }
  | null;

interface LibraryViewProps {
  /** When set, open this record (from an annotation click). */
  initialEditKey?: AddressKey;
  initialEditChainId?: SupportedChainId;
  /** Incremented on each annotation click; the focus effect re-runs on change
   * so the editor opens even when the side panel is already mounted, and even
   * when the same record is clicked again. */
  focusNonce?: number;
}

export const LibraryView = ({ initialEditKey, initialEditChainId, focusNonce }: LibraryViewProps = {}) => {
  const [records, setRecords] = useState<AddressRecord[] | null>(null);
  const [query, setQuery] = useState('');
  const [confidence, setConfidence] = useState<ConfidenceFilter>('all');
  const [editing, setEditing] = useState<EditingState>(null);
  const [error, setError] = useState<string | null>(null);

  const confidenceFilterOptions: { value: ConfidenceFilter; label: string }[] = [
    { value: 'all', label: t('library_all_confidence') },
    { value: 'confirmed', label: t('confidence_confirmed') },
    { value: 'likely', label: t('confidence_likely') },
    { value: 'unverified', label: t('confidence_unverified') },
  ];

  const refresh = async () => {
    try {
      setRecords(await sendMessage({ type: 'RECORD_LIST' }));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('msg_error_load_records'));
      setRecords([]);
    }
  };

  // Load the list once on mount.
  useEffect(() => {
    void refresh();
  }, []);

  // Respond to a new annotation-click focus (initial mount AND live while open).
  useEffect(() => {
    if (!initialEditKey) {
      return;
    }
    let cancelled = false;
    const open = async () => {
      try {
        const record = await sendMessage({ type: 'RECORD_GET', payload: { key: initialEditKey } });
        if (!cancelled && record) {
          // No `?? 1` - a global-only record opens in global-only mode.
          setEditing({ mode: 'update', record, chainId: initialEditChainId ?? record.chains[0]?.chainId });
        }
      } catch {
        // Pending record no longer exists; ignore.
      }
    };
    void open();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusNonce]);

  const handleDelete = async (record: AddressRecord) => {
    try {
      await sendMessage({ type: 'RECORD_DELETE', payload: { key: record.key } });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('msg_error_delete'));
    }
  };

  if (editing) {
    return (
      <RecordEditor
        mode={editing.mode}
        initial={editing.mode === 'update' ? editing.record : undefined}
        initialChainId={editing.mode === 'update' ? editing.chainId : undefined}
        onSaved={() => {
          setEditing(null);
          void refresh();
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  const filtered = records ? filterRecords(records, { query, confidence }) : null;
  const isEmpty = filtered !== null && filtered.length === 0;
  const hasNoRecords = records !== null && records.length === 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-200">{t('library_title')}</h2>
        <button
          type="button"
          onClick={() => setEditing({ mode: 'create' })}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-2.5 py-1 text-xs font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60">
          {t('library_new_record')}
        </button>
      </div>

      {records !== null && records.length > 0 && (
        <div className="flex flex-col gap-2">
          <SearchInput value={query} onChange={setQuery} />
          <div className="flex flex-col gap-1">
            <label
              htmlFor="tracememo-confidence-filter"
              className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              {t('library_confidence')}
            </label>
            <select
              id="tracememo-confidence-filter"
              value={confidence}
              onChange={event => setConfidence(event.target.value as ConfidenceFilter)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-slate-100 focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/40">
              {confidenceFilterOptions.map(option => (
                <option key={option.value} value={option.value} className="bg-slate-900">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-xs text-rose-300">{error}</p>
      )}

      {records === null && <p className="text-sm text-slate-500">{t('library_loading')}</p>}

      {hasNoRecords && (
        <EmptyState
          message={t('library_empty')}
          actionLabel={t('library_new_record_short')}
          onAction={() => setEditing({ mode: 'create' })}
        />
      )}

      {isEmpty && !hasNoRecords && <p className="text-sm text-slate-500">{t('library_no_match')}</p>}

      {filtered && filtered.length > 0 && (
        <ul className="flex flex-col gap-2">
          {filtered.map(record => (
            <AddressRow
              key={record.key}
              record={record}
              onEdit={chainId => setEditing({ mode: 'update', record, chainId })}
              onDelete={() => void handleDelete(record)}
            />
          ))}
        </ul>
      )}
    </div>
  );
};
