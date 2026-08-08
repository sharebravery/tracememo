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
 * unregister-on-disable, rollback-on-failure, and startup reconciliation.
 */

interface MockScriptDef {
  id: string;
  matches: string[];
  js: string[];
  persistAcrossSessions: boolean;
}

const localStorage = new Map<string, unknown>();
const registeredScripts = new Map<string, MockScriptDef>();
const grantedOrigins = new Set<string>();

// Mutable so a test can force registerContentScripts to fail.
let registerImpl: (scripts: MockScriptDef[]) => Promise<void> = async scripts => {
  for (const s of scripts) {
    if (registeredScripts.has(s.id)) throw new Error('Duplicate content script id');
    registeredScripts.set(s.id, s);
  }
};

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
    registerContentScripts: async (scripts: MockScriptDef[]) => registerImpl(scripts),
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

describe('siteScriptId (collision-resistant)', () => {
  it('produces a stable, valid id (prefix + 16 hex chars)', async () => {
    const id = await siteScriptId(ORIGIN);
    expect(id).toMatch(/^tracememo-site-[0-9a-f]{16}$/);
    expect(await siteScriptId(ORIGIN)).toBe(id); // deterministic
  });

  it('maps distinct origins to distinct ids, including look-alikes that used to collide', async () => {
    // With the old `replace(/[^a-z0-9]+/g, '-')` scheme all four collapsed to
    // the same id. SHA-256 must keep them distinct.
    const ids = new Set([
      await siteScriptId('https://app.aave.com'),
      await siteScriptId('https://app-aave.com'),
      await siteScriptId('https://app_aave.com'),
      await siteScriptId('http://app.aave.com'),
    ]);
    expect(ids.size).toBe(4);
  });

  it('never collides for a different hostname', async () => {
    expect(await siteScriptId('https://aave.com')).not.toBe(await siteScriptId('https://aave.com.evil.com'));
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
    const id = await siteScriptId(ORIGIN);
    const def = registeredScripts.get(id);
    expect(def).toBeDefined();
    expect(def?.matches).toEqual(['https://app.aave.com/*']);
    expect(def?.js).toEqual(['content/all.iife.js']);
    expect(def?.persistAcrossSessions).toBe(true);
    expect(await listEnabledSites()).toEqual([ORIGIN]);
  });

  it('is idempotent - calling twice does not throw or duplicate', async () => {
    await enableSite(ORIGIN);
    await expect(enableSite(ORIGIN)).resolves.toBeUndefined();
    expect(registeredScripts.size).toBe(1);
    expect(await listEnabledSites()).toEqual([ORIGIN]);
  });

  it('rolls back the granted permission and stores nothing if registration fails', async () => {
    // Caller (side panel) already granted the host permission.
    grantedOrigins.add('https://app.aave.com/*');
    const original = registerImpl;
    registerImpl = async () => {
      throw new Error('registration failed');
    };
    try {
      await expect(enableSite(ORIGIN)).rejects.toThrow('registration failed');
    } finally {
      registerImpl = original;
    }
    // Permission released (not orphaned).
    expect(grantedOrigins.has('https://app.aave.com/*')).toBe(false);
    // Origin not recorded.
    expect(await listEnabledSites()).toEqual([]);
    // Nothing registered.
    expect(registeredScripts.size).toBe(0);
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
    expect(registeredScripts.has(await siteScriptId(ORIGIN))).toBe(false);
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
    const id = await siteScriptId(ORIGIN);
    registeredScripts.set(id, {
      id,
      matches: ['https://app.aave.com/*'],
      js: ['content/all.iife.js'],
      persistAcrossSessions: true,
    });

    await reconcileSitePermissions();
    expect(registeredScripts.has(await siteScriptId(ORIGIN))).toBe(false);
    expect(await listEnabledSites()).toEqual([]);
  });

  it('re-registers a stored origin whose script is missing but permission is present', async () => {
    grantedOrigins.add('https://app.aave.com/*');
    await mockChrome.storage.local.set({ 'tracememo-enabled-sites': [ORIGIN] });
    expect(registeredScripts.has(await siteScriptId(ORIGIN))).toBe(false);

    await reconcileSitePermissions();
    expect(registeredScripts.has(await siteScriptId(ORIGIN))).toBe(true);
    expect(await listEnabledSites()).toEqual([ORIGIN]);
  });

  it('leaves a healthy origin untouched', async () => {
    grantedOrigins.add('https://app.aave.com/*');
    await enableSite(ORIGIN);
    const before = registeredScripts.get(await siteScriptId(ORIGIN));
    await reconcileSitePermissions();
    expect(registeredScripts.get(await siteScriptId(ORIGIN))).toEqual(before);
    expect(await listEnabledSites()).toEqual([ORIGIN]);
  });
});
