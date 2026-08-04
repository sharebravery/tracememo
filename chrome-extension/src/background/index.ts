import 'webextension-polyfill';
import { handleMessage } from './message-router';
import { createRecordsRepository, getDatabase } from '@extension/research-db';
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // OPEN_RECORD must call chrome.sidePanel.open synchronously, in the same
  // tick as the user gesture, otherwise Chrome rejects it. The pending key is
  // stored by the router so the side panel can focus the record once open.
  if (message?.type === 'OPEN_RECORD' && sender.tab?.id != null && chrome.sidePanel?.open) {
    chrome.sidePanel.open({ tabId: sender.tab.id }).catch(() => {
      // No fresh user gesture; the pending key still lets the side panel focus
      // the record when the user opens it via the toolbar.
    });
  }

  // Validate + dispatch, then respond asynchronously. Returning `true` keeps
  // the message channel open until the promise resolves.
  handleMessage(message, routerDeps).then(sendResponse);
  return true;
});

void configureSidePanel();

console.log('[TraceMemo] background service worker started');
