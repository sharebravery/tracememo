import { CurrentPageView } from './features/current-page/CurrentPageView';
import { LibraryView } from './features/library/LibraryView';
import { Onboarding } from './features/onboarding/Onboarding';
import { SettingsView } from './features/settings/SettingsView';
import { sendMessage } from './messaging';
import { TABS } from './routes';
import { PENDING_RECORD_STORAGE_KEY } from '@extension/shared';
import { useEffect, useState } from 'react';
import type { TabId } from './routes';
import type { AddressKey, SupportedChainId } from '@extension/shared';

type ReadyState = { onboarding: boolean } | { loading: true };

const App = () => {
  const [tab, setTab] = useState<TabId>('library');
  const [pendingKey, setPendingKey] = useState<AddressKey | undefined>(undefined);
  const [pendingChainId, setPendingChainId] = useState<SupportedChainId | undefined>(undefined);
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

      // If the side panel was opened from an annotation click, focus that record
      // on the chain the click came from.
      const data = await chrome.storage.session.get(PENDING_RECORD_STORAGE_KEY);
      const pending = data[PENDING_RECORD_STORAGE_KEY] as { key: AddressKey; chainId: SupportedChainId } | undefined;
      if (pending) {
        setPendingKey(pending.key);
        setPendingChainId(pending.chainId);
        setTab('library');
        void chrome.storage.session.remove(PENDING_RECORD_STORAGE_KEY);
      }
    };
    void init();
  }, []);

  if ('loading' in ready) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400">
        <span className="animate-pulse">Loading…</span>
      </div>
    );
  }

  if (ready.onboarding) {
    return <Onboarding onDone={() => setReady({ onboarding: false })} />;
  }

  return (
    <div className="flex h-full flex-col text-slate-100">
      <header className="flex items-center justify-between px-4 pb-2 pt-3.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-indigo-500 text-[11px] font-bold text-white shadow-lg shadow-violet-500/30">
            T
          </span>
          <h1 className="bg-gradient-to-r from-violet-300 via-indigo-200 to-cyan-200 bg-clip-text text-base font-semibold text-transparent">
            TraceMemo
          </h1>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-400">
          local-first
        </span>
      </header>

      <div className="flex gap-1 px-3 pb-1" role="tablist" aria-label="TraceMemo views">
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
                'flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 ' +
                (selected
                  ? 'bg-gradient-to-r from-violet-600/80 to-indigo-600/80 text-white shadow-md shadow-violet-500/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200')
              }>
              {tabDef.label}
            </button>
          );
        })}
      </div>

      <div className="mx-4 mb-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <main className="flex-1 overflow-y-auto px-4 pb-4 pt-2">
        {tab === 'current' && <CurrentPageView />}
        {tab === 'library' && <LibraryView initialEditKey={pendingKey} initialEditChainId={pendingChainId} />}
        {tab === 'settings' && <SettingsView />}
      </main>
    </div>
  );
};

export default App;
