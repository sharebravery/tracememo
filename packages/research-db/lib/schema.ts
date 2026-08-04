import { Dexie } from 'dexie';
import type { AddressKey, AddressRecord } from '@extension/shared';
import type { Table } from 'dexie';

/**
 * TraceMemo IndexedDB schema.
 *
 * One object store holds every research record. The primary key is the
 * canonical address key (`evm:<lowercase address>`); secondary indexes cover
 * the fields used for listing and future filtering. See
 * docs/02-TECHNICAL-ARCHITECTURE.md section 7.1.
 */
export class TraceMemoDatabase extends Dexie {
  records!: Table<AddressRecord, AddressKey>;

  constructor(name = 'tracememo') {
    super(name);
    this.version(1).stores({
      records: '&key, address, label, confidence, createdAt, updatedAt',
    });
  }
}
