import { CurrentPageView } from './features/current-page/CurrentPageView';
import { LibraryView } from './features/library/LibraryView';
import { Onboarding } from './features/onboarding/Onboarding';
import { SettingsView } from './features/settings/SettingsView';
import { sendMessage } from './messaging';
import { TABS } from './routes';
import { PENDING_RECORD_STORAGE_KEY } from '@extension/shared';
import { useEffect, useState } from 'react';
import type { TabId } from './routes';
import type { AddressKey } from '@extension/shared';

type ReadyState = { onboarding: boolean } | { loading: true };

const App = () => {
  const [tab, setTab] = useState<TabId>('library');
  const [pendingKey, setPendingKey] = useState<AddressKey | undefined>(undefined);
  const [ready, setReady] = useState<ReadyState>({ loading: true });

  useEffect(() => {
    const init = async () => {
      try {
        const settings = await sendMessage({ type: 'SETTINGS_GET' });
        setReady({ onboarding: !settings.onboardingSeen });
      } catch {
        // If settings cannot be read, skip onboarding rather than blocking the UI.
        setReady({ onboarding: false });
      }

      // If the side panel was opened from an annotation click, focus that record.
      const data = await chrome.storage.session.get(PENDING_RECORD_STORAGE_KEY);
      const key = data[PENDING_RECORD_STORAGE_KEY] as AddressKey | undefined;
      if (key) {
        setPendingKey(key);
        setTab('library');
        void chrome.storage.session.remove(PENDING_RECORD_STORAGE_KEY);
      }
    };
    void init();
  }, []);

  if ('loading' in ready) {
    return <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading…</div>;
  }

  if (ready.onboarding) {
    return <Onboarding onDone={() => setReady({ onboarding: false })} />;
  }

  return (
    <div className="flex h-full flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 px-4 py-3">
        <h1 className="text-base font-semibold">TraceMemo</h1>
        <p className="text-xs text-slate-500">Private context for every onchain address</p>
      </header>

      <div className="flex border-b border-slate-200" role="tablist" aria-label="TraceMemo views">
        {TABS.map(tabDef => {
          const selected = tab === tabDef.id;
          return (
            <button
              key={tabDef.id}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => setTab(tabDef.id)}
              className={
                'flex-1 px-3 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ' +
                (selected
                  ? 'border-b-2 border-blue-600 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
              }>
              {tabDef.label}
            </button>
          );
        })}
      </div>

      <main className="flex-1 overflow-y-auto p-4">
        {tab === 'current' && <CurrentPageView />}
        {tab === 'library' && <LibraryView initialEditKey={pendingKey} />}
        {tab === 'settings' && <SettingsView />}
      </main>
    </div>
  );
};

export default App;
