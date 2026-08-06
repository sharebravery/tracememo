import { sendMessage } from '../../messaging';
import { EmptyState } from '../library/EmptyState';
import { RecordEditor } from '../record-editor/RecordEditor';
import { addressKeyToAddress, CHAIN_LABELS, toChecksumAddress } from '@extension/shared';
import { useEffect, useMemo, useState } from 'react';
import type {
  AddressKey,
  AddressRecord,
  EvmAddress,
  PageContext,
  SourceInput,
  SupportedChainId,
} from '@extension/shared';

interface DetectedAccount {
  key: AddressKey;
  address: EvmAddress;
  chainId: SupportedChainId;
  record?: AddressRecord;
  isPrimary: boolean;
}

const PAGE_SIZE = 20;

const getActiveTabId = async (): Promise<number | null> => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.id ?? null;
  } catch {
    return null;
  }
};

const CONFIDENCE_LABEL: Record<string, string> = {
  confirmed: 'Confirmed',
  likely: 'Likely',
  unverified: 'Unverified',
};

export const CurrentPageView = () => {
  const [ctx, setCtx] = useState<PageContext | null>(null);
  const [detected, setDetected] = useState<DetectedAccount[] | null>(null);
  const [editing, setEditing] = useState<{
    mode: 'create' | 'update';
    key?: AddressKey;
    address: EvmAddress;
    chainId: SupportedChainId;
    record?: AddressRecord;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const refresh = async () => {
    try {
      const tabId = await getActiveTabId();
      if (tabId == null) {
        setCtx(null);
        setDetected([]);
        setError(null);
        return;
      }
      const pageCtx = await sendMessage({ type: 'PAGE_CONTEXT_GET', payload: { tabId } });
      setCtx(pageCtx);
      if (pageCtx && pageCtx.addressKeys.length > 0) {
        const records = await sendMessage({ type: 'RECORDS_GET_MANY', payload: { keys: pageCtx.addressKeys } });
        const byKey = new Map<AddressKey, AddressRecord>(records.map(r => [r.key, r]));
        const accounts: DetectedAccount[] = pageCtx.addressKeys.map(key => ({
          key,
          address: addressKeyToAddress(key),
          chainId: pageCtx.chainId,
          record: byKey.get(key),
          isPrimary: key === pageCtx.primaryAddressKey,
        }));
        // Sort: primary first, then saved, then unsaved.
        accounts.sort((a, b) => {
          if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
          const aSaved = a.record ? 0 : 1;
          const bSaved = b.record ? 0 : 1;
          if (aSaved !== bSaved) return aSaved - bSaved;
          return 0;
        });
        setDetected(accounts);
      } else {
        setDetected([]);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to read current page.');
      setDetected([]);
    }
  };

  useEffect(() => {
    void refresh();
    const onActivated = () => void refresh();
    const onSessionChanged = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (Object.keys(changes).some(key => key.startsWith('tracememo-page-context:'))) {
        void refresh();
      }
    };
    chrome.tabs.onActivated.addListener(onActivated);
    chrome.storage.session.onChanged.addListener(onSessionChanged);
    return () => {
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.storage.session.onChanged.removeListener(onSessionChanged);
    };
  }, []);

  // Reset pagination when query changes.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query]);

  const filtered = useMemo(() => {
    if (!detected) return null;
    const q = query.trim().toLowerCase();
    if (!q) return detected;
    return detected.filter(
      d => d.address.toLowerCase().includes(q) || (d.record?.label.toLowerCase().includes(q) ?? false),
    );
  }, [detected, query]);

  const visible = filtered ? filtered.slice(0, visibleCount) : null;
  const hasMore = filtered ? filtered.length > visibleCount : false;
  const savedCount = detected?.filter(d => d.record).length ?? 0;

  if (editing) {
    const pageSource: SourceInput | undefined = ctx ? { url: ctx.tabUrl, title: ctx.pageTitle } : undefined;
    return (
      <RecordEditor
        mode={editing.mode}
        initial={editing.record}
        initialChainId={editing.chainId}
        initialAddress={editing.address}
        defaultSources={pageSource ? [pageSource] : undefined}
        onSaved={() => {
          setEditing(null);
          void refresh();
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  const hasAccounts = visible !== null && visible.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-200">Current Page</h2>
          {ctx && (
            <span className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-cyan-400">
              {CHAIN_LABELS[ctx.chainId]}
            </span>
          )}
        </div>
      </div>

      {ctx && (
        <div className="text-xs text-slate-500">
          {detected && detected.length > 0
            ? `${detected.length} address${detected.length === 1 ? '' : 'es'} · ${savedCount} saved`
            : 'No addresses detected'}
        </div>
      )}

      {ctx && detected && detected.length > 4 && (
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Filter addresses…"
          className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-2.5 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
        />
      )}

      {error && (
        <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-xs text-rose-300">{error}</p>
      )}

      {detected === null && <p className="text-sm text-slate-500">Reading page…</p>}

      {!hasAccounts && detected !== null && !error && (
        <EmptyState message="No supported EVM addresses detected on this page. Open an Etherscan or BaseScan page." />
      )}

      {hasAccounts && (
        <ul className="flex flex-col gap-1.5">
          {visible!.map(({ key, address, chainId, record, isPrimary }) => {
            const chainCtx = record?.chains.find(c => c.chainId === chainId);
            return (
              <li
                key={key}
                className={`rounded-lg border p-2.5 ${isPrimary ? 'border-violet-500/30 bg-violet-500/5' : 'border-slate-800 bg-slate-900/40'}`}>
                <div className="flex items-center gap-1.5">
                  {isPrimary && <span className="shrink-0 text-[10px] font-medium text-violet-400">★</span>}
                  <span className="truncate font-mono text-xs text-slate-400" title={address}>
                    {toChecksumAddress(address)}
                  </span>
                </div>
                {record ? (
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-slate-100">{record.label}</span>
                      <span className="shrink-0 rounded bg-slate-700 px-1 py-0.5 text-[9px] font-medium text-slate-300">
                        Private
                      </span>
                      {chainCtx ? (
                        <span className="shrink-0 text-[10px] text-slate-500">
                          {CONFIDENCE_LABEL[chainCtx.confidence]}
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] text-slate-600">no {CHAIN_LABELS[chainId]} context</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditing({ mode: 'update', key, address, chainId, record })}
                      className="shrink-0 text-xs font-medium text-violet-400 hover:text-violet-300 focus:outline-none focus-visible:underline">
                      Edit
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditing({ mode: 'create', address, chainId })}
                    className="mt-1 rounded-lg bg-violet-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50">
                    Save
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
          className="self-center text-xs font-medium text-violet-400 hover:text-violet-300 focus:outline-none focus-visible:underline">
          Show more ({filtered!.length - visibleCount} remaining)
        </button>
      )}
    </div>
  );
};
