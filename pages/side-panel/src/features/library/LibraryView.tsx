import { AddressRow } from './AddressRow';
import { EmptyState } from './EmptyState';
import { filterRecords } from './filter-records';
import { SearchInput } from './SearchInput';
import { sendMessage } from '../../messaging';
import { RecordEditor } from '../record-editor/RecordEditor';
import { useEffect, useState } from 'react';
import type { AddressKey, AddressRecord, Confidence } from '@extension/shared';

type ConfidenceFilter = Confidence | 'all';

const CONFIDENCE_FILTER_OPTIONS: { value: ConfidenceFilter; label: string }[] = [
  { value: 'all', label: 'All confidence' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'likely', label: 'Likely' },
  { value: 'unverified', label: 'Unverified' },
];

interface LibraryViewProps {
  /** When set, open this record in the editor on mount (from an annotation click). */
  initialEditKey?: AddressKey;
}

export const LibraryView = ({ initialEditKey }: LibraryViewProps = {}) => {
  const [records, setRecords] = useState<AddressRecord[] | null>(null);
  const [query, setQuery] = useState('');
  const [confidence, setConfidence] = useState<ConfidenceFilter>('all');
  const [editing, setEditing] = useState<{ record?: AddressRecord } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setRecords(await sendMessage({ type: 'RECORD_LIST' }));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load records.');
      setRecords([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      await refresh();
      if (initialEditKey) {
        try {
          const record = await sendMessage({ type: 'RECORD_GET', payload: { key: initialEditKey } });
          if (record) {
            setEditing({ record });
          }
        } catch {
          // Pending record no longer exists; ignore.
        }
      }
    };
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (record: AddressRecord) => {
    try {
      await sendMessage({ type: 'RECORD_DELETE', payload: { key: record.key } });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete record.');
    }
  };

  if (editing) {
    return (
      <RecordEditor
        initial={editing.record}
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
        <h2 className="text-sm font-semibold text-slate-700">Library</h2>
        <button
          type="button"
          onClick={() => setEditing({})}
          className="rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
          New Record
        </button>
      </div>

      {records !== null && records.length > 0 && (
        <div className="flex flex-col gap-2">
          <SearchInput value={query} onChange={setQuery} />
          <div className="flex flex-col gap-1">
            <label htmlFor="tracememo-confidence-filter" className="text-xs font-medium text-slate-600">
              Confidence
            </label>
            <select
              id="tracememo-confidence-filter"
              value={confidence}
              onChange={event => setConfidence(event.target.value as ConfidenceFilter)}
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              {CONFIDENCE_FILTER_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {error && <p className="rounded bg-red-50 px-2 py-1.5 text-xs text-red-700">{error}</p>}

      {records === null && <p className="text-sm text-slate-500">Loading records…</p>}

      {hasNoRecords && (
        <EmptyState
          message="No saved addresses yet. Add your first record to start building context."
          actionLabel="New Record"
          onAction={() => setEditing({})}
        />
      )}

      {isEmpty && !hasNoRecords && <p className="text-sm text-slate-500">No records match your search.</p>}

      {filtered && filtered.length > 0 && (
        <ul className="flex flex-col gap-2">
          {filtered.map(record => (
            <AddressRow
              key={record.key}
              record={record}
              onEdit={() => setEditing({ record })}
              onDelete={() => void handleDelete(record)}
            />
          ))}
        </ul>
      )}
    </div>
  );
};
