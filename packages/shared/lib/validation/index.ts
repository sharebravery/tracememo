import { isAddress } from 'viem';
import { z } from 'zod';

/**
 * Runtime validation schemas for TraceMemo domain objects.
 *
 * Enforces the field rules from docs/02-TECHNICAL-ARCHITECTURE.md section 6.3:
 * - address validity (via viem);
 * - label length 1-60;
 * - note max 2,000;
 * - source URL must be http: or https:;
 * - source title max 300;
 * - timestamps are ISO strings;
 * - import envelope version is supported.
 */
const httpUrlSchema = z.string().refine(
  value => {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  },
  { message: 'Source URL must use http or https' },
);

export const confidenceSchema = z.enum(['confirmed', 'likely', 'unverified']);

export const isoTimestampSchema = z.string().datetime({ offset: true, message: 'Expected an ISO 8601 timestamp' });

export const evmAddressSchema = z
  .string()
  .refine(v => isAddress(v, { strict: false }), { message: 'Invalid EVM address' });

export const addressKeySchema = z.string().regex(/^evm:0x[0-9a-f]{40}$/, { message: 'Invalid address key' });

export const researchSourceSchema = z.object({
  id: z.string().min(1),
  url: httpUrlSchema,
  title: z.string().max(300),
  createdAt: isoTimestampSchema,
});

export const addressRecordSchema = z.object({
  key: addressKeySchema,
  address: evmAddressSchema,
  label: z.string().min(1).max(60),
  note: z.string().max(2000),
  confidence: confidenceSchema,
  sources: z.array(researchSourceSchema),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});

/** Input accepted from the UI. `note` defaults to empty; `createdAt` is optional. */
export const addressRecordInputSchema = z.object({
  address: evmAddressSchema,
  label: z.string().min(1).max(60),
  note: z.string().max(2000).optional().default(''),
  confidence: confidenceSchema,
  sources: z.array(researchSourceSchema).default([]),
  createdAt: isoTimestampSchema.optional(),
});

/** Strict export envelope; every record must be valid. */
export const traceMemoExportSchema = z.object({
  format: z.literal('tracememo'),
  version: z.literal(1),
  exportedAt: isoTimestampSchema,
  records: z.array(addressRecordSchema),
});

/**
 * Loose import envelope. The envelope (format/version) is validated here; each
 * record is validated individually inside the repository so invalid records can
 * be skipped and counted rather than rejecting the whole import.
 */
export const traceMemoExportEnvelopeSchema = z.object({
  format: z.literal('tracememo'),
  version: z.literal(1),
  exportedAt: z.string(),
  records: z.array(z.unknown()),
});

export const settingsSchema = z.object({
  annotationsEnabled: z.boolean(),
  onboardingSeen: z.boolean(),
});

export const pageContextSchema = z.object({
  tabUrl: httpUrlSchema,
  pageTitle: z.string(),
  site: z.enum(['etherscan', 'basescan']),
  addresses: z.array(evmAddressSchema),
  observedAt: isoTimestampSchema,
});

/** Discriminated-union schema for every cross-context request message. */
export const requestMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('PAGE_CONTEXT_SET'), payload: pageContextSchema }),
  z.object({ type: z.literal('PAGE_CONTEXT_GET') }),
  z.object({ type: z.literal('RECORDS_GET_MANY'), payload: z.object({ keys: z.array(addressKeySchema) }) }),
  z.object({ type: z.literal('RECORD_LIST') }),
  z.object({ type: z.literal('RECORD_GET'), payload: z.object({ key: addressKeySchema }) }),
  z.object({ type: z.literal('RECORD_UPSERT'), payload: addressRecordInputSchema }),
  z.object({ type: z.literal('RECORD_DELETE'), payload: z.object({ key: addressKeySchema }) }),
  z.object({ type: z.literal('DATA_EXPORT') }),
  z.object({ type: z.literal('DATA_IMPORT'), payload: traceMemoExportEnvelopeSchema }),
  z.object({ type: z.literal('DATA_CLEAR') }),
  z.object({ type: z.literal('SETTINGS_GET') }),
  z.object({ type: z.literal('SETTINGS_UPDATE'), payload: settingsSchema.partial() }),
  z.object({ type: z.literal('OPEN_RECORD'), payload: z.object({ key: addressKeySchema }) }),
]);
