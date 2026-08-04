import { addressRecordSchema } from '@extension/shared';
import type { TraceMemoDatabase } from './schema.js';
import type { AddressRecord, ImportResult, TraceMemoExport } from '@extension/shared';

/**
 * Build a versioned export envelope from persisted records.
 */
export const buildExportEnvelope = (
  records: AddressRecord[],
  exportedAt = new Date().toISOString(),
): TraceMemoExport => ({
  format: 'tracememo',
  version: 1,
  exportedAt,
  records,
});

/**
 * Apply an import inside a single Dexie transaction.
 *
 * Conflict rule (docs/02-TECHNICAL-ARCHITECTURE.md section 11.2):
 * - same canonical key: keep the record with the newer valid `updatedAt`;
 * - equal timestamps: keep the existing local record (skip);
 * - invalid record: skip and count, without exposing content in logs.
 *
 * Returns create/update/skip/invalid counts. The whole import runs in one
 * transaction so a failure rolls back every change (no partial writes).
 */
export const applyImport = async (db: TraceMemoDatabase, input: TraceMemoExport): Promise<ImportResult> => {
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, invalid: 0 };

  await db.transaction('rw', db.records, async () => {
    for (const raw of input.records) {
      const parsed = addressRecordSchema.safeParse(raw);
      if (!parsed.success) {
        result.invalid += 1;
        continue;
      }

      // The schema has validated the key format and address; cast to the
      // branded domain types without re-deriving them.
      const record = parsed.data as AddressRecord;
      const existing = await db.records.get(record.key);

      if (existing === undefined) {
        await db.records.put(record);
        result.created += 1;
        continue;
      }

      const incomingTime = new Date(record.updatedAt).getTime();
      const existingTime = new Date(existing.updatedAt).getTime();

      if (Number.isNaN(incomingTime) || Number.isNaN(existingTime)) {
        // Defensive: treat unparseable timestamps as non-newer and skip.
        result.skipped += 1;
        continue;
      }

      if (incomingTime > existingTime) {
        await db.records.put(record);
        result.updated += 1;
      } else {
        // Equal or older: keep existing local record.
        result.skipped += 1;
      }
    }
  });

  return result;
};
