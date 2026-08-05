import 'fake-indexeddb/auto';
import { ImportError } from './import-export.js';
import { createRecordsRepository } from './records-repository.js';
import { TraceMemoDatabase } from './schema.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AddressKey, AddressRecord, EvmAddress, SupportedChainId, TraceMemoExport } from '@extension/shared';

const a = (hex: string): EvmAddress => `0x${hex}` as EvmAddress;
const k = (hex: string): AddressKey => `evm:0x${hex}` as AddressKey;

const HEX_A = 'a'.repeat(40);
const KEY_A = k(HEX_A);
const ADDRESS_A = a('Aa'.repeat(20));
const NOW = '2026-01-01T00:00:00.000Z';

const chain = (chainId: SupportedChainId, overrides: Partial<AddressRecord['chains'][number]> = {}) => ({
  chainId,
  note: '',
  confidence: 'unverified' as const,
  sources: [],
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const makeRecord = (overrides: Partial<AddressRecord> = {}): AddressRecord => ({
  key: KEY_A,
  address: ADDRESS_A,
  label: 'Test label',
  tags: [],
  note: 'global note',
  chains: [chain(1)],
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const envelope = (records: AddressRecord[]): TraceMemoExport => ({
  format: 'tracememo',
  version: 1,
  exportedAt: NOW,
  records,
});

describe('records repository', () => {
  let db: TraceMemoDatabase;

  beforeEach(async () => {
    db = new TraceMemoDatabase('tracememo-test');
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  describe('CRUD', () => {
    it('upserts and retrieves a global record by address key', async () => {
      const repo = createRecordsRepository(db);
      await repo.upsert(makeRecord());
      expect((await repo.get(KEY_A))?.label).toBe('Test label');
    });

    it('keeps one record per address with multiple chain contexts', async () => {
      const repo = createRecordsRepository(db);
      await repo.upsert(makeRecord({ chains: [chain(1, { confidence: 'confirmed' })] }));
      await repo.upsert(
        makeRecord({ chains: [chain(1, { confidence: 'confirmed' }), chain(8453, { confidence: 'likely' })] }),
      );
      const list = await repo.list();
      expect(list).toHaveLength(1);
      expect(list[0].chains).toHaveLength(2);
    });

    it('lists ordered by updatedAt descending', async () => {
      const repo = createRecordsRepository(db);
      await repo.upsert(
        makeRecord({
          key: k('1'.repeat(40)),
          address: a('1'.repeat(40)),
          label: 'older',
          updatedAt: '2026-01-01T00:00:00.000Z',
        }),
      );
      await repo.upsert(
        makeRecord({
          key: k('2'.repeat(40)),
          address: a('2'.repeat(40)),
          label: 'newer',
          updatedAt: '2026-03-01T00:00:00.000Z',
        }),
      );
      expect((await repo.list()).map(r => r.label)).toEqual(['newer', 'older']);
    });

    it('getMany drops misses', async () => {
      const repo = createRecordsRepository(db);
      await repo.upsert(makeRecord());
      expect(await repo.getMany([KEY_A, k('9'.repeat(40))])).toHaveLength(1);
    });

    it('removes and clears', async () => {
      const repo = createRecordsRepository(db);
      await repo.upsert(makeRecord());
      await repo.remove(KEY_A);
      expect(await repo.get(KEY_A)).toBeUndefined();
      await repo.upsert(makeRecord());
      await repo.clear();
      expect(await repo.list()).toEqual([]);
    });
  });

  describe('export', () => {
    it('round-trips records', async () => {
      const repo = createRecordsRepository(db);
      const record = makeRecord();
      await repo.upsert(record);
      expect((await repo.exportAll()).records).toEqual([record]);
    });
  });

  describe('import preview (dry-run)', () => {
    it('counts create/update/skip without writing', async () => {
      const repo = createRecordsRepository(db);
      await repo.upsert(makeRecord({ label: 'Local', updatedAt: '2026-06-01T00:00:00.000Z' }));
      const preview = await repo.previewImport(
        envelope([
          makeRecord({ label: 'Equal', updatedAt: '2026-06-01T00:00:00.000Z' }),
          makeRecord({
            key: k('1'.repeat(40)),
            address: a('1'.repeat(40)),
            label: 'New',
            updatedAt: '2026-01-01T00:00:00.000Z',
          }),
        ]),
      );
      expect(preview).toEqual({ total: 2, created: 1, updated: 0, skipped: 1 });
      expect((await repo.get(KEY_A))?.label).toBe('Local');
    });

    it('rejects a preview with an invalid record and writes nothing', async () => {
      const repo = createRecordsRepository(db);
      const bad = { ...makeRecord(), key: 'eip155:1:0x' + 'a'.repeat(40) };
      await expect(
        repo.previewImport(envelope([makeRecord(), bad as unknown as AddressRecord])),
      ).rejects.toBeInstanceOf(ImportError);
    });
  });

  describe('import (all-or-nothing)', () => {
    it('creates records that do not exist', async () => {
      const repo = createRecordsRepository(db);
      const result = await repo.importAll(envelope([makeRecord()]));
      expect(result).toEqual({ created: 1, updated: 0, skipped: 0, invalid: 0 });
    });

    it('updates when the incoming record is newer', async () => {
      const repo = createRecordsRepository(db);
      await repo.upsert(makeRecord({ label: 'Local', updatedAt: '2026-01-01T00:00:00.000Z' }));
      const result = await repo.importAll(
        envelope([makeRecord({ label: 'Imported', updatedAt: '2026-06-01T00:00:00.000Z' })]),
      );
      expect(result.updated).toBe(1);
      expect((await repo.get(KEY_A))?.label).toBe('Imported');
    });

    it('skips when the incoming record is older or equal', async () => {
      const repo = createRecordsRepository(db);
      await repo.upsert(makeRecord({ label: 'Local', updatedAt: '2026-06-01T00:00:00.000Z' }));
      const result = await repo.importAll(
        envelope([makeRecord({ label: 'Imported', updatedAt: '2026-01-01T00:00:00.000Z' })]),
      );
      expect(result.skipped).toBe(1);
      expect((await repo.get(KEY_A))?.label).toBe('Local');
    });

    it('rejects the whole file on any invalid record with no writes', async () => {
      const repo = createRecordsRepository(db);
      const valid = makeRecord({ key: k('1'.repeat(40)), address: a('1'.repeat(40)) });
      const invalid = { ...valid, key: 'eip155:1:0x' + 'a'.repeat(40) } as unknown as AddressRecord;
      await expect(repo.importAll(envelope([valid, invalid]))).rejects.toBeInstanceOf(ImportError);
      expect(await repo.list()).toHaveLength(0);
    });
  });
});
