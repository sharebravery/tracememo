import { handleMessage } from './message-router.js';
import { beforeEach, describe, expect, it } from 'vitest';
import type { RecordsRepository } from '@extension/research-db';
import type { AddressKey, AddressRecord, PageContextInput, ResponseMessage, SupportedChainId } from '@extension/shared';
import type { SettingsStorageType } from '@extension/storage';

/** In-memory chrome.storage.session mock. */
const sessionStore = new Map<string, unknown>();

const mockChrome = {
  runtime: {
    id: 'test-extension-id',
    getURL: (path: string) => `chrome-extension://test-extension-id/${path}`,
  },
  storage: {
    session: {
      set: async (items: Record<string, unknown>) => {
        for (const [key, value] of Object.entries(items)) {
          sessionStore.set(key, value);
        }
      },
      get: async (key: string) => ({ [key]: sessionStore.get(key) }),
      remove: async (key: string) => {
        sessionStore.delete(key);
      },
    },
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).chrome = mockChrome;

const deps = { repo: {} as RecordsRepository, settings: {} as SettingsStorageType };

const contentSender = (tabId: number, url: string): chrome.runtime.MessageSender => ({
  id: 'test-extension-id',
  tab: { id: tabId, url } as chrome.tabs.Tab,
  url,
});

const sidePanelSender = (): chrome.runtime.MessageSender => ({
  id: 'test-extension-id',
  url: 'chrome-extension://test-extension-id/side-panel/index.html',
});

const pageContext = (overrides: Partial<PageContextInput> = {}): PageContextInput => ({
  tabUrl: 'https://etherscan.io/address/0xabc',
  pageTitle: 'Etherscan',
  site: 'etherscan',
  chainId: 1,
  addressKeys: [('evm:0x' + 'a'.repeat(40)) as AddressKey],
  observedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const data = async <T>(response: ResponseMessage<T>): Promise<T | undefined> =>
  response.ok ? response.data : undefined;

describe('per-tab page context isolation', () => {
  beforeEach(() => {
    sessionStore.clear();
  });

  it('stores context per tab and does not bleed across two simultaneously open pages', async () => {
    const ctx1 = pageContext({
      tabUrl: 'https://etherscan.io/address/0xa',
      pageTitle: 'A',
      site: 'etherscan',
      chainId: 1,
    });
    const ctx2 = pageContext({
      tabUrl: 'https://basescan.org/address/0xb',
      pageTitle: 'B',
      site: 'basescan',
      chainId: 8453,
      addressKeys: [('evm:0x' + 'b'.repeat(40)) as AddressKey],
    });

    await handleMessage(
      { type: 'PAGE_CONTEXT_SET', payload: ctx1 },
      deps,
      contentSender(1, 'https://etherscan.io/address/0xa'),
    );
    await handleMessage(
      { type: 'PAGE_CONTEXT_SET', payload: ctx2 },
      deps,
      contentSender(2, 'https://basescan.org/address/0xb'),
    );

    const res1 = await handleMessage({ type: 'PAGE_CONTEXT_GET', payload: { tabId: 1 } }, deps, sidePanelSender());
    const res2 = await handleMessage({ type: 'PAGE_CONTEXT_GET', payload: { tabId: 2 } }, deps, sidePanelSender());

    expect(await data(res1)).toMatchObject({ tabUrl: 'https://etherscan.io/address/0xa', tabId: 1 });
    expect(await data(res2)).toMatchObject({ tabUrl: 'https://basescan.org/address/0xb', tabId: 2 });
  });

  it('ignores any client-provided tab id and uses sender.tab.id', async () => {
    await handleMessage(
      { type: 'PAGE_CONTEXT_SET', payload: pageContext() },
      deps,
      contentSender(5, 'https://etherscan.io/address/0xabc'),
    );

    // Asking for a different tab must not return tab 5's context.
    const resWrong = await handleMessage(
      { type: 'PAGE_CONTEXT_GET', payload: { tabId: 999 } },
      deps,
      sidePanelSender(),
    );
    expect(await data(resWrong)).toBeNull();

    const resRight = await handleMessage({ type: 'PAGE_CONTEXT_GET', payload: { tabId: 5 } }, deps, sidePanelSender());
    expect(await data(resRight)).toMatchObject({ tabId: 5 });
  });
});

describe('message sender authorization', () => {
  it('forbids DATA_CLEAR from a content script', async () => {
    const res = await handleMessage({ type: 'DATA_CLEAR' }, deps, contentSender(1, 'https://etherscan.io/x'));
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe('FORBIDDEN');
    }
  });

  it('forbids DATA_IMPORT from a content script', async () => {
    const res = await handleMessage(
      {
        type: 'DATA_IMPORT',
        payload: { data: { format: 'tracememo', version: 2, exportedAt: '2026-01-01T00:00:00.000Z', records: [] } },
      },
      deps,
      contentSender(1, 'https://etherscan.io/x'),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe('FORBIDDEN');
    }
  });

  it('forbids PAGE_CONTEXT_SET from the side panel', async () => {
    const res = await handleMessage({ type: 'PAGE_CONTEXT_SET', payload: pageContext() }, deps, sidePanelSender());
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe('FORBIDDEN');
    }
  });

  it('forbids content scripts on unsupported pages', async () => {
    const res = await handleMessage(
      { type: 'PAGE_CONTEXT_SET', payload: pageContext() },
      deps,
      contentSender(1, 'https://example.com/x'),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe('FORBIDDEN');
    }
  });

  it('forbids senders from a different extension id', async () => {
    const res = await handleMessage({ type: 'PAGE_CONTEXT_SET', payload: pageContext() }, deps, {
      id: 'other-extension',
      tab: { id: 1, url: 'https://etherscan.io/x' },
    } as chrome.runtime.MessageSender);
    expect(res.ok).toBe(false);
  });
});

describe('OPEN_RECORD pending per tab', () => {
  beforeEach(() => {
    sessionStore.clear();
  });

  it('stores pending under a per-tab key and isolates concurrent tabs', async () => {
    const KEY = ('evm:0x' + 'a'.repeat(40)) as AddressKey;
    await handleMessage(
      { type: 'OPEN_RECORD', payload: { key: KEY, chainId: 1 as SupportedChainId } },
      deps,
      contentSender(1, 'https://etherscan.io/x'),
    );
    await handleMessage(
      { type: 'OPEN_RECORD', payload: { key: KEY, chainId: 8453 as SupportedChainId } },
      deps,
      contentSender(2, 'https://basescan.org/x'),
    );
    expect(sessionStore.get('tracememo-pending-record:1')).toMatchObject({ key: KEY, chainId: 1 });
    expect(sessionStore.get('tracememo-pending-record:2')).toMatchObject({ key: KEY, chainId: 8453 });
  });
});

describe('RECORD_CREATE does not overwrite', () => {
  const KEY = ('evm:0x' + 'a'.repeat(40)) as AddressKey;
  const ADDR = '0x' + 'Aa'.repeat(20);
  const validCreate = {
    address: ADDR,
    chainId: 1,
    label: 'L',
    tags: [],
    note: '',
    chainNote: '',
    confidence: 'unverified' as const,
    sources: [],
  };

  it('returns ALREADY_EXISTS when the address already has a record', async () => {
    const existing = { key: KEY } as AddressRecord;
    const mockRepo = {
      get: async () => existing,
      create: async () => {
        throw new Error('KeyAlreadyExists');
      },
    } as unknown as RecordsRepository;
    const res = await handleMessage(
      { type: 'RECORD_CREATE', payload: validCreate },
      { repo: mockRepo, settings: {} as SettingsStorageType },
      sidePanelSender(),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe('ALREADY_EXISTS');
    }
  });

  it('creates when no existing record', async () => {
    const mockRepo = {
      get: async () => undefined,
      create: async (record: AddressRecord) => record,
    } as unknown as RecordsRepository;
    const res = await handleMessage(
      { type: 'RECORD_CREATE', payload: validCreate },
      { repo: mockRepo, settings: {} as SettingsStorageType },
      sidePanelSender(),
    );
    expect(res.ok).toBe(true);
  });
});
