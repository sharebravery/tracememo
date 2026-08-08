import type { SiteId, SupportedChainId } from './types.js';

/**
 * Single source of truth for supported chains. Drives the chain-id enum, the
 * site registry, the chain labels, the explorer brand labels, the manifest
 * host lists, and the maximum number of per-chain contexts on one address
 * record. Do not hardcode the chain count, hostnames, or labels elsewhere.
 */
export interface ChainConfig {
  id: SupportedChainId;
  label: string;
  /** Explorer brand for the context bar, e.g. "Etherscan". */
  brand: string;
  hostname: string;
  siteId: SiteId;
}

export const SUPPORTED_CHAINS: readonly ChainConfig[] = [
  { id: 1, label: 'Ethereum', brand: 'Etherscan', hostname: 'etherscan.io', siteId: 'etherscan' },
  { id: 8453, label: 'Base', brand: 'BaseScan', hostname: 'basescan.org', siteId: 'basescan' },
  { id: 137, label: 'Polygon', brand: 'PolygonScan', hostname: 'polygonscan.com', siteId: 'polygonscan' },
  { id: 56, label: 'BNB Smart Chain', brand: 'BscScan', hostname: 'bscscan.com', siteId: 'bscscan' },
  { id: 42161, label: 'Arbitrum', brand: 'Arbiscan', hostname: 'arbiscan.io', siteId: 'arbiscan' },
];

export const SUPPORTED_CHAIN_IDS = SUPPORTED_CHAINS.map(c => c.id) as readonly SupportedChainId[];

export const SUPPORTED_SITE_IDS = SUPPORTED_CHAINS.map(c => c.siteId) as readonly SiteId[];

/** Maximum number of per-chain contexts on one address record. */
export const MAX_CHAIN_CONTEXTS = SUPPORTED_CHAINS.length;

export const CHAIN_LABELS: Record<SupportedChainId, string> = Object.fromEntries(
  SUPPORTED_CHAINS.map(c => [c.id, c.label]),
) as Record<SupportedChainId, string>;

/** Explorer brand by site id, e.g. etherscan -> "Etherscan". */
export const EXPLORER_BRANDS: Record<SiteId, string> = Object.fromEntries(
  SUPPORTED_CHAINS.map(c => [c.siteId, c.brand]),
) as Record<SiteId, string>;

export const chainLabel = (chainId: SupportedChainId): string => CHAIN_LABELS[chainId] ?? `Chain ${chainId}`;
