import { sendMessage } from '../../messaging';
import { IMPORT_MAX_BYTES, traceMemoExportSchema } from '@extension/shared';
import { useRef, useState } from 'react';
import type { ImportPreview, ImportResult, TraceMemoExport } from '@extension/shared';

const todayStamp = () => new Date().toISOString().slice(0, 10);

const downloadJson = (filename: string, data: unknown): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

interface ImportState {
  data: TraceMemoExport;
  preview: ImportPreview;
}

export const DataManagement = () => {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importState, setImportState] = useState<ImportState | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [clearArmed, setClearArmed] = useState(false);

  const handleExport = async () => {
    try {
      const data = await sendMessage({ type: 'DATA_EXPORT' });
      downloadJson(`tracememo-backup-${todayStamp()}.json`, data);
      setMessage(`Exported ${data.records.length} record${data.records.length === 1 ? '' : 's'}.`);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed.');
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setMessage(null);
    setImportResult(null);
    setImportState(null);

    if (file.size > IMPORT_MAX_BYTES) {
      setError(`File is ${file.size} bytes, larger than the 10 MB limit. Import cancelled.`);
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      // Strict all-or-nothing validation: any invalid record rejects the file.
      const data = traceMemoExportSchema.parse(parsed) as TraceMemoExport;
      const preview = await sendMessage({ type: 'DATA_IMPORT_PREVIEW', payload: { data } });
      setImportState({ data, preview });
    } catch (e) {
      setError(e instanceof Error ? `Invalid TraceMemo file: ${e.message}` : 'Invalid TraceMemo file.');
    }
  };

  const confirmImport = async () => {
    if (!importState) return;
    try {
      const result = await sendMessage({ type: 'DATA_IMPORT', payload: { data: importState.data } });
      setImportResult(result);
      setImportState(null);
      setMessage(null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.');
    }
  };

  const handleClear = async () => {
    try {
      await sendMessage({ type: 'DATA_CLEAR' });
      setClearArmed(false);
      setMessage('All records cleared.');
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Clear failed.');
    }
  };

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <h3 className="text-xs font-semibold text-slate-200">Backup &amp; data</h3>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleExport()}
          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50">
          Export backup (.json)
        </button>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50">
          Import backup…
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={event => {
            const file = event.target.files?.[0];
            if (file) {
              void handleFile(file);
            }
            event.target.value = '';
          }}
        />
      </div>

      {importState && (
        <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 p-2 text-xs text-slate-200">
          <p className="font-medium text-violet-200">Import preview (all records valid)</p>
          <p>
            {importState.preview.total} record{importState.preview.total === 1 ? '' : 's'}:{' '}
            {importState.preview.created} new, {importState.preview.updated} to update, {importState.preview.skipped}{' '}
            kept (older or equal).
          </p>
          <p className="mt-1 text-slate-400">
            Writes happen in one transaction. If any record were invalid the whole file would be rejected.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => void confirmImport()}
              className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-2.5 py-1 text-xs font-semibold text-white shadow-md shadow-violet-500/25 transition hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60">
              Confirm import
            </button>
            <button
              type="button"
              onClick={() => setImportState(null)}
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {importResult && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-xs text-emerald-300">
          Import complete: {importResult.created} added, {importResult.updated} updated, {importResult.skipped} kept.
        </p>
      )}

      <div className="border-t border-white/5 pt-2">
        {!clearArmed ? (
          <button
            type="button"
            onClick={() => setClearArmed(true)}
            className="text-xs font-medium text-rose-400 transition hover:text-rose-300 focus:outline-none focus-visible:underline">
            Clear all records…
          </button>
        ) : (
          <div className="flex flex-col gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-rose-200">
            <p className="font-medium">This deletes every saved record on this device.</p>
            <button
              type="button"
              onClick={() => void handleExport()}
              className="self-start rounded-lg border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-xs font-medium text-rose-200 transition hover:bg-rose-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50">
              Download a backup first (recommended)
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleClear()}
                className="rounded-lg bg-gradient-to-r from-rose-600 to-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow-md shadow-rose-500/25 transition hover:from-rose-500 hover:to-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60">
                Yes, delete everything
              </button>
              <button
                type="button"
                onClick={() => setClearArmed(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {message && <p className="text-xs text-slate-400">{message}</p>}
      {error && <p className="text-xs text-rose-300">{error}</p>}
    </section>
  );
};
