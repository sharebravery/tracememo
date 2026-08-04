import { TraceMemoDatabase } from './schema.js';

/**
 * Lazily-initialized database singleton.
 *
 * Dexie does not open IndexedDB until the first query, so constructing the
 * instance at module load is safe for the service-worker lifecycle. The
 * singleton is reused across handler invocations; if the worker is suspended
 * and restarted, the next call reconstructs it transparently.
 */
let dbInstance: TraceMemoDatabase | undefined;

export const getDatabase = (): TraceMemoDatabase => {
  if (!dbInstance) {
    dbInstance = new TraceMemoDatabase();
  }
  return dbInstance;
};

/** Test helper: inject a database instance (e.g. backed by fake-indexeddb). */
export const setDatabaseForTesting = (db: TraceMemoDatabase | undefined): void => {
  dbInstance = db;
};
