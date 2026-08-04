import { detectSite, SITES } from './sites.js';
import { describe, expect, it } from 'vitest';

describe('site registry', () => {
  it('registers Etherscan and BaseScan', () => {
    expect(SITES.map(s => s.id).sort()).toEqual(['basescan', 'etherscan']);
  });

  it('detects Etherscan (bare and www)', () => {
    expect(detectSite('etherscan.io')?.id).toBe('etherscan');
    expect(detectSite('www.etherscan.io')?.id).toBe('etherscan');
  });

  it('detects BaseScan (bare and www)', () => {
    expect(detectSite('basescan.org')?.id).toBe('basescan');
    expect(detectSite('www.basescan.org')?.id).toBe('basescan');
  });

  it('returns null for unsupported hosts', () => {
    expect(detectSite('example.com')).toBeNull();
    expect(detectSite('etherscan.com')).toBeNull();
    expect(detectSite('')).toBeNull();
  });

  it('does not match look-alike hosts', () => {
    expect(detectSite('notetherscan.io')).toBeNull();
    expect(detectSite('etherscan.io.evil.com')).toBeNull();
  });
});
