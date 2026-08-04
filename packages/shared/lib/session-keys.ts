/**
 * chrome.storage.session key helpers shared between the background and
 * extension pages. Session storage is cleared when the browser closes; it
 * never holds research records (those live in IndexedDB).
 */

/** Prefix for per-tab page-context keys: `tracememo-page-context:<tabId>`. */
export const PAGE_CONTEXT_KEY_PREFIX = 'tracememo-page-context:';

export const pageContextStorageKey = (tabId: number): string => `${PAGE_CONTEXT_KEY_PREFIX}${tabId}`;

/** Key under which a pending record key is stored (annotation click -> side panel). */
export const PENDING_RECORD_STORAGE_KEY = 'tracememo-pending-record';
