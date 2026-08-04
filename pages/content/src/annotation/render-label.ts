import { ADDRESS_REGEX, ADDRESS_TEST } from '../detection/normalize-address.js';
import { isExcludedNode } from '../detection/scan-addresses.js';
import { toAccountKey } from '@extension/shared';
import type { AccountKey, AddressRecord, SupportedChainId } from '@extension/shared';

const DATA_ATTR = 'data-tracememo';

interface AnnotationContext {
  /** Chain id for the current page; combined with an address to form the key. */
  chainId: SupportedChainId;
  /** Returns the saved record for a canonical account key, if one exists. */
  hasRecord: (key: AccountKey) => AddressRecord | undefined;
  /** Called when the user activates an annotation. */
  onOpen: (key: AccountKey) => void;
}

const BADGE_STYLE =
  'display:inline-flex;align-items:center;gap:2px;margin:0 2px 0 4px;padding:1px 5px;border-radius:4px;' +
  'background:#eef2ff;color:#3730a3;font-size:11px;font-weight:600;line-height:1.4;border:1px solid #c7d2fe;' +
  'vertical-align:middle;cursor:pointer;';

const CUE_STYLE = 'font-weight:400;color:#6366f1;font-size:10px;';

const createBadge = (record: AddressRecord, onOpen: (key: AccountKey) => void): HTMLElement => {
  const badge = document.createElement('span');
  badge.setAttribute(DATA_ATTR, 'annotation');
  badge.setAttribute('role', 'button');
  badge.setAttribute('tabindex', '0');
  badge.setAttribute(
    'aria-label',
    `TraceMemo private label: ${record.label}. Address: ${record.address} on chain ${record.chainId}. Activate to open the record.`,
  );
  badge.style.cssText = BADGE_STYLE;
  badge.textContent = record.label;

  const cue = document.createElement('span');
  cue.setAttribute(DATA_ATTR, 'cue');
  cue.style.cssText = CUE_STYLE;
  cue.textContent = '· private';
  badge.appendChild(cue);

  // The badge opens the record on the SAME chain as the page; never crosses to
  // the other chain's record for the same address.
  const open = (): void => onOpen(toAccountKey(record.chainId, record.address));
  badge.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    open();
  });
  badge.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      open();
    }
  });

  return badge;
};

/**
 * Render a private badge next to every visible occurrence of an address that
 * has a saved record ON THE CURRENT CHAIN.
 *
 * Idempotent: record-matched occurrences are wrapped in a TraceMemo-owned span
 * (excluded from rescans) so they are never annotated twice. Occurrences
 * without a record are left as plain text so they can be annotated later. The
 * original address text is never replaced or hidden.
 *
 * Returns the number of badges inserted.
 */
export const renderAnnotations = (root: Node, context: AnnotationContext): number => {
  let inserted = 0;

  const targets: Text[] = [];
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
    targets.push(current as Text);
  }

  for (const textNode of targets) {
    const text = textNode.nodeValue ?? '';
    const parent = textNode.parentNode;
    if (!parent) continue;

    const matches = [...text.matchAll(ADDRESS_REGEX)];
    const matchesWithRecord = matches.filter(match => context.hasRecord(toAccountKey(context.chainId, match[0])));
    if (matchesWithRecord.length === 0) continue;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    for (const match of matches) {
      const start = match.index ?? 0;
      const end = start + match[0].length;
      const key = toAccountKey(context.chainId, match[0]);
      const record = context.hasRecord(key);

      fragment.appendChild(document.createTextNode(text.slice(lastIndex, start)));

      if (record) {
        const wrapper = document.createElement('span');
        wrapper.setAttribute(DATA_ATTR, 'address');
        wrapper.textContent = match[0];
        fragment.appendChild(wrapper);
        fragment.appendChild(createBadge(record, context.onOpen));
        inserted += 1;
      } else {
        fragment.appendChild(document.createTextNode(match[0]));
      }

      lastIndex = end;
    }

    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    parent.replaceChild(fragment, textNode);
  }

  return inserted;
};
