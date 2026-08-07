import { detectSite, SITES } from './sites.js';
import { describe, expect, it } from 'vitest';

describe('site registry', () => {
  it('registers all four supported explorers', () => {
    expect(SITES.map(s => s.id).sort()).toEqual(['basescan', 'bscscan', 'etherscan', 'polygonscan']);
  });

  it('detects Etherscan with chain id 1', () => {
    expect(detectSite('etherscan.io')?.id).toBe('etherscan');
    expect(detectSite('etherscan.io')?.chainId).toBe(1);
    expect(detectSite('www.etherscan.io')?.id).toBe('etherscan');
  });

  it('detects BaseScan with chain id 8453', () => {
    expect(detectSite('basescan.org')?.id).toBe('basescan');
    expect(detectSite('basescan.org')?.chainId).toBe(8453);
  });

  it('detects PolygonScan with chain id 137', () => {
    expect(detectSite('polygonscan.com')?.id).toBe('polygonscan');
    expect(detectSite('polygonscan.com')?.chainId).toBe(137);
    expect(detectSite('www.polygonscan.com')?.id).toBe('polygonscan');
  });

  it('detects BscScan with chain id 56', () => {
    expect(detectSite('bscscan.com')?.id).toBe('bscscan');
    expect(detectSite('bscscan.com')?.chainId).toBe(56);
    expect(detectSite('www.bscscan.com')?.id).toBe('bscscan');
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
