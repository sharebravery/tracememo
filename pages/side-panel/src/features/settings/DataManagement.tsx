import { sendMessage } from '../../messaging';
import { t } from '@extension/i18n';
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
      setMessage(t('data_exported', String(data.records.length)));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('msg_error_export'));
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    setMessage(null);
    setImportResult(null);
    setImportState(null);

    if (file.size > IMPORT_MAX_BYTES) {
      setError(t('data_file_too_large', String(file.size)));
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const data = traceMemoExportSchema.parse(parsed) as TraceMemoExport;
      const preview = await sendMessage({ type: 'DATA_IMPORT_PREVIEW', payload: { data } });
      setImportState({ data, preview });
    } catch (e) {
      setError(e instanceof Error ? t('data_invalid_file', e.message) : t('data_invalid_file', ''));
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
      setError(e instanceof Error ? e.message : t('msg_error_import'));
    }
  };

  const handleClear = async () => {
    try {
      await sendMessage({ type: 'DATA_CLEAR' });
      setClearArmed(false);
      setMessage(t('data_cleared'));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('msg_error_clear'));
    }
  };

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-3">
      <h3 className="text-xs font-semibold text-slate-200">{t('data_backup_title')}</h3>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleExport()}
          className="rounded-lg border border-slate-700 bg-slate-800/50 px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50">
          {t('data_export')}
        </button>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="rounded-lg border border-slate-700 bg-slate-800/50 px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50">
          {t('data_import')}
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
          <p className="font-medium text-violet-200">{t('data_preview_title')}</p>
          <p>
            {t('data_preview_counts', [
              String(importState.preview.total),
              String(importState.preview.created),
              String(importState.preview.updated),
              String(importState.preview.skipped),
            ])}
          </p>
          <p className="mt-1 text-slate-400">{t('data_preview_note')}</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => void confirmImport()}
              className="rounded-lg bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60">
              {t('data_confirm_import')}
            </button>
            <button
              type="button"
              onClick={() => setImportState(null)}
              className="rounded-lg border border-slate-700 bg-slate-800/50 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50">
              {t('library_cancel')}
            </button>
          </div>
        </div>
      )}

      {importResult && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-xs text-emerald-300">
          {t('data_import_complete', [
            String(importResult.created),
            String(importResult.updated),
            String(importResult.skipped),
          ])}
        </p>
      )}

      <div className="border-t border-slate-800 pt-2">
        {!clearArmed ? (
          <button
            type="button"
            onClick={() => setClearArmed(true)}
            className="text-xs font-medium text-rose-400 transition hover:text-rose-300 focus:outline-none focus-visible:underline">
            {t('data_clear')}
          </button>
        ) : (
          <div className="flex flex-col gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-xs text-rose-200">
            <p className="font-medium">{t('data_clear_warning')}</p>
            <button
              type="button"
              onClick={() => void handleExport()}
              className="self-start rounded-lg border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-xs font-medium text-rose-200 transition hover:bg-rose-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50">
              {t('data_backup_first')}
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleClear()}
                className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60">
                {t('data_delete_all')}
              </button>
              <button
                type="button"
                onClick={() => setClearArmed(false)}
                className="rounded-lg border border-slate-700 bg-slate-800/50 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50">
                {t('library_cancel')}
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
