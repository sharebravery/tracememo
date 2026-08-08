import { resolveNetworkContext, SITES } from './context-resolver.js';
import { describe, expect, it } from 'vitest';

describe('Network Context Resolver', () => {
  it('registers all five supported explorers', () => {
    expect(SITES).toHaveLength(5);
    expect(SITES.map(s => s.id).sort()).toEqual(['arbiscan', 'basescan', 'bscscan', 'etherscan', 'polygonscan']);
  });

  it('resolves Ethereum from etherscan.io', () => {
    expect(resolveNetworkContext('etherscan.io')).toEqual({ chainId: 1, site: 'etherscan' });
    expect(resolveNetworkContext('www.etherscan.io')).toEqual({ chainId: 1, site: 'etherscan' });
  });

  it('resolves Arbitrum from arbiscan.io', () => {
    expect(resolveNetworkContext('arbiscan.io')).toEqual({ chainId: 42161, site: 'arbiscan' });
  });

  it('resolves all five chains', () => {
    expect(resolveNetworkContext('etherscan.io')?.chainId).toBe(1);
    expect(resolveNetworkContext('basescan.org')?.chainId).toBe(8453);
    expect(resolveNetworkContext('polygonscan.com')?.chainId).toBe(137);
    expect(resolveNetworkContext('bscscan.com')?.chainId).toBe(56);
    expect(resolveNetworkContext('arbiscan.io')?.chainId).toBe(42161);
  });

  it('returns null for non-explorer pages', () => {
    expect(resolveNetworkContext('example.com')).toBeNull();
    expect(resolveNetworkContext('github.com')).toBeNull();
    expect(resolveNetworkContext('')).toBeNull();
    expect(resolveNetworkContext('notetherscan.io')).toBeNull();
    expect(resolveNetworkContext('etherscan.io.evil.com')).toBeNull();
  });
});
