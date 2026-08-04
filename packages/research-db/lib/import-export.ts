import { addressRecordSchema } from '@extension/shared';
import type { TraceMemoDatabase } from './schema.js';
import type { AddressRecord, ImportPreview, ImportResult, TraceMemoExport } from '@extension/shared';

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
 * Validate every record in an envelope strictly. Returns the parsed records or
 * throws on the first invalid record. Import is all-or-nothing: a single
 * invalid record rejects the whole file with no database writes.
 */
export const validateImportRecords = (records: unknown[]): AddressRecord[] => {
  const parsed: AddressRecord[] = [];
  records.forEach((raw, index) => {
    const result = addressRecordSchema.safeParse(raw);
    if (!result.success) {
      throw new ImportError(`record at index ${index} is invalid`);
    }
    parsed.push(result.data as AddressRecord);
  });
  return parsed;
};

/** Error thrown when an import is rejected before any write. */
export class ImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportError';
  }
}

/**
 * Dry-run preview: count create/update/skip against the current database
 * without writing. All records are validated first (all-or-nothing).
 */
export const previewImport = async (db: TraceMemoDatabase, input: TraceMemoExport): Promise<ImportPreview> => {
  const records = validateImportRecords(input.records);
  const result: ImportPreview = { total: records.length, created: 0, updated: 0, skipped: 0 };

  await db.transaction('r', db.records, async () => {
    for (const record of records) {
      const existing = await db.records.get(record.key);
      if (existing === undefined) {
        result.created += 1;
      } else if (new Date(record.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
        result.updated += 1;
      } else {
        result.skipped += 1;
      }
    }
  });

  return result;
};

/**
 * Apply an import inside a single Dexie transaction (all-or-nothing).
 *
 * Conflict rule (docs/02-TECHNICAL-ARCHITECTURE.md section 11.2):
 * - same canonical key: keep the record with the newer valid `updatedAt`;
 * - equal timestamps: keep the existing local record (skip);
 * - invalid record: the whole import is rejected before this function writes.
 */
export const applyImport = async (db: TraceMemoDatabase, input: TraceMemoExport): Promise<ImportResult> => {
  const records = validateImportRecords(input.records);
  const result: ImportResult = { created: 0, updated: 0, skipped: 0, invalid: 0 };

  await db.transaction('rw', db.records, async () => {
    for (const record of records) {
      const existing = await db.records.get(record.key);
      if (existing === undefined) {
        await db.records.put(record);
        result.created += 1;
        continue;
      }

      const incomingTime = new Date(record.updatedAt).getTime();
      const existingTime = new Date(existing.updatedAt).getTime();

      if (Number.isNaN(incomingTime) || Number.isNaN(existingTime)) {
        result.skipped += 1;
        continue;
      }

      if (incomingTime > existingTime) {
        await db.records.put(record);
        result.updated += 1;
      } else {
        result.skipped += 1;
      }
    }
  });

  return result;
};
