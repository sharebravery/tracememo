import { detectSite, SITES, resolveNetworkContext } from './context-resolver.js';
import { describe, expect, it } from 'vitest';

describe('site registry', () => {
  it('registers all five supported explorers', () => {
    expect(SITES.map(s => s.id).sort()).toEqual(['arbiscan', 'basescan', 'bscscan', 'etherscan', 'polygonscan']);
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
  });

  it('detects BscScan with chain id 56', () => {
    expect(detectSite('bscscan.com')?.id).toBe('bscscan');
    expect(detectSite('bscscan.com')?.chainId).toBe(56);
  });

  it('detects Arbiscan with chain id 42161', () => {
    expect(detectSite('arbiscan.io')?.id).toBe('arbiscan');
    expect(detectSite('arbiscan.io')?.chainId).toBe(42161);
    expect(detectSite('www.arbiscan.io')?.id).toBe('arbiscan');
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

describe('resolveNetworkContext', () => {
  it('returns NetworkContext for known explorers', () => {
    expect(resolveNetworkContext('etherscan.io')).toEqual({ chainId: 1, site: 'etherscan' });
    expect(resolveNetworkContext('arbiscan.io')).toEqual({ chainId: 42161, site: 'arbiscan' });
  });

  it('returns null for non-explorer pages', () => {
    expect(resolveNetworkContext('example.com')).toBeNull();
    expect(resolveNetworkContext('github.com')).toBeNull();
    expect(resolveNetworkContext('')).toBeNull();
  });

  it('accepts www subdomain', () => {
    expect(resolveNetworkContext('www.etherscan.io')?.chainId).toBe(1);
    expect(resolveNetworkContext('www.arbiscan.io')?.site).toBe('arbiscan');
  });
});
