import type {
  AccountKey,
  AddressRecord,
  ImportPreview,
  ImportResult,
  PageContext,
  PageContextInput,
  RecordCreateInput,
  RecordUpdateInput,
  Settings,
  TraceMemoExport,
} from '../domain/index.js';

/**
 * Cross-context message protocol.
 *
 * The side panel and content script send `RequestMessage`s; the background
 * service worker is the only context that performs record CRUD. The background
 * also enforces a sender authorization matrix (see docs/02-TECHNICAL-
 * ARCHITECTURE.md message-security section) on top of the Zod validation.
 */
export type RequestMessage =
  | { type: 'PAGE_CONTEXT_SET'; payload: PageContextInput }
  | { type: 'PAGE_CONTEXT_GET'; payload: { tabId: number } }
  | { type: 'RECORDS_GET_MANY'; payload: { keys: AccountKey[] } }
  | { type: 'RECORD_LIST' }
  | { type: 'RECORD_GET'; payload: { key: AccountKey } }
  | { type: 'RECORD_CREATE'; payload: RecordCreateInput }
  | { type: 'RECORD_UPDATE'; payload: RecordUpdateInput }
  | { type: 'RECORD_DELETE'; payload: { key: AccountKey } }
  | { type: 'DATA_EXPORT' }
  | { type: 'DATA_IMPORT'; payload: { data: TraceMemoExport } }
  | { type: 'DATA_IMPORT_PREVIEW'; payload: { data: TraceMemoExport } }
  | { type: 'DATA_CLEAR' }
  | { type: 'SETTINGS_GET' }
  | { type: 'SETTINGS_UPDATE'; payload: Partial<Settings> }
  | { type: 'OPEN_RECORD'; payload: { key: AccountKey } };

/** Response envelope. Errors never carry stack traces or user record content. */
export type ResponseMessage<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

/** Maps a request type to its success-response data type. */
export interface ResponseMap {
  PAGE_CONTEXT_SET: { acknowledged: true };
  PAGE_CONTEXT_GET: PageContext | null;
  RECORDS_GET_MANY: AddressRecord[];
  RECORD_LIST: AddressRecord[];
  RECORD_GET: AddressRecord | null;
  RECORD_CREATE: AddressRecord;
  RECORD_UPDATE: AddressRecord;
  RECORD_DELETE: { deleted: true };
  DATA_EXPORT: TraceMemoExport;
  DATA_IMPORT: ImportResult;
  DATA_IMPORT_PREVIEW: ImportPreview;
  DATA_CLEAR: { cleared: true };
  SETTINGS_GET: Settings;
  SETTINGS_UPDATE: Settings;
  OPEN_RECORD: { acknowledged: true };
}

/** Standard error codes used by the background. */
export const ErrorCode = {
  INVALID_MESSAGE: 'INVALID_MESSAGE',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  IMPORT_TOO_LARGE: 'IMPORT_TOO_LARGE',
  FORBIDDEN: 'FORBIDDEN',
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];
