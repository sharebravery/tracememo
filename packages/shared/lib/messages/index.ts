import type {
  AddressKey,
  AddressRecord,
  AddressRecordInput,
  ImportResult,
  PageContext,
  Settings,
  TraceMemoExport,
} from '../domain/index.js';

/**
 * Cross-context message protocol.
 *
 * The side panel and content script send `RequestMessage`s; the background
 * service worker is the only context that performs record CRUD. See
 * docs/02-TECHNICAL-ARCHITECTURE.md section 8.
 */
export type RequestMessage =
  | { type: 'PAGE_CONTEXT_SET'; payload: PageContext }
  | { type: 'PAGE_CONTEXT_GET' }
  | { type: 'RECORDS_GET_MANY'; payload: { keys: AddressKey[] } }
  | { type: 'RECORD_LIST' }
  | { type: 'RECORD_GET'; payload: { key: AddressKey } }
  | { type: 'RECORD_UPSERT'; payload: AddressRecordInput }
  | { type: 'RECORD_DELETE'; payload: { key: AddressKey } }
  | { type: 'DATA_EXPORT' }
  | { type: 'DATA_IMPORT'; payload: TraceMemoExport }
  | { type: 'DATA_CLEAR' }
  | { type: 'SETTINGS_GET' }
  | { type: 'SETTINGS_UPDATE'; payload: Partial<Settings> }
  | { type: 'OPEN_RECORD'; payload: { key: AddressKey } };

/** Response envelope. Errors never carry stack traces or user record content. */
export type ResponseMessage<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

/** Maps a request type to its success-response data type. */
export interface ResponseMap {
  PAGE_CONTEXT_SET: { acknowledged: true };
  PAGE_CONTEXT_GET: PageContext | null;
  RECORDS_GET_MANY: AddressRecord[];
  RECORD_LIST: AddressRecord[];
  RECORD_GET: AddressRecord | null;
  RECORD_UPSERT: AddressRecord;
  RECORD_DELETE: { deleted: true };
  DATA_EXPORT: TraceMemoExport;
  DATA_IMPORT: ImportResult;
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
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];
