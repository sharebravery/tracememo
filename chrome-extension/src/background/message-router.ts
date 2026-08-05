import {
  ErrorCode,
  requestMessageSchema,
  toAddressKey,
  toChecksumAddress,
  pageContextStorageKey,
  PENDING_RECORD_STORAGE_KEY,
} from '@extension/shared';
import type { RecordsRepository } from '@extension/research-db';
import type {
  AddressRecord,
  ChainContext,
  PageContext,
  PageContextInput,
  RecordCreateInput,
  RecordUpdateInput,
  RequestMessage,
  ResponseMessage,
  ResearchSource,
  Settings,
} from '@extension/shared';
import type { SettingsStorageType } from '@extension/storage';

/**
 * Background message router with sender authorization.
 *
 * This is the ONLY boundary that performs record CRUD, settings writes, and
 * page-context storage. Every message is schema-validated AND authorized:
 * content scripts may only set page context, query matching records, and
 * request opening a record; the side panel may perform CRUD, import/export,
 * clear, settings, and read page context. See docs/02-TECHNICAL-ARCHITECTURE.md
 * message-security section.
 *
 * Logging rule (section 12): production logs may contain only error code,
 * operation name, etc. - never address, label, note, or source content.
 */
const CONTENT_ALLOWED = new Set<RequestMessage['type']>(['PAGE_CONTEXT_SET', 'RECORDS_GET_MANY', 'OPEN_RECORD']);

const SIDE_PANEL_ALLOWED = new Set<RequestMessage['type']>([
  'RECORD_LIST',
  'RECORD_GET',
  'RECORD_CREATE',
  'RECORD_UPDATE',
  'RECORD_DELETE',
  'DATA_EXPORT',
  'DATA_IMPORT',
  'DATA_IMPORT_PREVIEW',
  'DATA_CLEAR',
  'SETTINGS_GET',
  'SETTINGS_UPDATE',
  'PAGE_CONTEXT_GET',
  'RECORDS_GET_MANY',
]);

const isSupportedExplorerUrl = (url: string | undefined): boolean =>
  Boolean(url && (url.startsWith('https://etherscan.io/') || url.startsWith('https://basescan.org/')));

const isContentSender = (sender: chrome.runtime.MessageSender): boolean =>
  sender.id === chrome.runtime.id && sender.tab?.id != null && isSupportedExplorerUrl(sender.tab.url);

const isSidePanelSender = (sender: chrome.runtime.MessageSender): boolean => {
  if (sender.id !== chrome.runtime.id) return false;
  const prefix = chrome.runtime.getURL('side-panel/');
  return typeof sender.url === 'string' && sender.url.startsWith(prefix);
};

const authorize = (type: RequestMessage['type'], sender: chrome.runtime.MessageSender): boolean => {
  if (isContentSender(sender)) return CONTENT_ALLOWED.has(type);
  if (isSidePanelSender(sender)) return SIDE_PANEL_ALLOWED.has(type);
  return false;
};

const logFailure = (operation: string, code: string): void => {
  console.error(`[TraceMemo] ${operation} failed`, { code });
};

const buildSources = (inputs: { url: string; title: string }[], now: string): ResearchSource[] =>
  inputs.map(input => ({
    id: crypto.randomUUID(),
    url: input.url,
    title: input.title,
    createdAt: now,
  }));

/** Error thrown for expected, user-facing failures (mapped to a response). */
class RouterError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'RouterError';
    this.code = code;
  }
}

