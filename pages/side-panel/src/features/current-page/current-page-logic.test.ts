import { describe, expect, it } from 'vitest';
import type { AddressKey, AddressRecord, EvmAddress, SupportedChainId } from '@extension/shared';

// Mirror the DetectedAccount interface from CurrentPageView for testing.
interface DetectedAccount {
  key: AddressKey;
  address: EvmAddress;
  chainId: SupportedChainId;
  record?: AddressRecord;
  isPrimary: boolean;
}

const a = (hex: string): EvmAddress => `0x${hex}` as EvmAddress;
const k = (hex: string): AddressKey => `evm:0x${hex}` as AddressKey;

const makeAccount = (hex: string, overrides: Partial<DetectedAccount> = {}): DetectedAccount => ({
  key: k(hex),
  address: a(hex),
  chainId: 1,
  isPrimary: false,
  ...overrides,
});

const makeRecord = (overrides: Partial<AddressRecord> = {}): AddressRecord => ({
  key: k('a'.repeat(40)),
  address: a('Aa'.repeat(20)),
  label: 'Test',
  tags: [],
  note: '',
  chains: [
    {
      chainId: 1,
      note: '',
      confidence: 'unverified',
      sources: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

// The sort logic from CurrentPageView.
const sortAccounts = (accounts: DetectedAccount[]): DetectedAccount[] =>
  [...accounts].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    const aSaved = a.record ? 0 : 1;
    const bSaved = b.record ? 0 : 1;
    if (aSaved !== bSaved) return aSaved - bSaved;
    return 0;
  });

// The search filter logic from CurrentPageView.
const filterAccounts = (accounts: DetectedAccount[], query: string): DetectedAccount[] => {
  const q = query.trim().toLowerCase();
  if (!q) return accounts;
  return accounts.filter(
    d => d.address.toLowerCase().includes(q) || (d.record?.label.toLowerCase().includes(q) ?? false),
  );
};

const PAGE_SIZE = 20;

describe('Current Page logic', () => {
  const primary = makeAccount('a'.repeat(40), { isPrimary: true });
  const saved = makeAccount('b'.repeat(40), {
    record: makeRecord({ key: k('b'.repeat(40)), address: a('Bb'.repeat(20)), label: 'Saved Wallet' }),
  });
  const unsaved = makeAccount('c'.repeat(40));
  const all = [unsaved, saved, primary]; // intentionally unsorted

  describe('sorting', () => {
    it('puts the primary address first', () => {
      const sorted = sortAccounts(all);
      expect(sorted[0].isPrimary).toBe(true);
    });

    it('puts saved addresses before unsaved', () => {
      const sorted = sortAccounts(all);
      expect(sorted[0].isPrimary).toBe(true);
      expect(sorted[1].record).toBeDefined();
      expect(sorted[2].record).toBeUndefined();
    });

    it('handles no primary address', () => {
      const noPrimary = [unsaved, saved];
      const sorted = sortAccounts(noPrimary);
      expect(sorted[0].record).toBeDefined();
      expect(sorted[1].record).toBeUndefined();
    });

    it('handles all unsaved', () => {
      const allUnsaved = [makeAccount('1'.repeat(40)), makeAccount('2'.repeat(40)), makeAccount('3'.repeat(40))];
      const sorted = sortAccounts(allUnsaved);
      expect(sorted.every(a => !a.record)).toBe(true);
    });
  });

  describe('search', () => {
    it('returns all when query is empty', () => {
      expect(filterAccounts(all, '')).toHaveLength(3);
    });

    it('filters by address', () => {
      const result = filterAccounts(all, 'aaa');
      expect(result).toHaveLength(1);
      expect(result[0].isPrimary).toBe(true);
    });

    it('filters by label (case-insensitive)', () => {
      const result = filterAccounts(all, 'SAVED');
      expect(result).toHaveLength(1);
      expect(result[0].record?.label).toBe('Saved Wallet');
    });

    it('returns empty when nothing matches', () => {
      expect(filterAccounts(all, 'nonexistent')).toHaveLength(0);
    });
  });

  describe('pagination', () => {
    it('shows PAGE_SIZE items by default', () => {
      const many = Array.from({ length: 50 }, (_, i) => makeAccount(i.toString(16).padStart(40, '0')));
      const visible = many.slice(0, PAGE_SIZE);
      expect(visible).toHaveLength(20);
    });

    it('Show more increases visible count by PAGE_SIZE', () => {
      const many = Array.from({ length: 50 }, (_, i) => makeAccount(i.toString(16).padStart(40, '0')));
      let visibleCount = PAGE_SIZE;
      const visible1 = many.slice(0, visibleCount);
      expect(visible1).toHaveLength(20);
      visibleCount += PAGE_SIZE;
      const visible2 = many.slice(0, visibleCount);
      expect(visible2).toHaveLength(40);
    });

    it('hasMore is true when filtered length exceeds visible count', () => {
      const many = Array.from({ length: 25 }, (_, i) => makeAccount(i.toString(16).padStart(40, '0')));
      const hasMore = many.length > PAGE_SIZE;
      expect(hasMore).toBe(true);
    });

    it('hasMore is false when all items fit', () => {
      const few = Array.from({ length: 10 }, (_, i) => makeAccount(i.toString(16).padStart(40, '0')));
      const hasMore = few.length > PAGE_SIZE;
      expect(hasMore).toBe(false);
    });
  });

  describe('per-chain confidence', () => {
    it('a record with two chains has independent confidence values', () => {
      const record = makeRecord({
        chains: [
          {
            chainId: 1,
            note: '',
            confidence: 'confirmed',
            sources: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
          {
            chainId: 8453,
            note: '',
            confidence: 'likely',
            sources: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      });
      const ethConf = record.chains.find(c => c.chainId === 1)?.confidence;
      const baseConf = record.chains.find(c => c.chainId === 8453)?.confidence;
      expect(ethConf).toBe('confirmed');
      expect(baseConf).toBe('likely');
      expect(ethConf).not.toBe(baseConf);
    });

    it('a record with one chain does not imply a shared confidence', () => {
      const record = makeRecord({
        chains: [
          {
            chainId: 1,
            note: '',
            confidence: 'unverified',
            sources: [],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      });
      const hasBaseContext = record.chains.some(c => c.chainId === 8453);
      expect(hasBaseContext).toBe(false);
    });
  });
});
