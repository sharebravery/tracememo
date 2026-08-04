import {
  addressKeySchema,
  addressRecordInputSchema,
  addressRecordSchema,
  confidenceSchema,
  requestMessageSchema,
  settingsSchema,
  traceMemoExportSchema,
} from './index.js';
import { describe, expect, it } from 'vitest';

const VALID_ADDRESS = '0x52908400098527886E0F7030069857D03E024880';

const validInput = {
  address: VALID_ADDRESS,
  label: 'Vitalik wallet',
  note: 'Primary public wallet',
  confidence: 'likely',
  sources: [
    {
      id: 'src-1',
      url: 'https://etherscan.io/address/0x...',
      title: 'Etherscan',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ],
};

describe('confidenceSchema', () => {
  it('accepts the three allowed values', () => {
    expect(confidenceSchema.parse('confirmed')).toBe('confirmed');
    expect(confidenceSchema.parse('likely')).toBe('likely');
    expect(confidenceSchema.parse('unverified')).toBe('unverified');
  });

  it('rejects an unknown confidence', () => {
    expect(() => confidenceSchema.parse('certain')).toThrow();
  });
});

describe('addressRecordInputSchema', () => {
  it('accepts a valid input and defaults note/sources', () => {
    const { address, label } = validInput;
    const parsed = addressRecordInputSchema.parse({ address, label, confidence: 'unverified' });
    expect(parsed.note).toBe('');
    expect(parsed.sources).toEqual([]);
  });

  it('accepts a full valid input', () => {
    expect(addressRecordInputSchema.parse(validInput).label).toBe('Vitalik wallet');
  });

  it('rejects an invalid address', () => {
    expect(() => addressRecordInputSchema.parse({ ...validInput, address: '0x123' })).toThrow();
  });

  it('rejects an empty label', () => {
    expect(() => addressRecordInputSchema.parse({ ...validInput, label: '' })).toThrow();
  });

  it('rejects a label longer than 60 characters', () => {
    expect(() => addressRecordInputSchema.parse({ ...validInput, label: 'x'.repeat(61) })).toThrow();
  });

  it('accepts a label of exactly 60 characters', () => {
    expect(addressRecordInputSchema.parse({ ...validInput, label: 'x'.repeat(60) }).label.length).toBe(60);
  });

  it('rejects a note longer than 2,000 characters', () => {
    expect(() => addressRecordInputSchema.parse({ ...validInput, note: 'x'.repeat(2001) })).toThrow();
  });

  it('rejects a source URL that is not http/https', () => {
    const bad = { ...validInput, sources: [{ ...validInput.sources[0], url: 'ftp://example.com' }] };
    expect(() => addressRecordInputSchema.parse(bad)).toThrow();
  });

  it('rejects a malformed source URL', () => {
    const bad = { ...validInput, sources: [{ ...validInput.sources[0], url: 'not a url' }] };
    expect(() => addressRecordInputSchema.parse(bad)).toThrow();
  });

  it('rejects a source title longer than 300 characters', () => {
    const bad = { ...validInput, sources: [{ ...validInput.sources[0], title: 'x'.repeat(301) }] };
    expect(() => addressRecordInputSchema.parse(bad)).toThrow();
  });
});

describe('addressRecordSchema', () => {
  const validRecord = {
    key: 'evm:0x52908400098527886e0f7030069857d03e024880',
    address: VALID_ADDRESS,
    label: 'Test',
    note: '',
    confidence: 'unverified',
    sources: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  it('accepts a valid record', () => {
    expect(addressRecordSchema.parse(validRecord).key).toBe(validRecord.key);
  });

  it('rejects a key that does not match the canonical form', () => {
    expect(() => addressRecordSchema.parse({ ...validRecord, key: 'evm:not-a-key' })).toThrow();
  });

  it('rejects a key with uppercase hex', () => {
    expect(() =>
      addressRecordSchema.parse({ ...validRecord, key: 'evm:0x52908400098527886E0F7030069857D03E024880' }),
    ).toThrow();
  });
});

describe('addressKeySchema', () => {
  it('accepts the canonical lowercase key', () => {
    expect(addressKeySchema.parse('evm:0x' + 'a'.repeat(40))).toBe('evm:0x' + 'a'.repeat(40));
  });

  it('rejects uppercase hex in the key', () => {
    expect(() => addressKeySchema.parse('evm:0x' + 'A'.repeat(40))).toThrow();
  });
});

describe('traceMemoExportSchema', () => {
  it('accepts a valid envelope', () => {
    const envelope = {
      format: 'tracememo',
      version: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      records: [],
    };
    expect(traceMemoExportSchema.parse(envelope).format).toBe('tracememo');
  });

  it('rejects an unsupported version', () => {
    expect(() =>
      traceMemoExportSchema.parse({
        format: 'tracememo',
        version: 2,
        exportedAt: '2026-01-01T00:00:00.000Z',
        records: [],
      }),
    ).toThrow();
  });

  it('rejects an unsupported format', () => {
    expect(() =>
      traceMemoExportSchema.parse({ format: 'other', version: 1, exportedAt: '2026-01-01T00:00:00.000Z', records: [] }),
    ).toThrow();
  });
});

describe('settingsSchema', () => {
  it('accepts the settings shape', () => {
    expect(settingsSchema.parse({ annotationsEnabled: true, onboardingSeen: false })).toEqual({
      annotationsEnabled: true,
      onboardingSeen: false,
    });
  });

  it('accepts a partial via .partial()', () => {
    expect(settingsSchema.partial().parse({ annotationsEnabled: false })).toEqual({ annotationsEnabled: false });
  });
});

describe('requestMessageSchema', () => {
  it('validates a RECORD_UPSERT request', () => {
    const parsed = requestMessageSchema.parse({ type: 'RECORD_UPSERT', payload: validInput });
    expect(parsed.type).toBe('RECORD_UPSERT');
  });

  it('validates a RECORD_DELETE request', () => {
    const parsed = requestMessageSchema.parse({
      type: 'RECORD_DELETE',
      payload: { key: 'evm:0x' + 'a'.repeat(40) },
    });
    expect(parsed.type).toBe('RECORD_DELETE');
  });

  it('rejects an unknown request type', () => {
    expect(() => requestMessageSchema.parse({ type: 'UNKNOWN' })).toThrow();
  });

  it('rejects a RECORD_UPSERT with an invalid payload', () => {
    expect(() => requestMessageSchema.parse({ type: 'RECORD_UPSERT', payload: { address: 'bad' } })).toThrow();
  });
});
