import { applyImport, buildExportEnvelope, previewImport } from './import-export.js';
import type { TraceMemoDatabase } from './schema.js';
import type { AddressKey, AddressRecord, ImportPreview, ImportResult, TraceMemoExport } from '@extension/shared';

/**
 * Records repository - the only layer that reads and writes the records store.
 *
 * The background service worker holds one instance; the side panel and content
 * script never touch IndexedDB directly. See docs/02-TECHNICAL-ARCHITECTURE.md
 * section 7.2.
 */
export interface RecordsRepository {
  list(): Promise<AddressRecord[]>;
  get(key: AddressKey): Promise<AddressRecord | undefined>;
  getMany(keys: AddressKey[]): Promise<AddressRecord[]>;
  /** Atomically create a new record. Rejects (KeyAlreadyExists) if the key
   * already exists - never overwrites. Use `upsert` for updates. */
  create(record: AddressRecord): Promise<AddressRecord>;
  upsert(record: AddressRecord): Promise<AddressRecord>;
  remove(key: AddressKey): Promise<void>;
  clear(): Promise<void>;
  exportAll(): Promise<TraceMemoExport>;
  importAll(input: TraceMemoExport): Promise<ImportResult>;
  previewImport(input: TraceMemoExport): Promise<ImportPreview>;
}

export const createRecordsRepository = (db: TraceMemoDatabase): RecordsRepository => ({
  list: async () => db.records.orderBy('updatedAt').reverse().toArray(),

  get: async key => db.records.get(key),

  getMany: async keys => {
    const rows = await db.records.bulkGet(keys);
    return rows.filter((row): row is AddressRecord => row !== undefined);
  },

  create: async record => {
    // `add` rejects on an existing primary key - never overwrites.
    await db.records.add(record);
    return record;
  },

  upsert: async record => {
    await db.records.put(record);
    return record;
  },

  remove: async key => {
    await db.records.delete(key);
  },

  clear: async () => {
    await db.records.clear();
  },

  exportAll: async () => buildExportEnvelope(await db.records.toArray()),

  importAll: async input => applyImport(db, input),

  previewImport: async input => previewImport(db, input),
});
