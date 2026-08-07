import { ADDRESS_REGEX, ADDRESS_TEST } from '../detection/normalize-address.js';
import { isExcludedNode } from '../detection/scan-addresses.js';
import { t } from '@extension/i18n';
import { toAddressKey, CHAIN_LABELS } from '@extension/shared';
import type { AddressKey, AddressRecord, SupportedChainId } from '@extension/shared';

const DATA_ATTR = 'data-tracememo';

interface AnnotationContext {
  /** Returns the global record for a canonical address key, if one exists. */
  hasRecord: (key: AddressKey) => AddressRecord | undefined;
  /** The chain id of the current page. */
  chainId: SupportedChainId;
  /** Called when the user activates an annotation. */
  onOpen: (key: AddressKey) => void;
}

const BADGE_STYLE =
  'display:inline-flex;align-items:center;gap:3px;margin:0 2px 0 5px;padding:1px 6px;border-radius:4px;' +
  'background:rgba(15,23,42,0.92);color:#c4b5fd;font-size:11px;font-weight:500;line-height:1.3;' +
  'border:1px solid rgba(139,92,246,0.35);vertical-align:middle;cursor:pointer;';

const CUE_STYLE = 'font-weight:400;color:#94a3b8;font-size:9px;';

const CONFIDENCE_KEY: Record<string, string> = {
  confirmed: 'confidence_confirmed',
  likely: 'confidence_likely',
  unverified: 'confidence_unverified',
};

const createBadge = (record: AddressRecord, context: AnnotationContext): HTMLElement => {
  const chainCtx = record.chains.find(c => c.chainId === context.chainId);
  const chainName = CHAIN_LABELS[context.chainId] ?? `Chain ${context.chainId}`;

  // Badge text: "Label · Chain · Confidence" or "Label · No Chain context"
  const confidenceText = chainCtx
    ? t(CONFIDENCE_KEY[chainCtx.confidence] as 'confidence_confirmed')
    : t('badge_no_context' as const, chainName);

  const ariaSuffix = chainCtx ? `${chainName} · ${confidenceText}` : t('badge_no_context' as const, chainName);

  const badge = document.createElement('span');
  badge.setAttribute(DATA_ATTR, 'annotation');
  badge.setAttribute('role', 'button');
  badge.setAttribute('tabindex', '0');
  badge.setAttribute('aria-label', t('badge_aria_label' as const, [record.label, record.address, ariaSuffix]));
  badge.style.cssText = BADGE_STYLE;
  badge.textContent = record.label;

  const detail = document.createElement('span');
  detail.setAttribute(DATA_ATTR, 'detail');
  detail.style.cssText = CUE_STYLE;
  detail.textContent = `· ${chainName} · ${confidenceText}`;
  badge.appendChild(detail);

  const cue = document.createElement('span');
  cue.setAttribute(DATA_ATTR, 'cue');
  cue.style.cssText = CUE_STYLE;
  cue.textContent = `· ${t('badge_private' as const)}`;
  badge.appendChild(cue);

  const open = (): void => context.onOpen(toAddressKey(record.address));
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
 * has a saved global record. Shows the global label + current chain status.
 * Idempotent: record-matched occurrences are wrapped in a TraceMemo-owned span
 * (excluded from rescans) so they are never annotated twice.
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
    const matchesWithRecord = matches.filter(match => context.hasRecord(toAddressKey(match[0])));
    if (matchesWithRecord.length === 0) continue;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    for (const match of matches) {
      const start = match.index ?? 0;
      const end = start + match[0].length;
      const key = toAddressKey(match[0]);
      const record = context.hasRecord(key);

      fragment.appendChild(document.createTextNode(text.slice(lastIndex, start)));

      if (record) {
        const wrapper = document.createElement('span');
        wrapper.setAttribute(DATA_ATTR, 'address');
        wrapper.textContent = match[0];
        fragment.appendChild(wrapper);
        fragment.appendChild(createBadge(record, context));
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
