/**
 * chrome.storage.session keys shared between the background and extension
 * pages. Session storage is cleared when the browser closes; it never holds
 * research records (those live in IndexedDB).
 */
export const PAGE_CONTEXT_STORAGE_KEY = 'tracememo-page-context';

export const PENDING_RECORD_STORAGE_KEY = 'tracememo-pending-record';
