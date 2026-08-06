import { extractPrimaryAddressFromPath } from './primary-address.js';
import { describe, expect, it } from 'vitest';

const ADDR = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';

describe('extractPrimaryAddressFromPath', () => {
  it('extracts the address from /address/0x...', () => {
    expect(extractPrimaryAddressFromPath(`/address/${ADDR}`)).toBe(ADDR);
  });

  it('does not extract from /tx/0x... (transaction hash)', () => {
    expect(extractPrimaryAddressFromPath(`/tx/${ADDR}`)).toBeUndefined();
  });

  it('does not extract from /token/0x... ', () => {
    expect(extractPrimaryAddressFromPath(`/token/${ADDR}`)).toBeUndefined();
  });

  it('returns undefined for non-address paths', () => {
    expect(extractPrimaryAddressFromPath('/')).toBeUndefined();
    expect(extractPrimaryAddressFromPath('/blocks')).toBeUndefined();
    expect(extractPrimaryAddressFromPath('')).toBeUndefined();
  });

  it('returns undefined for invalid addresses in /address/', () => {
    expect(extractPrimaryAddressFromPath('/address/0x123')).toBeUndefined();
    expect(extractPrimaryAddressFromPath('/address/notanaddress')).toBeUndefined();
  });

  it('handles trailing slashes and query params', () => {
    expect(extractPrimaryAddressFromPath(`/address/${ADDR}/`)).toBe(ADDR);
  });
});
