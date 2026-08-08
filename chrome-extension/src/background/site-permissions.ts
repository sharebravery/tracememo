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

const buildDef = (origin: string): ContentScriptDef => ({
  id: siteScriptId(origin),
  matches: [`${origin}/*`],
  js: [CONTENT_SCRIPT_FILE],
  runAt: 'document_idle',
  persistAcrossSessions: true,
});

/**
 * Register the dynamic content script for `origin` and record it. The host
 * permission must already have been granted by the caller (side panel).
 * Idempotent: safe to call when the script is already registered.
 */
export const enableSite = async (origin: string): Promise<void> => {
  const id = siteScriptId(origin);
  const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [id] });
  if (existing.length === 0) {
    await chrome.scripting.registerContentScripts([buildDef(origin)]);
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
  const id = siteScriptId(origin);
  try {
    await chrome.scripting.unregisterContentScripts({ ids: [id] });
  } catch {
    // Already unregistered - nothing to do.
  }
  try {
    await chrome.permissions.remove({ origins: [`${origin}/*`] });
  } catch {
    // Permission already absent - nothing to do.
  }
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
    const granted = await chrome.permissions.contains({ origins: [`${origin}/*`] });
    if (!granted) {
      try {
        await chrome.scripting.unregisterContentScripts({ ids: [siteScriptId(origin)] });
      } catch {
        // ignore
      }
      continue;
    }
    const id = siteScriptId(origin);
    const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [id] });
    if (existing.length === 0) {
      await chrome.scripting.registerContentScripts([buildDef(origin)]);
    }
    remaining.push(origin);
  }
  if (remaining.length !== sites.length) {
    await writeEnabledSites(remaining);
  }
};

/** Stable, valid dynamic-script id for an origin (alphanumeric + `-`/`_`).
 * Runs of non-alphanumeric characters collapse to a single `-`. */
export const siteScriptId = (origin: string): string => SCRIPT_ID_PREFIX + origin.replace(/[^a-zA-Z0-9]+/g, '-');
