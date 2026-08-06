/**
 * chrome.storage.session key helpers shared between the background and
 * extension pages. Session storage is cleared when the browser closes; it
 * never holds research records (those live in IndexedDB).
 */

/** Prefix for per-tab page-context keys: `tracememo-page-context:<tabId>`. */
export const PAGE_CONTEXT_KEY_PREFIX = 'tracememo-page-context:';

export const pageContextStorageKey = (tabId: number): string => `${PAGE_CONTEXT_KEY_PREFIX}${tabId}`;

/** Prefix for per-tab pending-record keys: `tracememo-pending-record:<tabId>`.
 * Set when an annotation is clicked; the side panel for that tab consumes it. */
export const PENDING_RECORD_KEY_PREFIX = 'tracememo-pending-record:';

export const pendingRecordStorageKey = (tabId: number): string => `${PENDING_RECORD_KEY_PREFIX}${tabId}`;
