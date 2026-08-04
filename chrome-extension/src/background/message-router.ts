import {
  ErrorCode,
  PAGE_CONTEXT_STORAGE_KEY,
  PENDING_RECORD_STORAGE_KEY,
  requestMessageSchema,
  toAddressKey,
  toChecksumAddress,
} from '@extension/shared';
import type { RecordsRepository } from '@extension/research-db';
import type {
  AddressKey,
  AddressRecord,
  PageContext,
  RequestMessage,
  ResponseMessage,
  Settings,
} from '@extension/shared';
import type { SettingsStorageType } from '@extension/storage';

/**
 * Background message router.
 *
 * This is the ONLY boundary that performs record CRUD and settings writes.
 * The side panel and content script send `RequestMessage`s; the router
 * validates each with Zod, dispatches to the repository, and returns a
 * `ResponseMessage`. See docs/02-TECHNICAL-ARCHITECTURE.md section 3.1 and 8.
 *
 * Logging rule (section 12): production logs may contain only error code,
 * operation name, etc. - never address, label, note, or source content.
 */
const logFailure = (operation: string, code: string): void => {
  console.error(`[TraceMemo] ${operation} failed`, { code });
};

const upsertRecord = async (
  message: Extract<RequestMessage, { type: 'RECORD_UPSERT' }>,
  repo: RecordsRepository,
): Promise<AddressRecord> => {
  const input = message.payload;
  const now = new Date().toISOString();
  const address = toChecksumAddress(input.address);
  const key = toAddressKey(input.address);
  const existing = await repo.get(key);

  const record: AddressRecord = {
    key,
    address,
    label: input.label,
    note: input.note,
    confidence: input.confidence,
    sources: input.sources,
    createdAt: existing?.createdAt ?? input.createdAt ?? now,
    updatedAt: now,
  };

  return repo.upsert(record);
};

const updateSettings = async (patch: Partial<Settings>, settings: SettingsStorageType): Promise<Settings> => {
  await settings.set(prev => ({ ...prev, ...patch }));
  return settings.get();
};

const setPageContext = async (context: PageContext): Promise<void> => {
  await chrome.storage.session.set({ [PAGE_CONTEXT_STORAGE_KEY]: context });
};

const getPageContext = async (): Promise<PageContext | null> => {
  const data = await chrome.storage.session.get(PAGE_CONTEXT_STORAGE_KEY);
  return (data[PAGE_CONTEXT_STORAGE_KEY] as PageContext | undefined) ?? null;
};

const setPendingRecordKey = async (key: AddressKey): Promise<void> => {
  await chrome.storage.session.set({ [PENDING_RECORD_STORAGE_KEY]: key });
};

export interface RouterDeps {
  repo: RecordsRepository;
  settings: SettingsStorageType;
}

export const handleMessage = async (raw: unknown, deps: RouterDeps): Promise<ResponseMessage<unknown>> => {
  const parsed = requestMessageSchema.safeParse(raw);
  if (!parsed.success) {
    logFailure('message-validation', ErrorCode.INVALID_MESSAGE);
    return { ok: false, error: { code: ErrorCode.INVALID_MESSAGE, message: 'Invalid request message' } };
  }

  const message = parsed.data as RequestMessage;

  try {
    switch (message.type) {
      case 'RECORD_LIST':
        return { ok: true, data: await deps.repo.list() };

      case 'RECORD_GET':
        return { ok: true, data: (await deps.repo.get(message.payload.key)) ?? null };

      case 'RECORDS_GET_MANY':
        return { ok: true, data: await deps.repo.getMany(message.payload.keys) };

      case 'RECORD_UPSERT':
        return { ok: true, data: await upsertRecord(message, deps.repo) };

      case 'RECORD_DELETE':
        await deps.repo.remove(message.payload.key);
        return { ok: true, data: { deleted: true as const } };

      case 'DATA_EXPORT':
        return { ok: true, data: await deps.repo.exportAll() };

      case 'DATA_CLEAR':
        await deps.repo.clear();
        return { ok: true, data: { cleared: true as const } };

      case 'SETTINGS_GET':
        return { ok: true, data: await deps.settings.get() };

      case 'SETTINGS_UPDATE':
        return { ok: true, data: await updateSettings(message.payload, deps.settings) };

      case 'PAGE_CONTEXT_SET':
        await setPageContext(message.payload);
        return { ok: true, data: { acknowledged: true as const } };

      case 'PAGE_CONTEXT_GET':
        return { ok: true, data: await getPageContext() };

      case 'OPEN_RECORD':
        await setPendingRecordKey(message.payload.key);
        return { ok: true, data: { acknowledged: true as const } };

      case 'DATA_IMPORT':
        return { ok: true, data: await deps.repo.importAll(message.payload) };

      default: {
        const exhaustive: never = message;
        logFailure(String(exhaustive), ErrorCode.NOT_IMPLEMENTED);
        return { ok: false, error: { code: ErrorCode.NOT_IMPLEMENTED, message: 'Unknown request type' } };
      }
    }
  } catch {
    logFailure(message.type, ErrorCode.INTERNAL_ERROR);
    return { ok: false, error: { code: ErrorCode.INTERNAL_ERROR, message: 'Internal error' } };
  }
};
