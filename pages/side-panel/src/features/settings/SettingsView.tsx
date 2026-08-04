import { DataManagement } from './DataManagement';
import { sendMessage } from '../../messaging';
import { useEffect, useState } from 'react';
import type { Settings } from '@extension/shared';

export const SettingsView = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setSettings(await sendMessage({ type: 'SETTINGS_GET' }));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load settings.');
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
      setError(e instanceof Error ? e.message : 'Failed to update settings.');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-slate-700">Settings</h2>

      <section className="flex items-start gap-2 text-sm text-slate-700">
        <input
          id="tracememo-annotations"
          type="checkbox"
          checked={settings?.annotationsEnabled ?? true}
          onChange={event => void toggleAnnotations(event.target.checked)}
          disabled={settings === null}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
        />
        <div>
          <label htmlFor="tracememo-annotations" className="font-medium text-slate-700">
            Show private labels on Etherscan and BaseScan
          </label>
          <p className="mt-0.5 text-xs text-slate-500">
            When off, TraceMemo stops annotating addresses on explorer pages. Your saved records are kept.
          </p>
        </div>
      </section>

      {error && <p className="rounded bg-red-50 px-2 py-1.5 text-xs text-red-700">{error}</p>}

      <DataManagement />

      <section className="rounded border border-slate-200 bg-white p-3 text-xs text-slate-600">
        <h3 className="mb-1 text-xs font-semibold text-slate-700">Privacy &amp; permissions</h3>
        <ul className="list-disc space-y-1 pl-4">
          <li>Records stay on this device only.</li>
          <li>TraceMemo reads Etherscan and BaseScan pages to find addresses and show your private labels.</li>
          <li>No wallet connection, no transactions, no balances, no RPC calls.</li>
          <li>No analytics or external data transmission.</li>
        </ul>
      </section>
    </div>
  );
};
