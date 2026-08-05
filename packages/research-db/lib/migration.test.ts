import 'fake-indexeddb/auto';
import { TraceMemoDatabase } from './schema.js';
import { Dexie } from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import type { AddressRecord } from '@extension/shared';
import type { Table } from 'dexie';

/**
 * Version 1 used `evm:<address>` with no chain info. Version 2 used chain-aware
 * `eip155:<chainId>:<address>` keys (one record per chain). Version 3 returns to
 * one global record per address (`evm:<address>`) with an array of per-chain
 * contexts. v2 -> v3 cannot safely derive the shared global label/tags/note, so
 * the upgrade clears v2 data. v1 was already cleared at v1 -> v2.
 */
class V1Database extends Dexie {
  records!: Table<AddressRecord, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      records: '&key, address, label, confidence, createdAt, updatedAt',
    });
  }
}

const DB_NAME = 'tracememo-migration-test';

describe('database migration to v3', () => {
  afterEach(async () => {
    await Dexie.delete(DB_NAME);
  });

  it('clears v1 records on upgrade to v3', async () => {
    const v1 = new V1Database(DB_NAME);
    await v1.open();
    await v1.records.put({
      key: 'evm:0x' + 'a'.repeat(40),
      address: ('0x' + 'a'.repeat(40)) as never,
      label: 'old',
      tags: [],
      note: '',
      chains: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    } as AddressRecord);
    await v1.close();

    const db = new TraceMemoDatabase(DB_NAME);
    await db.open();
    expect(await db.records.toArray()).toEqual([]);
    await db.close();
  });

  it('new installs go straight to v3 and accept one global record with chain contexts', async () => {
    const db = new TraceMemoDatabase(DB_NAME);
    await db.open();
    await db.records.put({
      key: 'evm:0x' + 'a'.repeat(40),
      address: ('0x' + 'a'.repeat(40)) as never,
      label: 'new',
      tags: ['wallet'],
      note: 'global',
      chains: [
        {
          chainId: 1,
          note: 'eth',
          confidence: 'confirmed',
          sources: [],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          chainId: 8453,
          note: 'base',
          confidence: 'likely',
          sources: [],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    } as AddressRecord);
    expect(await db.records.count()).toBe(1);
    const stored = (await db.records.toArray())[0];
    expect(stored.chains).toHaveLength(2);
    await db.close();
  });
});
