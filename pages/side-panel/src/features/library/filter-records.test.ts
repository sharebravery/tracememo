import { filterRecords } from './filter-records.js';
import { describe, expect, it } from 'vitest';
import type { AccountKey, AddressRecord, EvmAddress, SupportedChainId } from '@extension/shared';

const a = (hex: string): EvmAddress => `0x${hex}` as EvmAddress;
const k = (chainId: SupportedChainId, hex: string): AccountKey => `eip155:${chainId}:0x${hex}` as AccountKey;

const record = (overrides: Partial<AddressRecord>): AddressRecord => ({
  key: k(1, 'a'.repeat(40)),
  chainId: 1,
  address: a('a'.repeat(40)),
  label: 'Default label',
  note: 'default note',
  confidence: 'unverified',
  sources: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const records: AddressRecord[] = [
  record({
    key: k(1, '1'.repeat(40)),
    chainId: 1,
    address: a('1'.repeat(40)),
    label: 'Vitalik',
    note: 'public wallet',
    confidence: 'confirmed',
  }),
  record({
    key: k(1, '2'.repeat(40)),
    chainId: 1,
    address: a('2'.repeat(40)),
    label: 'Exchange hot wallet',
    note: 'Binance',
    confidence: 'likely',
  }),
  record({
    key: k(8453, '3'.repeat(40)),
    chainId: 8453,
    address: a('3'.repeat(40)),
    label: 'Unknown',
    note: 'needs review',
    confidence: 'unverified',
  }),
];

describe('filterRecords', () => {
  it('returns all records when the query is empty and confidence is all', () => {
    expect(filterRecords(records, { query: '', confidence: 'all' })).toHaveLength(3);
  });

  it('matches by partial label (case-insensitive)', () => {
    const result = filterRecords(records, { query: 'vital', confidence: 'all' });
    expect(result.map(r => r.label)).toEqual(['Vitalik']);
  });

  it('matches by partial address', () => {
    const result = filterRecords(records, { query: '0x' + '2'.repeat(4), confidence: 'all' });
    expect(result.map(r => r.label)).toEqual(['Exchange hot wallet']);
  });

  it('matches by note text', () => {
    const result = filterRecords(records, { query: 'binance', confidence: 'all' });
    expect(result.map(r => r.label)).toEqual(['Exchange hot wallet']);
  });

  it('filters by confidence', () => {
    const result = filterRecords(records, { query: '', confidence: 'confirmed' });
    expect(result.map(r => r.confidence)).toEqual(['confirmed']);
  });

  it('combines query and confidence filter', () => {
    const result = filterRecords(records, { query: 'wallet', confidence: 'likely' });
    expect(result.map(r => r.label)).toEqual(['Exchange hot wallet']);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterRecords(records, { query: 'nonexistent', confidence: 'all' })).toEqual([]);
  });

  it('trims and lowercases the query', () => {
    const result = filterRecords(records, { query: '  VITALIK  ', confidence: 'all' });
    expect(result).toHaveLength(1);
  });
});
