import 'fake-indexeddb/auto';
import { TraceMemoDatabase } from './schema.js';
import { Dexie } from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import type { AddressRecord } from '@extension/shared';
import type { Table } from 'dexie';

/**
 * Version 1 used the chain-ambiguous `evm:<address>` key with no chainId.
 * Those records cannot be safely assigned to Ethereum Mainnet (1) or Base
 * (8453); the v1 -> v2 upgrade must clear them rather than duplicate them onto
 * both chains.
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

describe('database migration v1 -> v2', () => {
  afterEach(async () => {
    // Best-effort cleanup of any leftover database.
    await Dexie.delete(DB_NAME);
  });

  it('clears chain-ambiguous v1 records on upgrade', async () => {
    const v1 = new V1Database(DB_NAME);
    await v1.open();
    await v1.records.put({
      key: 'evm:0x' + 'a'.repeat(40),
      chainId: 1, // v1 did not store chainId; this is just to satisfy the type
      address: ('0x' + 'a'.repeat(40)) as never,
      label: 'old',
      note: '',
      confidence: 'unverified',
      sources: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    } as AddressRecord);
    await v1.close();

    const db = new TraceMemoDatabase(DB_NAME);
    await db.open();

    const records = await db.records.toArray();
    expect(records).toEqual([]);
    await db.close();
  });

  it('new installs go straight to v2 and accept chain-aware records', async () => {
    const db = new TraceMemoDatabase(DB_NAME);
    await db.open();
    await db.records.put({
      key: 'eip155:1:0x' + 'a'.repeat(40),
      chainId: 1,
      address: ('0x' + 'a'.repeat(40)) as never,
      label: 'new',
      note: '',
      confidence: 'unverified',
      sources: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    } as AddressRecord);
    expect(await db.records.count()).toBe(1);
    await db.close();
  });
});
