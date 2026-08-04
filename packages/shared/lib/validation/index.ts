import {
  ACCOUNT_KEYS_MAX,
  LABEL_MAX,
  NOTE_MAX,
  PAGE_TITLE_MAX,
  PAGE_URL_MAX,
  SOURCE_MAX_PER_RECORD,
  SOURCE_TITLE_MAX,
  SOURCE_URL_MAX,
} from '../limits.js';
import { isAddress } from 'viem';
import { z } from 'zod';

const httpUrlSchema = z
  .string()
  .max(SOURCE_URL_MAX, { message: `URL must be ${SOURCE_URL_MAX} characters or fewer` })
  .refine(
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

const sourcesInputArraySchema = z
  .array(
    z.object({
      url: httpUrlSchema,
      title: z.string().max(SOURCE_TITLE_MAX).default(''),
    }),
  )
  .max(SOURCE_MAX_PER_RECORD, {
    message: `A record may have at most ${SOURCE_MAX_PER_RECORD} sources`,
  });

const keysPayloadSchema = z.object({
  keys: z.array(z.string().regex(/^eip155:(1|8453):0x[0-9a-f]{40}$/)).max(ACCOUNT_KEYS_MAX, {
    message: `At most ${ACCOUNT_KEYS_MAX} account keys per request`,
  }),
});

/**
 * Runtime validation schemas for TraceMemo domain objects.
 *
 * Enforces the field rules from docs/02-TECHNICAL-ARCHITECTURE.md section 6.3
 * and the input limits from the message security matrix. The background
 * regenerates system fields (key, timestamps, source ids), so client DTOs
 * never carry them.
 */
export const confidenceSchema = z.enum(['confirmed', 'likely', 'unverified']);

export const chainIdSchema = z.union([z.literal(1), z.literal(8453)]);

export const isoTimestampSchema = z.string().datetime({ offset: true, message: 'Expected an ISO 8601 timestamp' });

export const evmAddressSchema = z
  .string()
  .refine(v => isAddress(v, { strict: false }), { message: 'Invalid EVM address' });

export const accountKeySchema = z
  .string()
  .regex(/^eip155:(1|8453):0x[0-9a-f]{40}$/, { message: 'Invalid account key' });

/** Full persisted source (with background-generated id and createdAt). */
export const researchSourceSchema = z.object({
  id: z.string().min(1),
  url: httpUrlSchema,
  title: z.string().max(SOURCE_TITLE_MAX),
  createdAt: isoTimestampSchema,
});

/** Source authored by the UI (no id, no createdAt). */
export const sourceInputSchema = z.object({
  url: httpUrlSchema,
  title: z.string().max(SOURCE_TITLE_MAX).default(''),
});

export const addressRecordSchema = z.object({
  key: accountKeySchema,
  chainId: chainIdSchema,
  address: evmAddressSchema,
  label: z.string().min(1).max(LABEL_MAX),
  note: z.string().max(NOTE_MAX),
  confidence: confidenceSchema,
  sources: z.array(researchSourceSchema).max(SOURCE_MAX_PER_RECORD),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});

/** Create DTO: address + chainId + editable fields. No key, no timestamps. */
export const recordCreateInputSchema = z.object({
  chainId: chainIdSchema,
  address: evmAddressSchema,
  label: z.string().min(1).max(LABEL_MAX),
  note: z.string().max(NOTE_MAX).default(''),
  confidence: confidenceSchema,
  sources: sourcesInputArraySchema.default([]),
});

/** Update DTO: key + editable fields. Address/chain are immutable. */
export const recordUpdateInputSchema = z.object({
  key: accountKeySchema,
  label: z.string().min(1).max(LABEL_MAX),
  note: z.string().max(NOTE_MAX).default(''),
  confidence: confidenceSchema,
  sources: sourcesInputArraySchema.default([]),
});

/** Strict export envelope; every record must be valid (all-or-nothing import). */
export const traceMemoExportSchema = z.object({
  format: z.literal('tracememo'),
  version: z.literal(1),
  exportedAt: isoTimestampSchema,
  records: z.array(addressRecordSchema),
});

export const traceMemoImportPayloadSchema = z.object({
  data: traceMemoExportSchema,
});

export const settingsSchema = z.object({
  annotationsEnabled: z.boolean(),
  onboardingSeen: z.boolean(),
});

export const pageContextSchema = z.object({
  tabUrl: z.string().max(PAGE_URL_MAX),
  pageTitle: z.string().max(PAGE_TITLE_MAX),
  site: z.enum(['etherscan', 'basescan']),
  chainId: chainIdSchema,
  accountKeys: z.array(accountKeySchema).max(ACCOUNT_KEYS_MAX),
  observedAt: isoTimestampSchema,
});

/** Discriminated-union schema for every cross-context request message. */
export const requestMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('PAGE_CONTEXT_SET'), payload: pageContextSchema }),
  z.object({ type: z.literal('PAGE_CONTEXT_GET'), payload: z.object({ tabId: z.number().int().nonnegative() }) }),
  z.object({ type: z.literal('RECORDS_GET_MANY'), payload: keysPayloadSchema }),
  z.object({ type: z.literal('RECORD_LIST') }),
  z.object({ type: z.literal('RECORD_GET'), payload: z.object({ key: accountKeySchema }) }),
  z.object({ type: z.literal('RECORD_CREATE'), payload: recordCreateInputSchema }),
  z.object({ type: z.literal('RECORD_UPDATE'), payload: recordUpdateInputSchema }),
  z.object({ type: z.literal('RECORD_DELETE'), payload: z.object({ key: accountKeySchema }) }),
  z.object({ type: z.literal('DATA_EXPORT') }),
  z.object({ type: z.literal('DATA_IMPORT'), payload: traceMemoImportPayloadSchema }),
  z.object({ type: z.literal('DATA_IMPORT_PREVIEW'), payload: traceMemoImportPayloadSchema }),
  z.object({ type: z.literal('DATA_CLEAR') }),
  z.object({ type: z.literal('SETTINGS_GET') }),
  z.object({ type: z.literal('SETTINGS_UPDATE'), payload: settingsSchema.partial() }),
  z.object({ type: z.literal('OPEN_RECORD'), payload: z.object({ key: accountKeySchema }) }),
]);
