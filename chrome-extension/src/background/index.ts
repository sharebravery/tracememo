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
    // setPanelBehavior is unavailable in older Chromium; the side panel can
    // still be opened via chrome.sidePanel.open as a fallback.
  }
};

const routerDeps = {
  repo: createRecordsRepository(getDatabase()),
  settings: settingsStorage,
};

const isSupportedExplorerUrl = (url: string | undefined): boolean =>
  Boolean(url && (url.startsWith('https://etherscan.io/') || url.startsWith('https://basescan.org/')));

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // OPEN_RECORD must call chrome.sidePanel.open synchronously, in the same
  // tick as the user gesture, otherwise Chrome rejects it. Only honor it from
  // a content script on a supported explorer page.
  if (message?.type === 'OPEN_RECORD' && sender.tab?.id != null && isSupportedExplorerUrl(sender.tab.url)) {
    chrome.sidePanel?.open?.({ tabId: sender.tab.id }).catch(() => {
      // No fresh user gesture; the pending key still lets the side panel focus
      // the record when the user opens it via the toolbar.
    });
  }

  // Validate + authorize + dispatch, then respond asynchronously. Returning
  // `true` keeps the message channel open until the promise resolves.
  handleMessage(message, routerDeps, sender).then(sendResponse);
  return true;
});

// Drop page-context session state for tabs that close, so it cannot leak to a
// reused tab id. chrome.tabs.onRemoved does not require the `tabs` permission.
chrome.tabs.onRemoved.addListener(tabId => {
  void chrome.storage.session.remove(pageContextStorageKey(tabId));
});

void configureSidePanel();

console.log('[TraceMemo] background service worker started');
