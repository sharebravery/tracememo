// @vitest-environment jsdom
import { removeAnnotations } from './remove-labels.js';
import { renderAnnotations } from './render-label.js';
import { beforeEach, describe, expect, it } from 'vitest';
import type { AddressKey, AddressRecord } from '@extension/shared';

const ADDR_A = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
const KEY_A: AddressKey = 'evm:0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed';

const makeRecord = (overrides: Partial<AddressRecord> = {}): AddressRecord => ({
  key: KEY_A,
  address: ADDR_A,
  label: 'Vitalik',
  tags: [],
  note: '',
  chains: [
    {
      chainId: 1,
      note: '',
      confidence: 'confirmed',
      sources: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('renderAnnotations', () => {
  it('inserts a badge with the shared global label without replacing the address', () => {
    document.body.innerHTML = `<div>From ${ADDR_A} to somewhere</div>`;
    const inserted = renderAnnotations(document.body, { hasRecord: () => makeRecord(), onOpen: () => {} });
    expect(inserted).toBe(1);
    expect(document.body.textContent).toContain(ADDR_A);
    const badge = document.body.querySelector('[data-tracememo="annotation"]');
    expect(badge?.textContent).toContain('Vitalik');
    expect(badge?.textContent).toContain('private');
  });

  it('does not annotate addresses without a record', () => {
    document.body.innerHTML = `<div>${ADDR_A}</div>`;
    expect(renderAnnotations(document.body, { hasRecord: () => undefined, onOpen: () => {} })).toBe(0);
  });

  it('is idempotent on repeated calls', () => {
    document.body.innerHTML = `<div>${ADDR_A}</div>`;
    const context = { hasRecord: () => makeRecord(), onOpen: () => {} };
    renderAnnotations(document.body, context);
    expect(renderAnnotations(document.body, context)).toBe(0);
    expect(document.body.querySelectorAll('[data-tracememo="annotation"]')).toHaveLength(1);
  });

  it('annotates a dynamically inserted row on rescan', () => {
    document.body.innerHTML = `<div>${ADDR_A}</div>`;
    const context = { hasRecord: () => makeRecord(), onOpen: () => {} };
    renderAnnotations(document.body, context);
    const row = document.createElement('div');
    row.textContent = `transfer ${ADDR_A}`;
    document.body.appendChild(row);
    expect(renderAnnotations(document.body, context)).toBe(1);
  });

  it('calls onOpen with the global address key when clicked', () => {
    document.body.innerHTML = `<div>${ADDR_A}</div>`;
    let opened: AddressKey | undefined;
    renderAnnotations(document.body, { hasRecord: () => makeRecord(), onOpen: key => (opened = key) });
    const badge = document.body.querySelector('[data-tracememo="annotation"]') as HTMLElement;
    badge.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(opened).toBe(KEY_A);
  });
});

describe('removeAnnotations', () => {
  it('removes badges and restores the original address text', () => {
    document.body.innerHTML = `<div>${ADDR_A}</div>`;
    renderAnnotations(document.body, { hasRecord: () => makeRecord(), onOpen: () => {} });
    removeAnnotations(document.body);
    expect(document.body.querySelector('[data-tracememo]')).toBeNull();
    expect(document.body.textContent).toContain(ADDR_A);
  });
});
