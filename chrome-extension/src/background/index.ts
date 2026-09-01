import 'webextension-polyfill';
import { handleMessage } from './message-router';
import { reconcileSitePermissions } from './site-permissions';
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Open the side panel on annotation click from any content script - explorer
  // pages (static content script), generic pages (activeTab/scripting), and
  // always-scan sites (dynamically registered script) alike.
  if (message?.type === 'OPEN_RECORD' && sender.id === chrome.runtime.id && sender.tab?.id != null) {
    chrome.sidePanel?.open?.({ tabId: sender.tab.id }).catch(() => {});
  }
  handleMessage(message, routerDeps, sender).then(sendResponse);
  return true;
});

chrome.tabs.onRemoved.addListener(tabId => {
  void chrome.storage.session.remove(pageContextStorageKey(tabId));
});

// Reconcile always-scan dynamic scripts: fix drift on startup and after
// install/update (permissions revoked externally or scripts cleared).
chrome.runtime.onInstalled.addListener(() => {
  void reconcileSitePermissions();
});

void reconcileSitePermissions();
void configureSidePanel();
console.log('[TraceMemo] background service worker started');
