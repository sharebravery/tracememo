import { sendMessage } from '../../messaging';
import { EmptyState } from '../library/EmptyState';
import { RecordEditor } from '../record-editor/RecordEditor';
import { addressKeyToAddress, CHAIN_LABELS, toChecksumAddress } from '@extension/shared';
import { useEffect, useState } from 'react';
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
}

const getActiveTabId = async (): Promise<number | null> => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.id ?? null;
  } catch {
    return null;
  }
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
        setDetected(
          pageCtx.addressKeys.map(key => ({
            key,
            address: addressKeyToAddress(key),
            chainId: pageCtx.chainId,
            record: byKey.get(key),
          })),
        );
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
    const listener = () => void refresh();
    chrome.tabs.onActivated.addListener(listener);
    return () => chrome.tabs.onActivated.removeListener(listener);
  }, []);

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

  const hasAccounts = detected !== null && detected.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Current Page</h2>
        <button
          type="button"
          onClick={() => void refresh()}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus-visible:underline">
          Refresh
        </button>
      </div>

      {ctx && (
        <p className="truncate text-xs text-slate-500" title={ctx.tabUrl}>
          {ctx.pageTitle || ctx.tabUrl}
        </p>
      )}

      {error && <p className="rounded bg-red-50 px-2 py-1.5 text-xs text-red-700">{error}</p>}

      {detected === null && <p className="text-sm text-slate-500">Reading page…</p>}

      {!hasAccounts && detected !== null && !error && (
        <EmptyState message="No supported EVM addresses detected on this page. Open an Etherscan or BaseScan page, then refresh." />
      )}

      {hasAccounts && (
        <ul className="flex flex-col gap-2">
          {detected!.map(({ key, address, chainId, record }) => (
            <li key={key} className="rounded border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="shrink-0 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">
                  {CHAIN_LABELS[chainId]}
                </span>
                {record && !record.chains.some(c => c.chainId === chainId) && (
                  <span className="shrink-0 text-[10px] text-slate-400">no {CHAIN_LABELS[chainId]} context yet</span>
                )}
              </div>
              <p className="mt-1 truncate font-mono text-xs text-slate-600" title={address}>
                {toChecksumAddress(address)}
              </p>
              {record ? (
                <div className="mt-1 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-slate-900">{record.label}</span>
                    <span className="shrink-0 rounded bg-slate-200 px-1 py-0.5 text-[9px] font-medium text-slate-600">
                      Private
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditing({ mode: 'update', key, address, chainId, record })}
                    className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus-visible:underline">
                    Edit
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing({ mode: 'create', address, chainId })}
                  className="mt-1 rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                  Save context
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
