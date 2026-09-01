import { SUPPORTED_CHAINS } from '@extension/shared';
import type { SiteId, SupportedChainId, NetworkContext } from '@extension/shared';

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
 * Resolve network context from the page URL. Returns null for non-explorer
 * pages (generic pages carry a global record only). Never guesses the chain
 * from page content. Derived entirely from `SUPPORTED_CHAINS`.
 */
export const resolveNetworkContext = (hostname: string): NetworkContext | null => {
  for (const site of SITES) {
    if (hostname === site.hostname || hostname.endsWith(`.${site.hostname}`)) {
      return { chainId: site.chainId, site: site.id };
    }
  }
  return null;
};
