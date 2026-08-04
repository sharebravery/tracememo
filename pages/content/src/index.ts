import { detectSite } from './adapter/sites.js';
import { removeAnnotations } from './annotation/remove-labels.js';
import { renderAnnotations } from './annotation/render-label.js';
import { scanAddresses } from './detection/scan-addresses.js';
import { sendMessage } from './messaging.js';
import { toAccountKey } from '@extension/shared';
import { DEFAULT_SETTINGS_STATE, SETTINGS_STORAGE_KEY } from '@extension/storage';
import type { ExplorerSite } from './adapter/sites.js';
import type { AccountKey, AddressRecord, PageContextInput, SupportedChainId } from '@extension/shared';

const DEBOUNCE_MS = 300;
const MAX_ADAPTER_ERRORS = 5;
const DATA_ATTR = 'data-tracememo';
const OBSERVER_OPTIONS: MutationObserverInit = { childList: true, subtree: true, characterData: true };

let site: ExplorerSite | null = null;
let chainId: SupportedChainId = 1;
let recordMap = new Map<AccountKey, AddressRecord>();
let observer: MutationObserver | undefined;
let rescanTimer: ReturnType<typeof setTimeout> | undefined;
let adapterErrors = 0;
let running = false;
let annotationsEnabled = DEFAULT_SETTINGS_STATE.annotationsEnabled;

const buildPageContext = (accountKeys: AccountKey[]): PageContextInput => ({
  tabUrl: location.href.slice(0, 2048),
  pageTitle: document.title.slice(0, 300),
  site: (site as ExplorerSite).id,
  chainId,
  accountKeys,
  observedAt: new Date().toISOString(),
});

const syncRecords = async (accountKeys: AccountKey[]): Promise<void> => {
  if (accountKeys.length === 0) {
    recordMap = new Map();
    return;
  }
  const records = await sendMessage({ type: 'RECORDS_GET_MANY', payload: { keys: accountKeys } });
  recordMap = new Map(records.map(record => [record.key, record]));
};

const render = (): void => {
  if (!observer || !annotationsEnabled) return;
  observer.disconnect();
  try {
    renderAnnotations(document.body, {
      chainId,
      hasRecord: key => recordMap.get(key),
      onOpen: key => {
        void sendMessage({ type: 'OPEN_RECORD', payload: { key } }).catch(() => {
          // Opening the side panel may fail without a fresh user gesture; the
          // pending key is still stored by the background as a fallback.
        });
      },
    });
    adapterErrors = 0;
  } catch {
    adapterErrors += 1;
    console.error('[TraceMemo] annotation render failed', { code: 'ANNOTATION_ERROR' });
  }

  if (adapterErrors >= MAX_ADAPTER_ERRORS) {
    console.error('[TraceMemo] adapter stopped after repeated errors', { code: 'ADAPTER_HALTED' });
    return;
  }
  observer.observe(document.body, OBSERVER_OPTIONS);
};

const rescan = async (): Promise<void> => {
  if (running || !annotationsEnabled) return;
  running = true;
  try {
    const addresses = scanAddresses(document.body);
    const accountKeys = addresses.map(address => toAccountKey(chainId, address));
    await sendMessage({ type: 'PAGE_CONTEXT_SET', payload: buildPageContext(accountKeys) });
    await syncRecords(accountKeys);
    render();
  } catch {
    adapterErrors += 1;
    console.error('[TraceMemo] scan failed', { code: 'SCAN_ERROR' });
  } finally {
    running = false;
  }
};

const scheduleRescan = (): void => {
  if (!annotationsEnabled) return;
  if (rescanTimer) {
    clearTimeout(rescanTimer);
  }
  rescanTimer = setTimeout(() => {
    void rescan();
  }, DEBOUNCE_MS);
};

const setAnnotationsEnabled = (enabled: boolean): void => {
  if (enabled === annotationsEnabled) return;
  annotationsEnabled = enabled;
  if (!enabled) {
    if (rescanTimer) clearTimeout(rescanTimer);
    observer?.disconnect();
    removeAnnotations(document.body);
    return;
  }
  observer?.observe(document.body, OBSERVER_OPTIONS);
  void rescan();
};

const refreshAnnotationsEnabled = async (): Promise<void> => {
  try {
    const data = await chrome.storage.local.get(SETTINGS_STORAGE_KEY);
    annotationsEnabled = data[SETTINGS_STORAGE_KEY]?.annotationsEnabled ?? DEFAULT_SETTINGS_STATE.annotationsEnabled;
  } catch {
    annotationsEnabled = DEFAULT_SETTINGS_STATE.annotationsEnabled;
  }
};

const onStorageChanged = (changes: { [key: string]: chrome.storage.StorageChange }, area: string): void => {
  if (area !== 'local' || !changes[SETTINGS_STORAGE_KEY]) return;
  const next = changes[SETTINGS_STORAGE_KEY].newValue;
  setAnnotationsEnabled(next?.annotationsEnabled ?? DEFAULT_SETTINGS_STATE.annotationsEnabled);
};

/**
 * Entry point. Detects the site (and chain id), scans once, renders
 * chain-aware annotations, and starts a debounced MutationObserver for dynamic
 * content. Annotations honor the `annotationsEnabled` setting and are removed
 * immediately when disabled. Fails safely: repeated adapter errors halt the
 * observer without breaking page controls.
 */
export const startContentScript = (): void => {
  site = detectSite(location.hostname);
  if (!site) return;
  chainId = site.chainId;

  document.documentElement.setAttribute(DATA_ATTR, 'host');

  observer = new MutationObserver(() => scheduleRescan());
  chrome.storage.onChanged.addListener(onStorageChanged);

  void (async () => {
    await refreshAnnotationsEnabled();
    if (annotationsEnabled) {
      void rescan();
    }
  })();

  window.addEventListener('beforeunload', () => {
    observer?.disconnect();
    chrome.storage.onChanged.removeListener(onStorageChanged);
    if (rescanTimer) clearTimeout(rescanTimer);
  });
};
