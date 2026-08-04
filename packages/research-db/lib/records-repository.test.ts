import 'fake-indexeddb/auto';
import { createRecordsRepository } from './records-repository.js';
import { TraceMemoDatabase } from './schema.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AddressKey, AddressRecord, EvmAddress, TraceMemoExport } from '@extension/shared';

const a = (hex: string): EvmAddress => `0x${hex}` as EvmAddress;
const k = (hex: string): AddressKey => `evm:0x${hex}` as AddressKey;

const ONE = '1'.repeat(40);
const TWO = '2'.repeat(40);
const KEY_A = k('a'.repeat(40));
const ADDRESS_A = a('Aa'.repeat(20));

const makeRecord = (overrides: Partial<AddressRecord> = {}): AddressRecord => ({
  key: KEY_A,
  address: ADDRESS_A,
  label: 'Test label',
  note: 'A note',
  confidence: 'unverified',
  sources: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
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
    it('upserts and retrieves a record by key', async () => {
      const repo = createRecordsRepository(db);
      await repo.upsert(makeRecord());

      const fetched = await repo.get(KEY_A);
      expect(fetched?.label).toBe('Test label');
    });

    it('overwrites on a second upsert with the same key', async () => {
      const repo = createRecordsRepository(db);
      await repo.upsert(makeRecord({ label: 'First' }));
      await repo.upsert(makeRecord({ label: 'Second', updatedAt: '2026-02-01T00:00:00.000Z' }));

      const fetched = await repo.get(KEY_A);
      expect(fetched?.label).toBe('Second');
      expect(await repo.list()).toHaveLength(1);
    });

    it('lists records ordered by updatedAt descending', async () => {
      const repo = createRecordsRepository(db);
      await repo.upsert(
        makeRecord({ key: k(ONE), address: a(ONE), label: 'older', updatedAt: '2026-01-01T00:00:00.000Z' }),
      );
      await repo.upsert(
        makeRecord({ key: k(TWO), address: a(TWO), label: 'newer', updatedAt: '2026-03-01T00:00:00.000Z' }),
      );

      const list = await repo.list();
      expect(list.map(r => r.label)).toEqual(['newer', 'older']);
    });

    it('getMany returns only existing records and drops misses', async () => {
      const repo = createRecordsRepository(db);
      await repo.upsert(makeRecord());
      const results = await repo.getMany([KEY_A, k('9'.repeat(40))]);
      expect(results).toHaveLength(1);
      expect(results[0].key).toBe(KEY_A);
    });

    it('removes a record', async () => {
      const repo = createRecordsRepository(db);
      await repo.upsert(makeRecord());
      await repo.remove(KEY_A);
      expect(await repo.get(KEY_A)).toBeUndefined();
    });

    it('clear removes every record', async () => {
      const repo = createRecordsRepository(db);
      await repo.upsert(makeRecord());
      await repo.clear();
      expect(await repo.list()).toEqual([]);
    });
  });

  describe('export', () => {
    it('round-trips records through exportAll', async () => {
      const repo = createRecordsRepository(db);
      const record = makeRecord();
      await repo.upsert(record);

      const exported = await repo.exportAll();
      expect(exported.format).toBe('tracememo');
      expect(exported.version).toBe(1);
      expect(exported.records).toHaveLength(1);
      expect(exported.records[0]).toEqual(record);
    });
  });

  describe('import', () => {
    it('creates records that do not exist', async () => {
      const repo = createRecordsRepository(db);
      const envelope: TraceMemoExport = {
        format: 'tracememo',
        version: 1,
        exportedAt: '2026-01-01T00:00:00.000Z',
        records: [makeRecord()],
      };

      const result = await repo.importAll(envelope);
      expect(result).toEqual({ created: 1, updated: 0, skipped: 0, invalid: 0 });
      expect(await repo.list()).toHaveLength(1);
    });

    it('updates when the incoming record is newer', async () => {
      const repo = createRecordsRepository(db);
      await repo.upsert(makeRecord({ label: 'Local', updatedAt: '2026-01-01T00:00:00.000Z' }));

      const result = await repo.importAll({
        format: 'tracememo',
        version: 1,
        exportedAt: '2026-06-01T00:00:00.000Z',
        records: [makeRecord({ label: 'Imported', updatedAt: '2026-06-01T00:00:00.000Z' })],
      });

      expect(result).toEqual({ created: 0, updated: 1, skipped: 0, invalid: 0 });
      const fetched = await repo.get(KEY_A);
      expect(fetched?.label).toBe('Imported');
    });

    it('skips when the incoming record is older or equal', async () => {
      const repo = createRecordsRepository(db);
      await repo.upsert(makeRecord({ label: 'Local', updatedAt: '2026-06-01T00:00:00.000Z' }));

      const result = await repo.importAll({
        format: 'tracememo',
        version: 1,
        exportedAt: '2026-01-01T00:00:00.000Z',
        records: [makeRecord({ label: 'Imported', updatedAt: '2026-01-01T00:00:00.000Z' })],
      });

      expect(result).toEqual({ created: 0, updated: 0, skipped: 1, invalid: 0 });
      expect((await repo.get(KEY_A))?.label).toBe('Local');
    });

    it('counts and skips invalid records without partial writes', async () => {
      const repo = createRecordsRepository(db);
      const valid = makeRecord({ key: k(ONE), address: a(ONE) });
      const invalid = { ...valid, key: 'evm:not-a-key' } as unknown as AddressRecord;

      const result = await repo.importAll({
        format: 'tracememo',
        version: 1,
        exportedAt: '2026-01-01T00:00:00.000Z',
        records: [valid, invalid],
      });

      expect(result).toEqual({ created: 1, updated: 0, skipped: 0, invalid: 1 });
      expect(await repo.list()).toHaveLength(1);
    });

    it('handles timezone-offset timestamps by comparing instants', async () => {
      const repo = createRecordsRepository(db);
      await repo.upsert(makeRecord({ updatedAt: '2026-01-01T00:00:00.000Z' }));

      // Same instant as the local record, expressed with an offset.
      const sameInstant = '2026-01-01T01:00:00.000+01:00';
      const result = await repo.importAll({
        format: 'tracememo',
        version: 1,
        exportedAt: sameInstant,
        records: [makeRecord({ updatedAt: sameInstant, label: 'Equal' })],
      });

      expect(result.skipped).toBe(1);
      expect((await repo.get(KEY_A))?.label).toBe('Test label');
    });
  });
});
