import { isEvmAddress, toAddressKey, toChecksumAddress } from './address.js';
import { describe, expect, it } from 'vitest';

describe('address utilities', () => {
  describe('isEvmAddress', () => {
    it('accepts a valid lowercase address', () => {
      expect(isEvmAddress('0x' + 'a'.repeat(40))).toBe(true);
    });

    it('accepts a valid checksummed address', () => {
      expect(isEvmAddress('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(true);
    });

    it('rejects an address that is too short', () => {
      expect(isEvmAddress('0x' + 'a'.repeat(38))).toBe(false);
    });

    it('rejects an address that is too long', () => {
      expect(isEvmAddress('0x' + 'a'.repeat(42))).toBe(false);
    });

    it('rejects a value without the 0x prefix', () => {
      expect(isEvmAddress('a'.repeat(40))).toBe(false);
    });

    it('rejects non-hexadecimal characters', () => {
      expect(isEvmAddress('0x' + 'z'.repeat(40))).toBe(false);
    });

    it('rejects non-string values', () => {
      expect(isEvmAddress(undefined)).toBe(false);
      expect(isEvmAddress(123)).toBe(false);
      expect(isEvmAddress(null)).toBe(false);
    });
  });

  describe('toChecksumAddress', () => {
    it('returns the EIP-55 checksummed form', () => {
      // Known EIP-55 test vector.
      expect(toChecksumAddress('0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed')).toBe(
        '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
      );
    });
  });

  describe('toAddressKey', () => {
    it('produces the canonical lowercase key', () => {
      expect(toAddressKey('0x52908400098527886E0F7030069857D03E024880')).toBe(
        'evm:0x52908400098527886e0f7030069857d03e024880',
      );
    });

    it('is stable regardless of input casing', () => {
      const upper = toAddressKey('0x52908400098527886E0F7030069857D03E024880');
      const lower = toAddressKey('0x52908400098527886e0f7030069857d03e024880');
      expect(upper).toBe(lower);
    });

    it('does not include the chain or site', () => {
      const key = toAddressKey('0x' + 'a'.repeat(40));
      expect(key.startsWith('evm:')).toBe(true);
      expect(key).not.toContain('etherscan');
      expect(key).not.toContain('basescan');
    });
  });
});
