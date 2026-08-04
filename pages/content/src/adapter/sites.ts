import type { SiteId, SupportedChainId } from '@extension/shared';

/**
 * Supported explorer site registry. One Etherscan-family adapter serves every
 * site here. Each site maps to exactly one chain id; the same 0x address on
 * different chains is a distinct research subject.
 */
export interface ExplorerSite {
  id: SiteId;
  chainId: SupportedChainId;
  hostname: string;
}

export const SITES: readonly ExplorerSite[] = [
  { id: 'etherscan', chainId: 1, hostname: 'etherscan.io' },
  { id: 'basescan', chainId: 8453, hostname: 'basescan.org' },
];

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
