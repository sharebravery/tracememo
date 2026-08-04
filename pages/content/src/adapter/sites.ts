import type { SiteId } from '@extension/shared';

/**
 * Supported explorer site registry. One Etherscan-family adapter serves every
 * site here; BaseScan is added in Milestone 4.
 */
export interface ExplorerSite {
  id: SiteId;
  hostname: string;
}

export const SITES: readonly ExplorerSite[] = [
  { id: 'etherscan', hostname: 'etherscan.io' },
  { id: 'basescan', hostname: 'basescan.org' },
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
