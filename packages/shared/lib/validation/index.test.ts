import {
  accountKeySchema,
  chainIdSchema,
  recordCreateInputSchema,
  recordUpdateInputSchema,
  addressRecordSchema,
  confidenceSchema,
  requestMessageSchema,
  settingsSchema,
  sourceInputSchema,
  traceMemoExportSchema,
} from './index.js';
import { describe, expect, it } from 'vitest';

const ADDR = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
const KEY_ETH = 'eip155:1:0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed';

const validCreate = {
  chainId: 1,
  address: ADDR,
  label: 'Vitalik wallet',
  note: 'Primary public wallet',
  confidence: 'likely',
  sources: [{ url: 'https://etherscan.io/address/0xvitalik', title: 'Etherscan' }],
};

const validRecord = {
  key: KEY_ETH,
  chainId: 1,
  address: ADDR,
  label: 'Test',
  note: '',
  confidence: 'unverified',
  sources: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('confidenceSchema', () => {
  it('accepts the three allowed values and rejects others', () => {
    expect(confidenceSchema.parse('confirmed')).toBe('confirmed');
    expect(() => confidenceSchema.parse('certain')).toThrow();
  });
});

describe('chainIdSchema', () => {
  it('accepts 1 and 8453 only', () => {
    expect(chainIdSchema.parse(1)).toBe(1);
    expect(chainIdSchema.parse(8453)).toBe(8453);
    expect(() => chainIdSchema.parse(137)).toThrow();
  });
});

describe('sourceInputSchema', () => {
  it('rejects a non-http source URL', () => {
    expect(() => sourceInputSchema.parse({ url: 'ftp://example.com', title: 'x' })).toThrow();
  });
});

describe('recordCreateInputSchema', () => {
  it('accepts a valid create input and defaults note/sources', () => {
    const parsed = recordCreateInputSchema.parse({ chainId: 1, address: ADDR, label: 'L', confidence: 'unverified' });
    expect(parsed.note).toBe('');
    expect(parsed.sources).toEqual([]);
  });

  it('rejects an unsupported chain id', () => {
    expect(() => recordCreateInputSchema.parse({ ...validCreate, chainId: 137 })).toThrow();
  });

  it('rejects an invalid address', () => {
    expect(() => recordCreateInputSchema.parse({ ...validCreate, address: '0x123' })).toThrow();
  });

  it('rejects an empty label and an over-long label', () => {
    expect(() => recordCreateInputSchema.parse({ ...validCreate, label: '' })).toThrow();
    expect(() => recordCreateInputSchema.parse({ ...validCreate, label: 'x'.repeat(61) })).toThrow();
  });

  it('rejects a note over 2,000 characters', () => {
    expect(() => recordCreateInputSchema.parse({ ...validCreate, note: 'x'.repeat(2001) })).toThrow();
  });
});

describe('recordUpdateInputSchema', () => {
  it('accepts a valid update input', () => {
    const parsed = recordUpdateInputSchema.parse({ key: KEY_ETH, label: 'L', confidence: 'confirmed' });
    expect(parsed.note).toBe('');
    expect(parsed.sources).toEqual([]);
  });

  it('rejects an invalid key', () => {
    expect(() =>
      recordUpdateInputSchema.parse({ key: 'evm:0x' + 'a'.repeat(40), label: 'L', confidence: 'confirmed' }),
    ).toThrow();
  });
});

describe('addressRecordSchema', () => {
  it('accepts a valid record', () => {
    expect(addressRecordSchema.parse(validRecord).key).toBe(KEY_ETH);
  });

  it('rejects a key with the wrong chain or format', () => {
    expect(() => addressRecordSchema.parse({ ...validRecord, key: 'eip155:137:0x' + 'a'.repeat(40) })).toThrow();
    expect(() => addressRecordSchema.parse({ ...validRecord, key: 'evm:0x' + 'a'.repeat(40) })).toThrow();
  });

  it('requires chainId', () => {
    const noChain = { ...validRecord };
    delete (noChain as { chainId?: number }).chainId;
    expect(() => addressRecordSchema.parse(noChain)).toThrow();
  });
});

describe('accountKeySchema', () => {
  it('rejects uppercase hex and unsupported chains', () => {
    expect(() => accountKeySchema.parse('eip155:1:0x' + 'A'.repeat(40))).toThrow();
    expect(() => accountKeySchema.parse('eip155:137:0x' + 'a'.repeat(40))).toThrow();
  });
});

describe('traceMemoExportSchema (all-or-nothing)', () => {
  it('accepts a valid envelope', () => {
    const envelope = { format: 'tracememo', version: 1, exportedAt: '2026-01-01T00:00:00.000Z', records: [] };
    expect(traceMemoExportSchema.parse(envelope).format).toBe('tracememo');
  });

  it('rejects an unsupported version or format', () => {
    expect(() =>
      traceMemoExportSchema.parse({
        format: 'tracememo',
        version: 2,
        exportedAt: '2026-01-01T00:00:00.000Z',
        records: [],
      }),
    ).toThrow();
    expect(() =>
      traceMemoExportSchema.parse({ format: 'other', version: 1, exportedAt: '2026-01-01T00:00:00.000Z', records: [] }),
    ).toThrow();
  });

  it('rejects the whole envelope when any record is invalid', () => {
    const bad = { ...validRecord, key: 'evm:0x' + 'a'.repeat(40) };
    expect(() =>
      traceMemoExportSchema.parse({
        format: 'tracememo',
        version: 1,
        exportedAt: '2026-01-01T00:00:00.000Z',
        records: [validRecord, bad],
      }),
    ).toThrow();
  });
});

describe('settingsSchema', () => {
  it('accepts the settings shape and a partial', () => {
    expect(settingsSchema.parse({ annotationsEnabled: true, onboardingSeen: false })).toEqual({
      annotationsEnabled: true,
      onboardingSeen: false,
    });
    expect(settingsSchema.partial().parse({ annotationsEnabled: false })).toEqual({ annotationsEnabled: false });
  });
});

describe('requestMessageSchema', () => {
  it('validates RECORD_CREATE and RECORD_UPDATE', () => {
    expect(requestMessageSchema.parse({ type: 'RECORD_CREATE', payload: validCreate }).type).toBe('RECORD_CREATE');
    expect(
      requestMessageSchema.parse({
        type: 'RECORD_UPDATE',
        payload: { key: KEY_ETH, label: 'L', confidence: 'confirmed' },
      }).type,
    ).toBe('RECORD_UPDATE');
  });

  it('validates PAGE_CONTEXT_GET with a tabId', () => {
    expect(requestMessageSchema.parse({ type: 'PAGE_CONTEXT_GET', payload: { tabId: 7 } }).type).toBe(
      'PAGE_CONTEXT_GET',
    );
  });

  it('validates DATA_IMPORT with a {data} payload', () => {
    const envelope = { format: 'tracememo', version: 1, exportedAt: '2026-01-01T00:00:00.000Z', records: [] };
    expect(requestMessageSchema.parse({ type: 'DATA_IMPORT', payload: { data: envelope } }).type).toBe('DATA_IMPORT');
  });

  it('rejects an unknown request type', () => {
    expect(() => requestMessageSchema.parse({ type: 'UNKNOWN' })).toThrow();
  });

  it('caps RECORDS_GET_MANY at 500 keys', () => {
    const keys = Array.from({ length: 501 }, () => KEY_ETH);
    expect(() => requestMessageSchema.parse({ type: 'RECORDS_GET_MANY', payload: { keys } })).toThrow();
  });
});
