import {
  addressKeySchema,
  addressRecordSchema,
  chainIdSchema,
  confidenceSchema,
  recordCreateInputSchema,
  recordUpdateInputSchema,
  requestMessageSchema,
  settingsSchema,
  sourceInputSchema,
  traceMemoExportSchema,
} from './index.js';
import { describe, expect, it } from 'vitest';

const ADDR = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
const KEY = 'evm:0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed';

const validCreate = {
  address: ADDR,
  chainId: 1,
  label: 'Vitalik wallet',
  tags: ['wallet', 'public'],
  note: 'Global note',
  chainNote: 'Ethereum note',
  confidence: 'likely',
  sources: [{ url: 'https://etherscan.io/address/0xvitalik', title: 'Etherscan' }],
};

const validRecord = {
  key: KEY,
  address: ADDR,
  label: 'Test',
  tags: [],
  note: '',
  chains: [
    {
      chainId: 1,
      note: '',
      confidence: 'unverified',
      sources: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('confidenceSchema / chainIdSchema / sourceInputSchema', () => {
  it('validates confidence and chain id', () => {
    expect(confidenceSchema.parse('confirmed')).toBe('confirmed');
    expect(chainIdSchema.parse(1)).toBe(1);
    expect(chainIdSchema.parse(8453)).toBe(8453);
    expect(chainIdSchema.parse(137)).toBe(137);
  });

  it('rejects non-http source URLs', () => {
    expect(() => sourceInputSchema.parse({ url: 'ftp://example.com', title: 'x' })).toThrow();
  });
});

describe('recordCreateInputSchema', () => {
  it('accepts a valid create input and defaults optional fields', () => {
    const parsed = recordCreateInputSchema.parse({ address: ADDR, chainId: 1, label: 'L', confidence: 'unverified' });
    expect(parsed.tags).toEqual([]);
    expect(parsed.note).toBe('');
    expect(parsed.chainNote).toBe('');
    expect(parsed.sources).toEqual([]);
  });

  it('rejects an invalid address, empty label, and over-long note', () => {
    expect(() => recordCreateInputSchema.parse({ ...validCreate, address: '0x123' })).toThrow();
    expect(() => recordCreateInputSchema.parse({ ...validCreate, label: '' })).toThrow();
    expect(() => recordCreateInputSchema.parse({ ...validCreate, note: 'x'.repeat(2001) })).toThrow();
  });

  it('caps tags at 20', () => {
    expect(() =>
      recordCreateInputSchema.parse({ ...validCreate, tags: Array.from({ length: 21 }, (_, i) => `t${i}`) }),
    ).toThrow();
  });
});

describe('recordUpdateInputSchema', () => {
  it('accepts a valid update input', () => {
    const parsed = recordUpdateInputSchema.parse({ key: KEY, chainId: 8453, label: 'L', confidence: 'confirmed' });
    expect(parsed.chainNote).toBe('');
  });

  it('rejects an invalid key', () => {
    expect(() =>
      recordUpdateInputSchema.parse({
        key: 'eip155:1:0x' + 'a'.repeat(40),
        chainId: 1,
        label: 'L',
        confidence: 'confirmed',
      }),
    ).toThrow();
  });
});

describe('addressRecordSchema', () => {
  it('accepts a valid global record with chain contexts', () => {
    expect(addressRecordSchema.parse(validRecord).key).toBe(KEY);
  });

  it('allows up to two chain contexts (Ethereum and Base)', () => {
    const both = {
      ...validRecord,
      chains: [
        {
          chainId: 1,
          note: '',
          confidence: 'confirmed',
          sources: [],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          chainId: 8453,
          note: '',
          confidence: 'likely',
          sources: [],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    };
    expect(addressRecordSchema.parse(both).chains).toHaveLength(2);
  });

  it('rejects more than four chain contexts', () => {
    const five = {
      ...validRecord,
      chains: [
        {
          chainId: 1,
          note: '',
          confidence: 'unverified',
          sources: [],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          chainId: 8453,
          note: '',
          confidence: 'unverified',
          sources: [],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          chainId: 137,
          note: '',
          confidence: 'unverified',
          sources: [],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          chainId: 56,
          note: '',
          confidence: 'unverified',
          sources: [],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          chainId: 1,
          note: '',
          confidence: 'unverified',
          sources: [],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    };
    expect(() => addressRecordSchema.parse(five)).toThrow();
  });

  it('rejects a chain-aware key', () => {
    expect(() => addressRecordSchema.parse({ ...validRecord, key: 'eip155:1:0x' + 'a'.repeat(40) })).toThrow();
  });
});

describe('addressKeySchema', () => {
  it('rejects chain-aware keys and uppercase hex', () => {
    expect(() => addressKeySchema.parse('eip155:1:0x' + 'a'.repeat(40))).toThrow();
    expect(() => addressKeySchema.parse('evm:0x' + 'A'.repeat(40))).toThrow();
  });
});

describe('traceMemoExportSchema (all-or-nothing)', () => {
  it('rejects the whole envelope when any record is invalid', () => {
    const bad = { ...validRecord, key: 'eip155:1:0x' + 'a'.repeat(40) };
    expect(() =>
      traceMemoExportSchema.parse({
        format: 'tracememo',
        version: 2,
        exportedAt: '2026-01-01T00:00:00.000Z',
        records: [validRecord, bad],
      }),
    ).toThrow();
  });

  it('rejects a version-1 (old per-chain model) export without partial parsing', () => {
    expect(() =>
      traceMemoExportSchema.parse({
        format: 'tracememo',
        version: 1,
        exportedAt: '2026-01-01T00:00:00.000Z',
        records: [],
      }),
    ).toThrow();
  });
});

describe('settingsSchema', () => {
  it('accepts the settings shape and a partial', () => {
    expect(settingsSchema.partial().parse({ annotationsEnabled: false })).toEqual({ annotationsEnabled: false });
  });
});

describe('requestMessageSchema', () => {
  it('validates RECORD_CREATE, RECORD_UPDATE, OPEN_RECORD', () => {
    expect(requestMessageSchema.parse({ type: 'RECORD_CREATE', payload: validCreate }).type).toBe('RECORD_CREATE');
    expect(
      requestMessageSchema.parse({
        type: 'RECORD_UPDATE',
        payload: { key: KEY, chainId: 1, label: 'L', confidence: 'confirmed' },
      }).type,
    ).toBe('RECORD_UPDATE');
    expect(requestMessageSchema.parse({ type: 'OPEN_RECORD', payload: { key: KEY, chainId: 8453 } }).type).toBe(
      'OPEN_RECORD',
    );
  });

  it('validates PAGE_CONTEXT_GET with a tabId', () => {
    expect(requestMessageSchema.parse({ type: 'PAGE_CONTEXT_GET', payload: { tabId: 7 } }).type).toBe(
      'PAGE_CONTEXT_GET',
    );
  });

  it('caps RECORDS_GET_MANY at 500 keys', () => {
    const keys = Array.from({ length: 501 }, () => KEY);
    expect(() => requestMessageSchema.parse({ type: 'RECORDS_GET_MANY', payload: { keys } })).toThrow();
  });
});
