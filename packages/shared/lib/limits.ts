/**
 * Field and payload limits enforced at the validation boundary.
 *
 * Shared between Zod schemas (background validation) and the UI (client-side
 * guards). See docs/02-TECHNICAL-ARCHITECTURE.md section 6.3 and the message
 * security matrix.
 */
export const LABEL_MAX = 60;
export const NOTE_MAX = 2000;
export const SOURCE_MAX_PER_RECORD = 50;
export const SOURCE_URL_MAX = 2048;
export const SOURCE_TITLE_MAX = 300;
export const PAGE_TITLE_MAX = 300;
export const PAGE_URL_MAX = 2048;
export const ACCOUNT_KEYS_MAX = 500;
export const IMPORT_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