const createRecord = async (input: RecordCreateInput, repo: RecordsRepository): Promise<AddressRecord> => {
  const now = new Date().toISOString();
  const record: AddressRecord = {
    key: toAddressKey(input.address),
    address: toChecksumAddress(input.address),
    label: input.label,
    tags: input.tags,
    note: input.note,
    chains: [
      {
        chainId: input.chainId,
        note: input.chainNote,
        confidence: input.confidence,
        sources: buildSources(input.sources, now),
        createdAt: now,
        updatedAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
  return repo.upsert(record);
};

const updateRecord = async (input: RecordUpdateInput, repo: RecordsRepository): Promise<AddressRecord> => {
  const existing = await repo.get(input.key);
  if (!existing) {
    throw new RouterError(ErrorCode.NOT_FOUND, 'Record not found');
  }
  const now = new Date().toISOString();
  const existingChainIndex = existing.chains.findIndex(c => c.chainId === input.chainId);
  const existingChain = existingChainIndex >= 0 ? existing.chains[existingChainIndex] : undefined;
  const upsertedChain: ChainContext = {
    chainId: input.chainId,
    note: input.chainNote,
    confidence: input.confidence,
    sources: buildSources(input.sources, now),
    createdAt: existingChain?.createdAt ?? now,
    updatedAt: now,
  };
  const chains =
    existingChainIndex >= 0
      ? existing.chains.map((c, i) => (i === existingChainIndex ? upsertedChain : c))
      : [...existing.chains, upsertedChain];

  const record: AddressRecord = {
    ...existing,
    label: input.label,
    tags: input.tags,
    note: input.note,
    chains,
    updatedAt: now,
  };
  return repo.upsert(record);
};

const setPageContext = async (context: PageContext): Promise<void> => {
  await chrome.storage.session.set({ [pageContextStorageKey(context.tabId)]: context });
};

const getPageContext = async (tabId: number): Promise<PageContext | null> => {
  const data = await chrome.storage.session.get(pageContextStorageKey(tabId));
  return (data[pageContextStorageKey(tabId)] as PageContext | undefined) ?? null;
};

const updateSettings = async (patch: Partial<Settings>, settings: SettingsStorageType): Promise<Settings> => {
  await settings.set(prev => ({ ...prev, ...patch }));
  return settings.get();
};

export interface RouterDeps {
  repo: RecordsRepository;
  settings: SettingsStorageType;
}

export const handleMessage = async (
  raw: unknown,
  deps: RouterDeps,
  sender: chrome.runtime.MessageSender,
): Promise<ResponseMessage<unknown>> => {
  const parsed = requestMessageSchema.safeParse(raw);
  if (!parsed.success) {
    logFailure('message-validation', ErrorCode.INVALID_MESSAGE);
    return { ok: false, error: { code: ErrorCode.INVALID_MESSAGE, message: 'Invalid request message' } };
  }

  const message = parsed.data as RequestMessage;

  if (!authorize(message.type, sender)) {
    logFailure(message.type, ErrorCode.FORBIDDEN);
    return { ok: false, error: { code: ErrorCode.FORBIDDEN, message: 'Sender not authorized for this request' } };
  }

  try {
    switch (message.type) {
      case 'RECORD_LIST':
        return { ok: true, data: await deps.repo.list() };

      case 'RECORD_GET':
        return { ok: true, data: (await deps.repo.get(message.payload.key)) ?? null };

      case 'RECORDS_GET_MANY':
        return { ok: true, data: await deps.repo.getMany(message.payload.keys) };

      case 'RECORD_CREATE':
        return { ok: true, data: await createRecord(message.payload, deps.repo) };

      case 'RECORD_UPDATE':
        return { ok: true, data: await updateRecord(message.payload, deps.repo) };

      case 'RECORD_DELETE':
        await deps.repo.remove(message.payload.key);
        return { ok: true, data: { deleted: true as const } };

      case 'DATA_EXPORT':
        return { ok: true, data: await deps.repo.exportAll() };

      case 'DATA_IMPORT':
        return { ok: true, data: await deps.repo.importAll(message.payload.data) };

      case 'DATA_IMPORT_PREVIEW':
        return { ok: true, data: await deps.repo.previewImport(message.payload.data) };

      case 'DATA_CLEAR':
        await deps.repo.clear();
        return { ok: true, data: { cleared: true as const } };

      case 'SETTINGS_GET':
        return { ok: true, data: await deps.settings.get() };

      case 'SETTINGS_UPDATE':
        return { ok: true, data: await updateSettings(message.payload, deps.settings) };

      case 'PAGE_CONTEXT_SET': {
        const tabId = sender.tab?.id;
        if (tabId == null) {
          logFailure('PAGE_CONTEXT_SET', ErrorCode.FORBIDDEN);
          return { ok: false, error: { code: ErrorCode.FORBIDDEN, message: 'No tab context' } };
        }
        const context: PageContext = { ...(message.payload as PageContextInput), tabId };
        await setPageContext(context);
        return { ok: true, data: { acknowledged: true as const } };
      }

      case 'PAGE_CONTEXT_GET':
        return { ok: true, data: await getPageContext(message.payload.tabId) };

      case 'OPEN_RECORD':
        await chrome.storage.session.set({
          [PENDING_RECORD_STORAGE_KEY]: { key: message.payload.key, chainId: message.payload.chainId },
        });
        return { ok: true, data: { acknowledged: true as const } };

      default: {
        const exhaustive: never = message;
        logFailure(String(exhaustive), ErrorCode.NOT_IMPLEMENTED);
        return { ok: false, error: { code: ErrorCode.NOT_IMPLEMENTED, message: 'Unknown request type' } };
      }
    }
  } catch (error) {
    if (error instanceof RouterError) {
      logFailure(message.type, error.code);
      return { ok: false, error: { code: error.code, message: error.message } };
    }
    logFailure(message.type, ErrorCode.INTERNAL_ERROR);
    return { ok: false, error: { code: ErrorCode.INTERNAL_ERROR, message: 'Internal error' } };
  }
};
