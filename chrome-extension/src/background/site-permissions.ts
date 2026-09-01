/**
 * Always-scan site management.
 *
 * "Always scan this site" dynamically registers a content script (via
 * `chrome.scripting.registerContentScripts`) scoped to the user-approved
 * origin, so TraceMemo auto-scans that site on every visit - including after a
 * Chrome restart - without a toolbar click. MV3 dynamic content scripts
 * persist across sessions by default, so no service-worker action is needed on
 * each visit.
 *
 * The host permission itself is requested from the side panel (where the user
 * gesture lives); this module only registers/unregisters the script and tracks
 * the enabled-origin list. `reconcileSitePermissions` runs on service-worker
 * startup to fix drift (permission revoked externally, or script lost after an
 * extension update).
 *
 * TraceMemo never requests a standing `<all_urls>` host permission - only the
 * specific origins the user enables.
 */

const ENABLED_SITES_KEY = 'tracememo-enabled-sites';
const CONTENT_SCRIPT_FILE = 'content/all.iife.js';
const SCRIPT_ID_PREFIX = 'tracememo-site-';
/** Truncated SHA-256 length (hex chars). 16 chars = 64 bits; collision-safe for
 * any realistic number of enabled sites. */
const ID_HASH_LENGTH = 16;

interface ContentScriptDef {
  id: string;
  matches: string[];
  js: string[];
  runAt: 'document_idle';
  persistAcrossSessions: boolean;
}

const readEnabledSites = async (): Promise<string[]> => {
  const data = await chrome.storage.local.get(ENABLED_SITES_KEY);
  return (data[ENABLED_SITES_KEY] as string[] | undefined) ?? [];
};

const writeEnabledSites = async (sites: string[]): Promise<void> => {
  await chrome.storage.local.set({ [ENABLED_SITES_KEY]: sites });
};

const matchPattern = (origin: string): string => `${origin}/*`;

const buildDef = (origin: string, id: string): ContentScriptDef => ({
  id,
  matches: [matchPattern(origin)],
  js: [CONTENT_SCRIPT_FILE],
  runAt: 'document_idle',
  persistAcrossSessions: true,
});

const releasePermission = async (origin: string): Promise<void> => {
  try {
    await chrome.permissions.remove({ origins: [matchPattern(origin)] });
  } catch {
    // Permission already absent - nothing to do.
  }
};

/**
 * Register the dynamic content script for `origin` and record it. The host
 * permission must already have been granted by the caller (side panel).
 * Idempotent: safe to call when the script is already registered. If
 * registration fails, the just-granted host permission is released so nothing
 * is left orphaned, and the error is rethrown so the caller can revert UI.
 */
export const enableSite = async (origin: string): Promise<void> => {
  const id = await siteScriptId(origin);
  const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [id] });
  if (existing.length === 0) {
    try {
      await chrome.scripting.registerContentScripts([buildDef(origin, id)]);
    } catch (e) {
      await releasePermission(origin);
      throw e;
    }
  }
  const sites = new Set(await readEnabledSites());
  sites.add(origin);
  await writeEnabledSites([...sites]);
};

/**
 * Unregister the dynamic content script, release the host permission, and
 * remove the origin from the enabled list. Safe to call when already disabled.
 */
export const disableSite = async (origin: string): Promise<void> => {
  const id = await siteScriptId(origin);
  try {
    await chrome.scripting.unregisterContentScripts({ ids: [id] });
  } catch {
    // Already unregistered - nothing to do.
  }
  await releasePermission(origin);
  const sites = new Set(await readEnabledSites());
  sites.delete(origin);
  await writeEnabledSites([...sites]);
};

export const listEnabledSites = async (): Promise<string[]> => readEnabledSites();

/**
 * Fix drift between stored origins, granted permissions, and registered
 * scripts. Run on service-worker startup and on install/update.
 *
 * - An origin whose permission was revoked externally is dropped (script
 *   unregistered + removed from storage).
 * - An origin that still has permission but whose script is missing (e.g. after
 *   an extension update clears dynamic scripts) is re-registered.
 */
export const reconcileSitePermissions = async (): Promise<void> => {
  const sites = await readEnabledSites();
  const remaining: string[] = [];
  for (const origin of sites) {
    const granted = await chrome.permissions.contains({ origins: [matchPattern(origin)] });
    if (!granted) {
      try {
        await chrome.scripting.unregisterContentScripts({ ids: [await siteScriptId(origin)] });
      } catch {
        // ignore
      }
      continue;
    }
    const id = await siteScriptId(origin);
    const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [id] });
    if (existing.length === 0) {
      await chrome.scripting.registerContentScripts([buildDef(origin, id)]);
    }
    remaining.push(origin);
  }
  if (remaining.length !== sites.length) {
    await writeEnabledSites(remaining);
  }
};

/**
 * Stable, deterministic, collision-resistant dynamic-script id for an origin.
 * Uses a truncated SHA-256 of the origin so that distinct origins (even
 * look-alikes that differ only by `.` vs `-` vs `_`) map to distinct ids -
 * unlike a naive `replace(/[^a-z0-9]+/g, '-')` which can collide. The result
 * is `tracememo-site-<16 hex chars>`, all within the `[a-zA-Z0-9_-]` charset
 * Chrome requires for script ids.
 */
export const siteScriptId = async (origin: string): Promise<string> => {
  const bytes = new TextEncoder().encode(origin);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  return SCRIPT_ID_PREFIX + hex.slice(0, ID_HASH_LENGTH);
};
