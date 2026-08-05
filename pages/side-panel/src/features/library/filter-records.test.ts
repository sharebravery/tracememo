import { filterRecords } from './filter-records.js';
import { describe, expect, it } from 'vitest';
import type { AddressKey, AddressRecord, EvmAddress, SupportedChainId } from '@extension/shared';

const a = (hex: string): EvmAddress => `0x${hex}` as EvmAddress;
const k = (hex: string): AddressKey => `evm:0x${hex}` as AddressKey;

const chain = (chainId: SupportedChainId, confidence: AddressRecord['chains'][number]['confidence'], note = '') => ({
  chainId,
  note,
  confidence,
  sources: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const record = (overrides: Partial<AddressRecord>): AddressRecord => ({
  key: k('a'.repeat(40)),
  address: a('a'.repeat(40)),
  label: 'Default label',
  tags: [],
  note: 'default note',
  chains: [chain(1, 'unverified')],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const records: AddressRecord[] = [
  record({
    key: k('1'.repeat(40)),
    address: a('1'.repeat(40)),
    label: 'Vitalik',
    tags: ['wallet'],
    note: 'public wallet',
    chains: [chain(1, 'confirmed', 'primary')],
  }),
  record({
    key: k('2'.repeat(40)),
    address: a('2'.repeat(40)),
    label: 'Exchange hot wallet',
    tags: ['exchange'],
    note: '',
    chains: [chain(8453, 'likely', 'Binance')],
  }),
  record({
    key: k('3'.repeat(40)),
    address: a('3'.repeat(40)),
    label: 'Unknown',
    tags: [],
    note: 'needs review',
    chains: [chain(1, 'unverified')],
  }),
];

describe('filterRecords', () => {
  it('returns all records when the query is empty and confidence is all', () => {
    expect(filterRecords(records, { query: '', confidence: 'all' })).toHaveLength(3);
  });

  it('matches by partial label (case-insensitive)', () => {
    expect(filterRecords(records, { query: 'vital', confidence: 'all' }).map(r => r.label)).toEqual(['Vitalik']);
  });

  it('matches by partial address', () => {
    expect(filterRecords(records, { query: '0x' + '2'.repeat(4), confidence: 'all' }).map(r => r.label)).toEqual([
      'Exchange hot wallet',
    ]);
  });

  it('matches by global note text', () => {
    expect(filterRecords(records, { query: 'review', confidence: 'all' }).map(r => r.label)).toEqual(['Unknown']);
  });

  it('matches by tag', () => {
    expect(filterRecords(records, { query: 'exchange', confidence: 'all' }).map(r => r.label)).toEqual([
      'Exchange hot wallet',
    ]);
  });

  it('matches by chain-level note', () => {
    expect(filterRecords(records, { query: 'binance', confidence: 'all' }).map(r => r.label)).toEqual([
      'Exchange hot wallet',
    ]);
  });

  it('filters by confidence (any chain context)', () => {
    expect(filterRecords(records, { query: '', confidence: 'confirmed' }).map(r => r.label)).toEqual(['Vitalik']);
  });

  it('combines query and confidence filter', () => {
    expect(filterRecords(records, { query: 'wallet', confidence: 'likely' }).map(r => r.label)).toEqual([
      'Exchange hot wallet',
    ]);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterRecords(records, { query: 'nonexistent', confidence: 'all' })).toEqual([]);
  });
});
