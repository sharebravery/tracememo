import { sendMessage } from '../../messaging';
import { addressRecordSchema, traceMemoExportEnvelopeSchema } from '@extension/shared';
import { useRef, useState } from 'react';
import type { ImportResult, TraceMemoExport } from '@extension/shared';

const MAX_IMPORT_BYTES = 10 * 1024 * 1024; // 10 MB
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

interface ImportPreview {
  total: number;
  valid: number;
  invalid: number;
  envelope: TraceMemoExport;
}

export const DataManagement = () => {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
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
    setPreview(null);

    if (file.size > MAX_IMPORT_BYTES) {
      setError('File is larger than 10 MB. Import cancelled.');
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const envelope = traceMemoExportEnvelopeSchema.parse(parsed) as TraceMemoExport;

      let valid = 0;
      let invalid = 0;
      for (const record of envelope.records) {
        if (addressRecordSchema.safeParse(record).success) {
          valid += 1;
        } else {
          invalid += 1;
        }
      }

      setPreview({ total: envelope.records.length, valid, invalid, envelope });
    } catch (e) {
      setError(e instanceof Error ? `Invalid TraceMemo file: ${e.message}` : 'Invalid TraceMemo file.');
    }
  };

  const confirmImport = async () => {
    if (!preview) return;
    try {
      const result = await sendMessage({ type: 'DATA_IMPORT', payload: preview.envelope });
      setImportResult(result);
      setPreview(null);
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
    <section className="flex flex-col gap-3 rounded border border-slate-200 bg-white p-3">
      <h3 className="text-xs font-semibold text-slate-700">Backup &amp; data</h3>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleExport()}
          className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
          Export backup (.json)
        </button>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
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

      {preview && (
        <div className="rounded bg-slate-50 p-2 text-xs text-slate-700">
          <p className="font-medium">Import preview</p>
          <p>
            {preview.total} record{preview.total === 1 ? '' : 's'}: {preview.valid} valid, {preview.invalid} to skip.
          </p>
          <p className="mt-1 text-slate-500">
            Existing records with a newer <code>updatedAt</code> are kept; incoming newer records overwrite.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => void confirmImport()}
              className="rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              Confirm import
            </button>
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              Cancel
            </button>
          </div>
        </div>
      )}

      {importResult && (
        <p className="rounded bg-emerald-50 px-2 py-1.5 text-xs text-emerald-800">
          Import complete: {importResult.created} added, {importResult.updated} updated, {importResult.skipped} kept,
          {' ' + importResult.invalid} invalid.
        </p>
      )}

      <div className="border-t border-slate-200 pt-2">
        {!clearArmed ? (
          <button
            type="button"
            onClick={() => setClearArmed(true)}
            className="text-xs font-medium text-red-600 hover:text-red-700 focus:outline-none focus-visible:underline">
            Clear all records…
          </button>
        ) : (
          <div className="flex flex-col gap-2 rounded bg-red-50 p-2 text-xs text-red-800">
            <p className="font-medium">This deletes every saved record on this device.</p>
            <button
              type="button"
              onClick={() => void handleExport()}
              className="self-start rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
              Download a backup first (recommended)
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleClear()}
                className="rounded bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
                Yes, delete everything
              </button>
              <button
                type="button"
                onClick={() => setClearArmed(false)}
                className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {message && <p className="text-xs text-slate-600">{message}</p>}
      {error && <p className="text-xs text-red-700">{error}</p>}
    </section>
  );
};
