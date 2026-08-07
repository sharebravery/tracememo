import { DataManagement } from './DataManagement';
import { sendMessage } from '../../messaging';
import { t } from '@extension/i18n';
import { SUPPORTED_CHAINS } from '@extension/shared';
import { useEffect, useState } from 'react';
import type { Settings } from '@extension/shared';

const chainNames = SUPPORTED_CHAINS.map(c => c.label).join(', ');

export const SettingsView = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setSettings(await sendMessage({ type: 'SETTINGS_GET' }));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('msg_error_load_settings'));
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const toggleAnnotations = async (enabled: boolean) => {
    try {
      setSettings(await sendMessage({ type: 'SETTINGS_UPDATE', payload: { annotationsEnabled: enabled } }));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('msg_error_update_settings'));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-slate-200">{t('settings_title')}</h2>

      <section className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-sm">
        <button
          type="button"
          role="switch"
          aria-checked={settings?.annotationsEnabled ?? true}
          aria-labelledby="tracememo-annotations-label"
          onClick={() => void toggleAnnotations(!(settings?.annotationsEnabled ?? true))}
          disabled={settings === null}
          className={`mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 disabled:opacity-50 ${
            (settings?.annotationsEnabled ?? true)
              ? 'border-violet-500/50 bg-violet-600'
              : 'border-slate-700 bg-slate-800'
          }`}>
          <span
            className={`h-3.5 w-3.5 transform rounded-full bg-white shadow transition ${
              (settings?.annotationsEnabled ?? true) ? 'translate-x-3.5' : 'translate-x-0.5'
            }`}
          />
        </button>
        <div>
          <span id="tracememo-annotations-label" className="font-medium text-slate-100">
            {t('settings_annotations', chainNames)}
          </span>
          <p className="mt-0.5 text-xs text-slate-400">{t('settings_annotations_off')}</p>
        </div>
      </section>

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-xs text-rose-300">{error}</p>
      )}

      <DataManagement />

      <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-400">
        <h3 className="mb-1.5 text-xs font-semibold text-slate-200">{t('settings_privacy_title')}</h3>
        <ul className="space-y-1">
          <li className="flex gap-1.5">
            <span className="text-emerald-400">●</span> {t('settings_privacy_local')}
          </li>
          <li className="flex gap-1.5">
            <span className="text-emerald-400">●</span> {t('settings_privacy_reads', chainNames)}
          </li>
          <li className="flex gap-1.5">
            <span className="text-emerald-400">●</span> {t('settings_privacy_no_wallet')}
          </li>
          <li className="flex gap-1.5">
            <span className="text-emerald-400">●</span> {t('settings_privacy_no_analytics')}
          </li>
        </ul>
      </section>
    </div>
  );
};
