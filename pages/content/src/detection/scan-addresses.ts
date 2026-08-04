import { ADDRESS_REGEX, ADDRESS_TEST } from './normalize-address.js';
import { isEvmAddress } from '@extension/shared';
import type { EvmAddress } from '@extension/shared';

/**
 * DOM elements whose text content must never be scanned or annotated.
 * Includes editable fields, code, and TraceMemo-owned nodes.
 */
const EXCLUDED_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'TEXTAREA',
  'INPUT',
  'CODE',
  'SELECT',
  'NOSCRIPT',
  'OBJECT',
  'TEMPLATE',
]);

const DATA_ATTR = 'data-tracememo';

/** True if the node sits inside a region the adapter must skip. */
export const isExcludedNode = (node: Node | null): boolean => {
  let current: Node | null = node;
  while (current && current !== document.body?.parentNode) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const element = current as Element;
      if (EXCLUDED_TAGS.has(element.tagName)) return true;
      if (element instanceof HTMLElement && (element.isContentEditable || element.hasAttribute('contenteditable'))) {
        return true;
      }
      if (element.closest?.(`[${DATA_ATTR}]`)) return true;
    }
    current = current.parentNode;
  }
  return false;
};

/**
 * Scan a DOM subtree for unique, valid EVM addresses.
 *
 * Inspects text nodes and `a[href]` values. Deduplicates by canonical key and
 * caps the result at `cap` entries. Excluded regions are pruned.
 */
export const scanAddresses = (root: Node, cap = 500): EvmAddress[] => {
  const seen = new Set<string>();
  const addresses: EvmAddress[] = [];

  const add = (candidate: string): void => {
    if (!isEvmAddress(candidate)) return;
    // Detection is chain-agnostic; dedup by lowercase address. The orchestrator
    // combines this address with the page's chain id to form the account key.
    const dedupKey = candidate.toLowerCase();
    if (seen.has(dedupKey)) return;
    seen.add(dedupKey);
    addresses.push(candidate as EvmAddress);
    if (addresses.length >= cap) return;
  };

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const text = node.nodeValue ?? '';
      if (!text || !ADDRESS_TEST.test(text)) return NodeFilter.FILTER_REJECT;
      if (isExcludedNode(node)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let current: Node | null;
  while ((current = walker.nextNode())) {
    const text = current.nodeValue ?? '';
    for (const match of text.matchAll(ADDRESS_REGEX)) {
      add(match[0]);
      if (addresses.length >= cap) return addresses;
    }
  }

  const rootElement = root.nodeType === Node.ELEMENT_NODE ? (root as Element) : (root as Document).body;
  if (rootElement?.querySelectorAll) {
    for (const anchor of Array.from(rootElement.querySelectorAll('a[href]'))) {
      const href = anchor.getAttribute('href') ?? '';
      for (const match of href.matchAll(ADDRESS_REGEX)) {
        add(match[0]);
        if (addresses.length >= cap) return addresses;
      }
    }
  }

  return addresses;
};
