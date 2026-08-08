import {
  disableSite,
  enableSite,
  listEnabledSites,
  reconcileSitePermissions,
  siteScriptId,
} from './site-permissions.js';
import { beforeEach, describe, expect, it } from 'vitest';

/**
 * site-permissions dynamic content-script registration.
 *
 * Mocks chrome.scripting / chrome.permissions / chrome.storage.local to verify
 * the always-scan lifecycle: register-on-enable (idempotent, persists),
 * unregister-on-disable, and startup reconciliation that fixes drift.
 */

const localStorage = new Map<string, unknown>();
const registeredScripts = new Map<string, { id: string; matches: string[]; js: string[] }>();
const grantedOrigins = new Set<string>();

const mockChrome = {
  storage: {
    local: {
      get: async (key: string) => ({ [key]: localStorage.get(key) }),
      set: async (items: Record<string, unknown>) => {
        for (const [k, v] of Object.entries(items)) localStorage.set(k, v);
      },
    },
  },
  scripting: {
    getRegisteredContentScripts: async ({ ids }: { ids: string[] }) =>
      ids.filter(id => registeredScripts.has(id)).map(id => registeredScripts.get(id)!),
    registerContentScripts: async (scripts: { id: string; matches: string[]; js: string[] }[]) => {
      for (const s of scripts) {
        if (registeredScripts.has(s.id)) throw new Error('Duplicate content script id');
        registeredScripts.set(s.id, s);
      }
    },
    unregisterContentScripts: async ({ ids }: { ids: string[] }) => {
      for (const id of ids) registeredScripts.delete(id);
    },
  },
  permissions: {
    contains: async ({ origins }: { origins: string[] }) => origins.every(o => grantedOrigins.has(o)),
    remove: async ({ origins }: { origins: string[] }) => {
      for (const o of origins) grantedOrigins.delete(o);
    },
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).chrome = mockChrome;

const ORIGIN = 'https://app.aave.com';

describe('siteScriptId', () => {
  it('produces a stable, valid dynamic-script id', () => {
    expect(siteScriptId(ORIGIN)).toBe('tracememo-site-https-app-aave-com');
  });
});

describe('enableSite', () => {
  beforeEach(() => {
    localStorage.clear();
    registeredScripts.clear();
    grantedOrigins.clear();
  });

  it('registers a dynamic content script scoped to the origin and records it', async () => {
    await enableSite(ORIGIN);
    const id = siteScriptId(ORIGIN);
    const def = registeredScripts.get(id);
    expect(def).toBeDefined();
    expect(def?.matches).toEqual(['https://app.aave.com/*']);
    expect(def?.js).toEqual(['content/all.iife.js']);
    expect(await listEnabledSites()).toEqual([ORIGIN]);
  });

  it('is idempotent - calling twice does not throw or duplicate', async () => {
    await enableSite(ORIGIN);
    await expect(enableSite(ORIGIN)).resolves.toBeUndefined();
    expect(registeredScripts.size).toBe(1);
    expect(await listEnabledSites()).toEqual([ORIGIN]);
  });
});

describe('disableSite', () => {
  beforeEach(() => {
    localStorage.clear();
    registeredScripts.clear();
    grantedOrigins.clear();
  });

  it('unregisters the script, releases the permission, and removes the origin', async () => {
    grantedOrigins.add('https://app.aave.com/*');
    await enableSite(ORIGIN);
    expect(registeredScripts.size).toBe(1);

    await disableSite(ORIGIN);
    expect(registeredScripts.has(siteScriptId(ORIGIN))).toBe(false);
    expect(grantedOrigins.has('https://app.aave.com/*')).toBe(false);
    expect(await listEnabledSites()).toEqual([]);
  });

  it('is safe to call when already disabled', async () => {
    await expect(disableSite(ORIGIN)).resolves.toBeUndefined();
    expect(await listEnabledSites()).toEqual([]);
  });
});

describe('reconcileSitePermissions', () => {
  beforeEach(() => {
    localStorage.clear();
    registeredScripts.clear();
    grantedOrigins.clear();
  });

  it('drops an origin whose host permission was revoked externally', async () => {
    // Stored but permission revoked (not in grantedOrigins).
    await mockChrome.storage.local.set({ 'tracememo-enabled-sites': [ORIGIN] });
    registeredScripts.set(siteScriptId(ORIGIN), {
      id: siteScriptId(ORIGIN),
      matches: ['https://app.aave.com/*'],
      js: ['content/all.iife.js'],
    });

    await reconcileSitePermissions();
    expect(registeredScripts.has(siteScriptId(ORIGIN))).toBe(false);
    expect(await listEnabledSites()).toEqual([]);
  });

  it('re-registers a stored origin whose script is missing but permission is present', async () => {
    grantedOrigins.add('https://app.aave.com/*');
    await mockChrome.storage.local.set({ 'tracememo-enabled-sites': [ORIGIN] });
    // Script missing (e.g. cleared by an extension update).
    expect(registeredScripts.has(siteScriptId(ORIGIN))).toBe(false);

    await reconcileSitePermissions();
    expect(registeredScripts.has(siteScriptId(ORIGIN))).toBe(true);
    expect(await listEnabledSites()).toEqual([ORIGIN]);
  });

  it('leaves a healthy origin untouched', async () => {
    grantedOrigins.add('https://app.aave.com/*');
    await enableSite(ORIGIN);
    const before = registeredScripts.get(siteScriptId(ORIGIN));
    await reconcileSitePermissions();
    expect(registeredScripts.get(siteScriptId(ORIGIN))).toEqual(before);
    expect(await listEnabledSites()).toEqual([ORIGIN]);
  });
});
