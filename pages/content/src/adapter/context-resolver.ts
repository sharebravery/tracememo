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
 * pages. Never guesses the chain from page content.
 */
export const resolveNetworkContext = (hostname: string): NetworkContext | null => {
  for (const site of SITES) {
    if (hostname === site.hostname || hostname.endsWith(`.${site.hostname}`)) {
      return { chainId: site.chainId, site: site.id };
    }
  }
  return null;
};

export const detectSite = (hostname: string): ExplorerSite | null => {
  const ctx = resolveNetworkContext(hostname);
  if (!ctx) return null;
  return SITES.find(s => s.id === ctx.site) ?? null;
};
