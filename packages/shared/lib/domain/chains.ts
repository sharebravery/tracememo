import type { SiteId, SupportedChainId } from './types.js';

/**
 * Single source of truth for supported chains. Drives the chain-id enum, the
 * site registry, the chain labels, and the maximum number of per-chain
 * contexts on one address record. Do not hardcode the chain count elsewhere.
 */
export interface ChainConfig {
  id: SupportedChainId;
  label: string;
  hostname: string;
  siteId: SiteId;
}

export const SUPPORTED_CHAINS: readonly ChainConfig[] = [
  { id: 1, label: 'Ethereum', hostname: 'etherscan.io', siteId: 'etherscan' },
  { id: 8453, label: 'Base', hostname: 'basescan.org', siteId: 'basescan' },
];

export const SUPPORTED_CHAIN_IDS = SUPPORTED_CHAINS.map(c => c.id) as readonly SupportedChainId[];

export const SUPPORTED_SITE_IDS = SUPPORTED_CHAINS.map(c => c.siteId) as readonly SiteId[];

/** Maximum number of per-chain contexts on one address record. */
export const MAX_CHAIN_CONTEXTS = SUPPORTED_CHAINS.length;

export const CHAIN_LABELS: Record<SupportedChainId, string> = Object.fromEntries(
  SUPPORTED_CHAINS.map(c => [c.id, c.label]),
) as Record<SupportedChainId, string>;

export const chainLabel = (chainId: SupportedChainId): string => CHAIN_LABELS[chainId] ?? `Chain ${chainId}`;
