import { Dexie } from 'dexie';
import type { AccountKey, AddressRecord } from '@extension/shared';
import type { Table, Transaction } from 'dexie';

/**
 * TraceMemo IndexedDB schema.
 *
 * Version 2 introduces chain-aware account keys (`eip155:<chainId>:<address>`)
 * and a `chainId` index. Version 1 used the chain-ambiguous `evm:<address>`
 * key with no chain information; those records cannot be safely assigned to
 * Ethereum Mainnet (1) or Base (8453), so the v1 -> v2 upgrade clears them
 * rather than silently duplicating each onto both chains. New users never
 * touch v1.
 */
export class TraceMemoDatabase extends Dexie {
  records!: Table<AddressRecord, AccountKey>;

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
        // Old v1 records have no chainId and an `evm:` key. They are ambiguous
        // across chains and must not be copied onto both. Clear them.
        await tx.table('records').clear();
      });
  }
}
