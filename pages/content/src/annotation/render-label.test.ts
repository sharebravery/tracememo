// @vitest-environment jsdom
import { removeAnnotations } from './remove-labels.js';
import { renderAnnotations } from './render-label.js';
import { beforeEach, describe, expect, it } from 'vitest';
import type { AccountKey, AddressRecord, SupportedChainId } from '@extension/shared';

const ADDR_A = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
const KEY_A_ETH: AccountKey = 'eip155:1:0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed';
const CHAIN: SupportedChainId = 1;

const makeRecord = (overrides: Partial<AddressRecord> = {}): AddressRecord => ({
  key: KEY_A_ETH,
  chainId: 1,
  address: ADDR_A,
  label: 'Vitalik',
  note: '',
  confidence: 'confirmed',
  sources: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('renderAnnotations', () => {
  it('inserts a badge after a matched address without replacing it', () => {
    document.body.innerHTML = `<div>From ${ADDR_A} to somewhere</div>`;
    const inserted = renderAnnotations(document.body, {
      chainId: CHAIN,
      hasRecord: () => makeRecord(),
      onOpen: () => {},
    });

    expect(inserted).toBe(1);
    expect(document.body.textContent).toContain(ADDR_A);
    const badge = document.body.querySelector('[data-tracememo="annotation"]');
    expect(badge).toBeTruthy();
    expect(badge?.textContent).toContain('Vitalik');
    expect(badge?.textContent).toContain('private');
  });

  it('does not annotate addresses without a record', () => {
    document.body.innerHTML = `<div>${ADDR_A}</div>`;
    expect(renderAnnotations(document.body, { chainId: CHAIN, hasRecord: () => undefined, onOpen: () => {} })).toBe(0);
    expect(document.body.querySelector('[data-tracememo]')).toBeNull();
  });

  it('only matches records for the current chain (no cross-chain labels)', () => {
    document.body.innerHTML = `<div>${ADDR_A}</div>`;
    // A Base record for the same address must not annotate an Ethereum page.
    const baseRecord = makeRecord({ key: 'eip155:8453:0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed', chainId: 8453 });
    const hasRecord = (key: AccountKey) => (key === baseRecord.key ? baseRecord : undefined);
    expect(renderAnnotations(document.body, { chainId: 1, hasRecord, onOpen: () => {} })).toBe(0);
  });

  it('is idempotent on repeated calls', () => {
    document.body.innerHTML = `<div>${ADDR_A}</div>`;
    const context = { chainId: CHAIN, hasRecord: () => makeRecord(), onOpen: () => {} };
    renderAnnotations(document.body, context);
    expect(renderAnnotations(document.body, context)).toBe(0);
    expect(document.body.querySelectorAll('[data-tracememo="annotation"]')).toHaveLength(1);
  });

  it('annotates a dynamically inserted row on rescan', () => {
    document.body.innerHTML = `<div>${ADDR_A}</div>`;
    const context = { chainId: CHAIN, hasRecord: () => makeRecord(), onOpen: () => {} };
    renderAnnotations(document.body, context);
    const newRow = document.createElement('div');
    newRow.textContent = `transfer ${ADDR_A}`;
    document.body.appendChild(newRow);
    expect(renderAnnotations(document.body, context)).toBe(1);
  });

  it('calls onOpen with the chain-aware account key when clicked', () => {
    document.body.innerHTML = `<div>${ADDR_A}</div>`;
    let opened: AccountKey | undefined;
    renderAnnotations(document.body, { chainId: CHAIN, hasRecord: () => makeRecord(), onOpen: key => (opened = key) });
    const badge = document.body.querySelector('[data-tracememo="annotation"]') as HTMLElement;
    badge.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(opened).toBe(KEY_A_ETH);
  });
});

describe('removeAnnotations', () => {
  it('removes badges and restores the original address text', () => {
    document.body.innerHTML = `<div>${ADDR_A}</div>`;
    renderAnnotations(document.body, { chainId: CHAIN, hasRecord: () => makeRecord(), onOpen: () => {} });
    removeAnnotations(document.body);
    expect(document.body.querySelector('[data-tracememo]')).toBeNull();
    expect(document.body.textContent).toContain(ADDR_A);
  });
});
