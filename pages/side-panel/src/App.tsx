import { CurrentPageView } from './features/current-page/CurrentPageView';
import { LibraryView } from './features/library/LibraryView';
import { Onboarding } from './features/onboarding/Onboarding';
import { SettingsView } from './features/settings/SettingsView';
import { sendMessage } from './messaging';
import { TABS } from './routes';
import { PENDING_RECORD_KEY_PREFIX, pendingRecordStorageKey } from '@extension/shared';
import { useEffect, useRef, useState } from 'react';
import type { TabId } from './routes';
import type { AddressKey, SupportedChainId } from '@extension/shared';

type ReadyState = { onboarding: boolean } | { loading: true };

interface FocusRequest {
  key: AddressKey;
  chainId: SupportedChainId;
  nonce: number;
}

const getActiveTabId = async (): Promise<number | null> => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.id ?? null;
  } catch {
    return null;
  }
};

const App = () => {
  const [tab, setTab] = useState<TabId>('current');
  const [focus, setFocus] = useState<FocusRequest | null>(null);
  const [ready, setReady] = useState<ReadyState>({ loading: true });
  const nonceRef = useRef(0);

  const consumePending = async (tabId: number): Promise<void> => {
    const data = await chrome.storage.session.get(pendingRecordStorageKey(tabId));
    const pending = data[pendingRecordStorageKey(tabId)] as { key: AddressKey; chainId: SupportedChainId } | undefined;
    if (pending) {
      nonceRef.current += 1;
      setFocus({ key: pending.key, chainId: pending.chainId, nonce: nonceRef.current });
      setTab('library');
      void chrome.storage.session.remove(pendingRecordStorageKey(tabId));
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const settings = await sendMessage({ type: 'SETTINGS_GET' });
        setReady({ onboarding: !settings.onboardingSeen });
      } catch {
        setReady({ onboarding: false });
      }
      const tabId = await getActiveTabId();
      if (tabId != null) {
        await consumePending(tabId);
      }
    };
    void init();

    // Live: when an annotation is clicked while the side panel is already open,
    // consume the pending record for the active tab immediately.
    const onSessionChanged = async (changes: { [key: string]: chrome.storage.StorageChange }) => {
      const pendingKey = Object.keys(changes).find(key => key.startsWith(PENDING_RECORD_KEY_PREFIX));
      if (!pendingKey || !changes[pendingKey].newValue) {
        return;
      }
      const tabId = await getActiveTabId();
      if (tabId != null) {
        await consumePending(tabId);
      }
    };

    // When the user switches the active tab, consume that tab's pending record.
    const onTabActivated = async () => {
      const tabId = await getActiveTabId();
      if (tabId != null) {
        await consumePending(tabId);
      }
    };

    chrome.storage.session.onChanged.addListener(onSessionChanged);
    chrome.tabs.onActivated.addListener(onTabActivated);
    return () => {
      chrome.storage.session.onChanged.removeListener(onSessionChanged);
      chrome.tabs.onActivated.removeListener(onTabActivated);
    };
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
      <header className="flex items-center gap-2 px-4 pb-2 pt-3">
        <img src={chrome.runtime.getURL('icon-16.png')} alt="" className="h-4 w-4" />
        <h1 className="text-sm font-semibold text-slate-200">TraceMemo</h1>
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
                'flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 ' +
                (selected ? 'bg-violet-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200')
              }>
              {tabDef.label}
            </button>
          );
        })}
      </div>

      <div className="mx-4 mb-1 h-px bg-slate-800" />

      <main className="flex-1 overflow-y-auto px-4 pb-4 pt-2">
        {tab === 'current' && <CurrentPageView />}
        {tab === 'library' && (
          <LibraryView initialEditKey={focus?.key} initialEditChainId={focus?.chainId} focusNonce={focus?.nonce} />
        )}
        {tab === 'settings' && <SettingsView />}
      </main>
    </div>
  );
};

export default App;
