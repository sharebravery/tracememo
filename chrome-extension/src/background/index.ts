import 'webextension-polyfill';
import { handleMessage } from './message-router';
import { createRecordsRepository, getDatabase } from '@extension/research-db';
import { pageContextStorageKey } from '@extension/shared';
import { settingsStorage } from '@extension/storage';

/**
 * Open the side panel when the toolbar icon is clicked. Idempotent and safe to
 * repeat on each service-worker startup.
 */
const configureSidePanel = async () => {
  try {
    if (chrome.sidePanel?.setPanelBehavior) {
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    }
  } catch {
    // setPanelBehavior is unavailable in older Chromium.
  }
};

const routerDeps = {
  repo: createRecordsRepository(getDatabase()),
  settings: settingsStorage,
};

const isSupportedExplorerUrl = (url: string | undefined): boolean =>
  Boolean(url && (url.startsWith('https://etherscan.io/') || url.startsWith('https://basescan.org/')));

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'OPEN_RECORD' && sender.tab?.id != null && isSupportedExplorerUrl(sender.tab.url)) {
    chrome.sidePanel?.open?.({ tabId: sender.tab.id }).catch(() => {});
  }
  handleMessage(message, routerDeps, sender).then(sendResponse);
  return true;
});

chrome.tabs.onRemoved.addListener(tabId => {
  void chrome.storage.session.remove(pageContextStorageKey(tabId));
});

void configureSidePanel();
console.log('[TraceMemo] background service worker started');
