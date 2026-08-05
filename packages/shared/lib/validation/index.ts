import { MAX_CHAIN_CONTEXTS, SUPPORTED_CHAIN_IDS, SUPPORTED_SITE_IDS } from '../domain/chains.js';
import {
  ACCOUNT_KEYS_MAX,
  LABEL_MAX,
  NOTE_MAX,
  PAGE_TITLE_MAX,
  PAGE_URL_MAX,
  SOURCE_MAX_PER_RECORD,
  SOURCE_TITLE_MAX,
  SOURCE_URL_MAX,
  TAGS_MAX,
  TAG_MAX_LENGTH,
} from '../limits.js';
import { isAddress } from 'viem';
import { z } from 'zod';
import type { SiteId, SupportedChainId } from '../domain/types.js';

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
  keys: z.array(z.string().regex(/^evm:0x[0-9a-f]{40}$/)).max(ACCOUNT_KEYS_MAX, {
    message: `At most ${ACCOUNT_KEYS_MAX} address keys per request`,
  }),
});

const tagsSchema = z
  .array(z.string().min(1).max(TAG_MAX_LENGTH))
  .max(TAGS_MAX, { message: `A record may have at most ${TAGS_MAX} tags` });

/**
 * Runtime validation schemas for TraceMemo domain objects.
 *
 * Enforces the field rules from docs/02-TECHNICAL-ARCHITECTURE.md section 6.3
 * and the input limits from the message security matrix. The background
 * regenerates system fields (key, timestamps, source ids), so client DTOs
 * never carry them.
 */
export const confidenceSchema = z.enum(['confirmed', 'likely', 'unverified']);

export const chainIdSchema = z.custom<SupportedChainId>(
  value => typeof value === 'number' && (SUPPORTED_CHAIN_IDS as readonly number[]).includes(value),
  { message: 'Unsupported chain id' },
);

export const isoTimestampSchema = z.string().datetime({ offset: true, message: 'Expected an ISO 8601 timestamp' });

export const evmAddressSchema = z
  .string()
  .refine(v => isAddress(v, { strict: false }), { message: 'Invalid EVM address' });

export const addressKeySchema = z.string().regex(/^evm:0x[0-9a-f]{40}$/, { message: 'Invalid address key' });

/** Full persisted source (with background-generated id and createdAt). */
export const researchSourceSchema = z.object({
  id: z.string().min(1),
  url: httpUrlSchema,
  title: z.string().max(SOURCE_TITLE_MAX),
  createdAt: isoTimestampSchema,
});

/** Per-chain context (chain-level note, confidence, sources - never shared). */
export const chainContextSchema = z.object({
  chainId: chainIdSchema,
  note: z.string().max(NOTE_MAX),
  confidence: confidenceSchema,
  sources: z.array(researchSourceSchema).max(SOURCE_MAX_PER_RECORD),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});

/** One global record per address. */
export const addressRecordSchema = z.object({
  key: addressKeySchema,
  address: evmAddressSchema,
  label: z.string().min(1).max(LABEL_MAX),
  tags: tagsSchema,
  note: z.string().max(NOTE_MAX),
  chains: z.array(chainContextSchema).max(MAX_CHAIN_CONTEXTS),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});

/** Source authored by the UI (no id, no createdAt). */
export const sourceInputSchema = z.object({
  url: httpUrlSchema,
  title: z.string().max(SOURCE_TITLE_MAX).default(''),
});

/** Create DTO: address + first chain context + global fields. */
export const recordCreateInputSchema = z.object({
  address: evmAddressSchema,
  chainId: chainIdSchema,
  label: z.string().min(1).max(LABEL_MAX),
  tags: tagsSchema.default([]),
  note: z.string().max(NOTE_MAX).default(''),
  chainNote: z.string().max(NOTE_MAX).default(''),
  confidence: confidenceSchema,
  sources: sourcesInputArraySchema.default([]),
});

/** Update DTO: global fields + upsert one chain context (by chainId). */
export const recordUpdateInputSchema = z.object({
  key: addressKeySchema,
  chainId: chainIdSchema,
  label: z.string().min(1).max(LABEL_MAX),
  tags: tagsSchema.default([]),
  note: z.string().max(NOTE_MAX).default(''),
  chainNote: z.string().max(NOTE_MAX).default(''),
  confidence: confidenceSchema,
  sources: sourcesInputArraySchema.default([]),
});

/** Strict export envelope; every record must be valid (all-or-nothing import).
 * Version 2 is the global-record + per-chain-context model. Version 1 (per-chain
 * records) is rejected. */
export const traceMemoExportSchema = z.object({
  format: z.literal('tracememo'),
  version: z.literal(2),
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
  site: z.enum(SUPPORTED_SITE_IDS as [SiteId, ...SiteId[]]),
  chainId: chainIdSchema,
  addressKeys: z.array(addressKeySchema).max(ACCOUNT_KEYS_MAX),
  observedAt: isoTimestampSchema,
});

/** Discriminated-union schema for every cross-context request message. */
export const requestMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('PAGE_CONTEXT_SET'), payload: pageContextSchema }),
  z.object({ type: z.literal('PAGE_CONTEXT_GET'), payload: z.object({ tabId: z.number().int().nonnegative() }) }),
  z.object({ type: z.literal('RECORDS_GET_MANY'), payload: keysPayloadSchema }),
  z.object({ type: z.literal('RECORD_LIST') }),
  z.object({ type: z.literal('RECORD_GET'), payload: z.object({ key: addressKeySchema }) }),
  z.object({ type: z.literal('RECORD_CREATE'), payload: recordCreateInputSchema }),
  z.object({ type: z.literal('RECORD_UPDATE'), payload: recordUpdateInputSchema }),
  z.object({ type: z.literal('RECORD_DELETE'), payload: z.object({ key: addressKeySchema }) }),
  z.object({ type: z.literal('DATA_EXPORT') }),
  z.object({ type: z.literal('DATA_IMPORT'), payload: traceMemoImportPayloadSchema }),
  z.object({ type: z.literal('DATA_IMPORT_PREVIEW'), payload: traceMemoImportPayloadSchema }),
  z.object({ type: z.literal('DATA_CLEAR') }),
  z.object({ type: z.literal('SETTINGS_GET') }),
  z.object({ type: z.literal('SETTINGS_UPDATE'), payload: settingsSchema.partial() }),
  z.object({ type: z.literal('OPEN_RECORD'), payload: z.object({ key: addressKeySchema, chainId: chainIdSchema }) }),
]);
