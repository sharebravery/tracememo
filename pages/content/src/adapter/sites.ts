import { SUPPORTED_CHAINS } from '@extension/shared';
import type { SiteId, SupportedChainId } from '@extension/shared';

/**
 * Supported explorer site registry. Derived from the shared SUPPORTED_CHAINS
 * config - do not hardcode sites here.
 */
export interface ExplorerSite {
  id: SiteId;
  chainId: SupportedChainId;
  hostname: string;
}

export const SITES: readonly ExplorerSite[] = SUPPORTED_CHAINS.map(c => ({
  id: c.siteId,
  chainId: c.id,
  hostname: c.hostname,
}));

/**
 * Match a hostname against the registry, accepting `www.` and other subdomains.
 */
export const detectSite = (hostname: string): ExplorerSite | null => {
  for (const site of SITES) {
    if (hostname === site.hostname || hostname.endsWith(`.${site.hostname}`)) {
      return site;
    }
  }
  return null;
};
