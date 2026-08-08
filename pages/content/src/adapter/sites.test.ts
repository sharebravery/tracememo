import { resolveNetworkContext, SITES } from './context-resolver.js';
import { describe, expect, it } from 'vitest';

describe('site registry', () => {
  it('registers all five supported explorers, derived from SUPPORTED_CHAINS', () => {
    expect(SITES.map(s => s.id).sort()).toEqual(['arbiscan', 'basescan', 'bscscan', 'etherscan', 'polygonscan']);
  });
});

describe('resolveNetworkContext', () => {
  it('returns NetworkContext for known explorers', () => {
    expect(resolveNetworkContext('etherscan.io')).toEqual({ chainId: 1, site: 'etherscan' });
    expect(resolveNetworkContext('arbiscan.io')).toEqual({ chainId: 42161, site: 'arbiscan' });
  });

  it('detects each explorer with its chain id', () => {
    expect(resolveNetworkContext('etherscan.io')?.chainId).toBe(1);
    expect(resolveNetworkContext('basescan.org')?.chainId).toBe(8453);
    expect(resolveNetworkContext('polygonscan.com')?.chainId).toBe(137);
    expect(resolveNetworkContext('bscscan.com')?.chainId).toBe(56);
    expect(resolveNetworkContext('arbiscan.io')?.chainId).toBe(42161);
  });

  it('accepts www subdomain', () => {
    expect(resolveNetworkContext('www.etherscan.io')?.chainId).toBe(1);
    expect(resolveNetworkContext('www.arbiscan.io')?.site).toBe('arbiscan');
  });

  it('returns null for non-explorer pages', () => {
    expect(resolveNetworkContext('example.com')).toBeNull();
    expect(resolveNetworkContext('github.com')).toBeNull();
    expect(resolveNetworkContext('')).toBeNull();
  });

  it('does not match look-alike hosts', () => {
    expect(resolveNetworkContext('notetherscan.io')).toBeNull();
    expect(resolveNetworkContext('etherscan.io.evil.com')).toBeNull();
    expect(resolveNetworkContext('etherscan.com')).toBeNull();
  });
});
