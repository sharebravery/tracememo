import {
  accountKeyToAddress,
  accountKeyToChainId,
  isAccountKey,
  isEvmAddress,
  toAccountKey,
  toChecksumAddress,
} from './account.js';
import { describe, expect, it } from 'vitest';

const ADDR = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
const ADDR_LOWER = '0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed';

describe('isEvmAddress', () => {
  it('accepts a valid lowercase address', () => {
    expect(isEvmAddress('0x' + 'a'.repeat(40))).toBe(true);
  });

  it('accepts a valid checksummed address', () => {
    expect(isEvmAddress('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(true);
  });

  it('rejects an address that is too short or too long', () => {
    expect(isEvmAddress('0x' + 'a'.repeat(38))).toBe(false);
    expect(isEvmAddress('0x' + 'a'.repeat(42))).toBe(false);
  });

  it('rejects non-hex characters and non-strings', () => {
    expect(isEvmAddress('0x' + 'z'.repeat(40))).toBe(false);
    expect(isEvmAddress(undefined)).toBe(false);
  });
});

describe('toChecksumAddress', () => {
  it('returns the EIP-55 checksummed form', () => {
    expect(toChecksumAddress(ADDR_LOWER)).toBe(ADDR);
  });
});

describe('toAccountKey', () => {
  it('produces the chain-aware canonical key', () => {
    expect(toAccountKey(1, ADDR)).toBe(`eip155:1:${ADDR_LOWER}`);
    expect(toAccountKey(8453, ADDR)).toBe(`eip155:8453:${ADDR_LOWER}`);
  });

  it('is stable regardless of input casing', () => {
    expect(toAccountKey(1, ADDR)).toBe(toAccountKey(1, ADDR_LOWER));
  });

  it('differs across chains for the same address', () => {
    expect(toAccountKey(1, ADDR)).not.toBe(toAccountKey(8453, ADDR));
  });
});

describe('isAccountKey', () => {
  it('accepts canonical keys for chain 1 and 8453', () => {
    expect(isAccountKey(`eip155:1:${ADDR_LOWER}`)).toBe(true);
    expect(isAccountKey(`eip155:8453:${ADDR_LOWER}`)).toBe(true);
  });

  it('rejects unsupported chain ids', () => {
    expect(isAccountKey(`eip155:137:${ADDR_LOWER}`)).toBe(false);
    expect(isAccountKey(`evm:${ADDR_LOWER}`)).toBe(false);
  });

  it('rejects uppercase hex in the address portion', () => {
    expect(isAccountKey(`eip155:1:${ADDR}`)).toBe(false);
  });
});

describe('accountKeyToAddress / accountKeyToChainId', () => {
  const key = toAccountKey(8453, ADDR);
  it('extracts the lowercase address', () => {
    expect(accountKeyToAddress(key)).toBe(ADDR_LOWER);
  });
  it('extracts the chain id', () => {
    expect(accountKeyToChainId(key)).toBe(8453);
  });
});
