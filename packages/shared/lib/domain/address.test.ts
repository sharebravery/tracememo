import { addressKeyToAddress, isAddressKey, isEvmAddress, toAddressKey, toChecksumAddress } from './address.js';
import { describe, expect, it } from 'vitest';

const ADDR = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
const ADDR_LOWER = '0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed';

describe('isEvmAddress', () => {
  it('accepts valid addresses and rejects malformed ones', () => {
    expect(isEvmAddress('0x' + 'a'.repeat(40))).toBe(true);
    expect(isEvmAddress(ADDR)).toBe(true);
    expect(isEvmAddress('0x' + 'a'.repeat(38))).toBe(false);
    expect(isEvmAddress('0x' + 'z'.repeat(40))).toBe(false);
    expect(isEvmAddress(undefined)).toBe(false);
  });
});

describe('toChecksumAddress', () => {
  it('returns the EIP-55 checksummed form', () => {
    expect(toChecksumAddress(ADDR_LOWER)).toBe(ADDR);
  });
});

describe('toAddressKey', () => {
  it('produces the global address key without a chain id', () => {
    expect(toAddressKey(ADDR)).toBe(`evm:${ADDR_LOWER}`);
  });

  it('is stable regardless of input casing', () => {
    expect(toAddressKey(ADDR)).toBe(toAddressKey(ADDR_LOWER));
  });

  it('is the same key regardless of chain (one global record per address)', () => {
    // The key intentionally does NOT include a chain id.
    expect(toAddressKey(ADDR)).not.toContain(':1:');
    expect(toAddressKey(ADDR)).not.toContain(':8453:');
  });
});

describe('isAddressKey', () => {
  it('accepts the global address key', () => {
    expect(isAddressKey(`evm:${ADDR_LOWER}`)).toBe(true);
  });

  it('rejects chain-aware or malformed keys', () => {
    expect(isAddressKey(`eip155:1:${ADDR_LOWER}`)).toBe(false);
    expect(isAddressKey(`evm:${ADDR}`)).toBe(false); // uppercase hex
    expect(isAddressKey('not-a-key')).toBe(false);
  });
});

describe('addressKeyToAddress', () => {
  it('extracts the lowercase address', () => {
    expect(addressKeyToAddress(`evm:${ADDR_LOWER}`)).toBe(ADDR_LOWER);
  });
});
