import 'fake-indexeddb/auto';
import { createRecordsRepository } from './records-repository.js';
import { TraceMemoDatabase } from './schema.js';
import { describe, expect, it } from 'vitest';
import type { AccountKey, AddressRecord, EvmAddress, SupportedChainId } from '@extension/shared';

const a = (i: number): EvmAddress => `0x${i.toString(16).padStart(40, '0')}` as EvmAddress;
const k = (i: number): AccountKey => `eip155:1:0x${i.toString(16).padStart(40, '0')}` as AccountKey;
const CHAIN: SupportedChainId = 1;

const makeRecord = (i: number): AddressRecord => ({
  key: k(i),
  chainId: CHAIN,
  address: a(i),
  label: `Label ${i}`,
  note: `research note ${i}`,
  confidence: i % 3 === 0 ? 'confirmed' : i % 3 === 1 ? 'likely' : 'unverified',
  sources: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: `2026-0${(i % 9) + 1}-0${(i % 27) + 1}T00:00:00.000Z`,
});

/**
 * Performance smoke (architecture section 15): the library must handle 5,000
 * records without broken CRUD. Uses fake-indexeddb; tolerates a generous
 * timeout since this is a smoke check, not a benchmark.
 */
describe('repository performance with 5,000 records', () => {
  it('lists, gets, and deletes without breaking', async () => {
    const db = new TraceMemoDatabase('tracememo-perf');
    await db.open();
    const repo = createRecordsRepository(db);

    const records = Array.from({ length: 5000 }, (_, i) => makeRecord(i));
    await db.transaction('rw', db.records, async () => {
      await db.records.bulkPut(records);
    });

    const list = await repo.list();
    expect(list).toHaveLength(5000);

    const got = await repo.get(k(4242));
    expect(got?.label).toBe('Label 4242');

    await repo.remove(k(0));
    expect(await repo.list()).toHaveLength(4999);

    const exported = await repo.exportAll();
    expect(exported.records).toHaveLength(4999);

    await db.delete();
  }, 60000);
});
