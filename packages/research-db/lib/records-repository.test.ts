import 'fake-indexeddb/auto';
import { ImportError } from './import-export.js';
import { createRecordsRepository } from './records-repository.js';
import { TraceMemoDatabase } from './schema.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AccountKey, AddressRecord, EvmAddress, SupportedChainId, TraceMemoExport } from '@extension/shared';

const a = (hex: string): EvmAddress => `0x${hex}` as EvmAddress;
const k = (chainId: SupportedChainId, hex: string): AccountKey => `eip155:${chainId}:0x${hex}` as AccountKey;

const ONE = '1'.repeat(40);
const TWO = '2'.repeat(40);
const KEY_A = k(1, 'a'.repeat(40));
const ADDRESS_A = a('Aa'.repeat(20));

const makeRecord = (overrides: Partial<AddressRecord> = {}): AddressRecord => ({
  key: KEY_A,
  chainId: 1,
  address: ADDRESS_A,
  label: 'Test label',
  note: 'A note',
  confidence: 'unverified',
  sources: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

const envelope = (records: AddressRecord[]): TraceMemoExport => ({
  format: 'tracememo',
  version: 1,
  exportedAt: '2026-01-01T00:00:00.000Z',
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
    it('upserts and retrieves a record by account key', async () => {
      const repo = createRecordsRepository(db);
      await repo.upsert(makeRecord());
      expect((await repo.get(KEY_A))?.label).toBe('Test label');
    });

    it('keeps Ethereum and Base records for the same address separate', async () => {
      const repo = createRecordsRepository(db);
      await repo.upsert(makeRecord({ key: k(1, 'a'.repeat(40)), chainId: 1, label: 'Eth' }));
      await repo.upsert(
        makeRecord({ key: k(8453, 'a'.repeat(40)), chainId: 8453, address: a('Aa'.repeat(20)), label: 'Base' }),
      );
      expect(await repo.list()).toHaveLength(2);
      expect((await repo.get(k(1, 'a'.repeat(40))))?.label).toBe('Eth');
      expect((await repo.get(k(8453, 'a'.repeat(40))))?.label).toBe('Base');
    });

    it('lists ordered by updatedAt descending', async () => {
      const repo = createRecordsRepository(db);
      await repo.upsert(
        makeRecord({
          key: k(1, ONE),
          chainId: 1,
          address: a(ONE),
          label: 'older',
          updatedAt: '2026-01-01T00:00:00.000Z',
        }),
      );
      await repo.upsert(
        makeRecord({
          key: k(1, TWO),
          chainId: 1,
          address: a(TWO),
          label: 'newer',
          updatedAt: '2026-03-01T00:00:00.000Z',
        }),
      );
      expect((await repo.list()).map(r => r.label)).toEqual(['newer', 'older']);
    });

    it('getMany drops misses', async () => {
      const repo = createRecordsRepository(db);
      await repo.upsert(makeRecord());
      const results = await repo.getMany([KEY_A, k(1, '9'.repeat(40))]);
      expect(results).toHaveLength(1);
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
      const exported = await repo.exportAll();
      expect(exported.records).toEqual([record]);
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
            key: k(1, ONE),
            chainId: 1,
            address: a(ONE),
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
      const bad = { ...makeRecord(), key: 'evm:0x' + 'a'.repeat(40) };
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
      const valid = makeRecord({ key: k(1, ONE), chainId: 1, address: a(ONE) });
      const invalid = { ...valid, key: 'evm:0x' + 'a'.repeat(40) } as unknown as AddressRecord;
      await expect(repo.importAll(envelope([valid, invalid]))).rejects.toBeInstanceOf(ImportError);
      expect(await repo.list()).toHaveLength(0);
    });

    it('handles timezone-offset timestamps by comparing instants', async () => {
      const repo = createRecordsRepository(db);
      await repo.upsert(makeRecord({ updatedAt: '2026-01-01T00:00:00.000Z' }));
      const sameInstant = '2026-01-01T01:00:00.000+01:00';
      const result = await repo.importAll(envelope([makeRecord({ updatedAt: sameInstant, label: 'Equal' })]));
      expect(result.skipped).toBe(1);
      expect((await repo.get(KEY_A))?.label).toBe('Test label');
    });
  });
});
