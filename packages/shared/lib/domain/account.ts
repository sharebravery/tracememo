import { getAddress, isAddress } from 'viem';
import type { AccountKey, EvmAddress, SupportedChainId } from './types.js';

const ACCOUNT_KEY_PATTERN = /^eip155:(1|8453):0x[0-9a-f]{40}$/;

/**
 * Account-key utilities backed by viem.
 *
 * The canonical key is `eip155:<chainId>:<lowercase address>`. The chain id is
 * always included because the same EVM address on Ethereum Mainnet (1) and
 * Base (8453) is a distinct research subject and must NOT be auto-merged.
 */
export const isEvmAddress = (value: unknown): value is EvmAddress =>
  typeof value === 'string' && isAddress(value, { strict: false });

export const toChecksumAddress = (address: string): EvmAddress => getAddress(address) as EvmAddress;

export const toAccountKey = (chainId: SupportedChainId, address: string): AccountKey =>
  `eip155:${chainId}:${address.toLowerCase()}` as AccountKey;

export const isAccountKey = (value: unknown): value is AccountKey =>
  typeof value === 'string' && ACCOUNT_KEY_PATTERN.test(value);

/** Extract the chain id from a canonical account key. */
export const accountKeyToChainId = (key: AccountKey): SupportedChainId => Number(key.split(':')[1]) as SupportedChainId;

/** Extract the lowercase 0x address from a canonical account key. */
export const accountKeyToAddress = (key: AccountKey): EvmAddress => key.split(':')[2] as EvmAddress;
