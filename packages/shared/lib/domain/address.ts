import { getAddress, isAddress } from 'viem';
import type { AddressKey, EvmAddress } from './types.js';

const ADDRESS_KEY_PATTERN = /^evm:0x[0-9a-f]{40}$/;

/**
 * Address-key utilities backed by viem.
 *
 * The canonical global key is `evm:<lowercase address>` - one record per
 * address, shared across chains. The chain id is NOT part of the key; it lives
 * in each chain context. The same address on Ethereum Mainnet (1) and Base
 * (8453) shares the global record but not the per-chain context.
 */
export const isEvmAddress = (value: unknown): value is EvmAddress =>
  typeof value === 'string' && isAddress(value, { strict: false });

export const toChecksumAddress = (address: string): EvmAddress => getAddress(address) as EvmAddress;

export const toAddressKey = (address: string): AddressKey => `evm:${address.toLowerCase()}` as AddressKey;

export const isAddressKey = (value: unknown): value is AddressKey =>
  typeof value === 'string' && ADDRESS_KEY_PATTERN.test(value);

/** Extract the lowercase 0x address from a canonical global address key. */
export const addressKeyToAddress = (key: AddressKey): EvmAddress => key.split(':')[1] as EvmAddress;
