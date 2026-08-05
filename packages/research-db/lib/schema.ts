import { Dexie } from 'dexie';
import type { AddressKey, AddressRecord } from '@extension/shared';
import type { Table, Transaction } from 'dexie';

/**
 * TraceMemo IndexedDB schema.
 *
 * Version 3: one global record per EVM address (`evm:<address>` key) holding a
 * shared label/tags/note plus an array of per-chain contexts. Version 2 used
 * chain-aware `eip155:<chainId>:<address>` keys with one record per chain.
 * Migrating v2 -> v3 would force choosing which chain's label becomes the
 * shared global label, which is ambiguous; the upgrade clears v2 dev data
 * rather than guessing. Version 1 used `evm:<address>` with no chain info and
 * was already cleared at v1 -> v2. New users go straight to v3.
 */
export class TraceMemoDatabase extends Dexie {
  records!: Table<AddressRecord, AddressKey>;

  constructor(name = 'tracememo') {
    super(name);
    this.version(1).stores({
      records: '&key, address, label, confidence, createdAt, updatedAt',
    });
    this.version(2)
      .stores({
        records: '&key, chainId, address, label, confidence, createdAt, updatedAt',
      })
      .upgrade(async (tx: Transaction) => {
        await tx.table('records').clear();
      });
    this.version(3)
      .stores({
        records: '&key, address, label, updatedAt',
      })
      .upgrade(async (tx: Transaction) => {
        // v2 records are per-chain; the shared global label/tags/note cannot be
        // derived unambiguously. Clear rather than guess.
        await tx.table('records').clear();
      });
  }
}
