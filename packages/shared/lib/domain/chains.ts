import type { SupportedChainId } from './types.js';

/** Human-readable chain names for UI display. */
export const CHAIN_LABELS: Record<SupportedChainId, string> = {
  1: 'Ethereum',
  8453: 'Base',
};

export const chainLabel = (chainId: SupportedChainId): string => CHAIN_LABELS[chainId] ?? `Chain ${chainId}`;
