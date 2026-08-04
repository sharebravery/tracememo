import { getAddress, isAddress } from 'viem';
import type { AddressKey, EvmAddress } from './types.js';

/**
 * Address utilities backed by viem.
 *
 * - `isEvmAddress` accepts any valid 0x + 40 hex form (checksummed or lowercase).
 * - `toChecksumAddress` returns the EIP-55 checksummed form for display.
 * - `toAddressKey` returns the canonical lowercase key used for storage lookup.
 * The key never includes the chain or site: the same EVM address can appear on
 * multiple supported chains.
 */
export const isEvmAddress = (value: unknown): value is EvmAddress =>
  typeof value === 'string' && isAddress(value, { strict: false });

export const toChecksumAddress = (address: string): EvmAddress => getAddress(address) as EvmAddress;

export const toAddressKey = (address: string): AddressKey => `evm:${address.toLowerCase()}` as AddressKey;
