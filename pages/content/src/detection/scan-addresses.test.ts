// @vitest-environment jsdom
import { scanAddresses } from './scan-addresses.js';
import { beforeEach, describe, expect, it } from 'vitest';

const ADDR_A = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
const ADDR_B = '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359';

const validAddress = (i: number) => `0x${i.toString(16).padStart(40, '0')}`;

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('scanAddresses', () => {
  it('detects addresses in text nodes', () => {
    document.body.innerHTML = `<div>From ${ADDR_A} to somewhere</div>`;
    expect(scanAddresses(document.body).map(a => a.toLowerCase())).toEqual([ADDR_A.toLowerCase()]);
  });

  it('detects addresses in href values', () => {
    document.body.innerHTML = `<a href="/address/${ADDR_B}">view</a>`;
    expect(scanAddresses(document.body).map(a => a.toLowerCase())).toEqual([ADDR_B.toLowerCase()]);
  });

  it('deduplicates by canonical key', () => {
    document.body.innerHTML = `<div>${ADDR_A} again ${ADDR_A} and ${ADDR_A.toLowerCase()}</div>`;
    expect(scanAddresses(document.body)).toHaveLength(1);
  });

  it('ignores malformed and truncated addresses', () => {
    document.body.innerHTML = `<div>0x123 ${ADDR_A} 0x${'a'.repeat(38)} 0x${'z'.repeat(40)}</div>`;
    expect(scanAddresses(document.body)).toHaveLength(1);
  });

  it('ignores addresses inside script, style, textarea, input, and code', () => {
    document.body.innerHTML = `
      <script>${ADDR_A}</script>
      <style>${ADDR_A}</style>
      <textarea>${ADDR_A}</textarea>
      <input value="${ADDR_A}" />
      <code>${ADDR_A}</code>
      <noscript>${ADDR_A}</noscript>
    `;
    expect(scanAddresses(document.body)).toEqual([]);
  });

  it('ignores contenteditable regions', () => {
    document.body.innerHTML = `<div contenteditable="true">${ADDR_A}</div>`;
    expect(scanAddresses(document.body)).toEqual([]);
  });

  it('ignores TraceMemo-owned nodes', () => {
    document.body.innerHTML = `<div data-tracememo="address">${ADDR_A}</div>`;
    expect(scanAddresses(document.body)).toEqual([]);
  });

  it('caps the result at the given limit', () => {
    document.body.innerHTML = Array.from({ length: 10 }, (_, i) => `<span>${validAddress(i)}</span>`).join('');
    expect(scanAddresses(document.body, 3)).toHaveLength(3);
  });

  it('combines text and href matches with deduplication', () => {
    document.body.innerHTML = `<div>${ADDR_A}</div><a href="/address/${ADDR_A}">link</a><a href="/address/${ADDR_B}">b</a>`;
    expect(scanAddresses(document.body)).toHaveLength(2);
  });

  it('returns an empty array for a page with no addresses', () => {
    document.body.innerHTML = '<div>no addresses here</div>';
    expect(scanAddresses(document.body)).toEqual([]);
  });
});
