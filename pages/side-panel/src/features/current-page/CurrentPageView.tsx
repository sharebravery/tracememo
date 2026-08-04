import { sendMessage } from '../../messaging';
import { EmptyState } from '../library/EmptyState';
import { RecordEditor } from '../record-editor/RecordEditor';
import { toAddressKey, toChecksumAddress } from '@extension/shared';
import { useEffect, useState } from 'react';
import type { AddressKey, AddressRecord, EvmAddress, PageContext, ResearchSource } from '@extension/shared';

interface DetectedAddress {
  address: EvmAddress;
  record?: AddressRecord;
}

const buildPageSource = (ctx: PageContext): ResearchSource => ({
  id: crypto.randomUUID(),
  url: ctx.tabUrl,
  title: ctx.pageTitle,
  createdAt: new Date().toISOString(),
});

export const CurrentPageView = () => {
  const [ctx, setCtx] = useState<PageContext | null>(null);
  const [detected, setDetected] = useState<DetectedAddress[] | null>(null);
  const [editing, setEditing] = useState<{ address?: EvmAddress; record?: AddressRecord } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const pageCtx = await sendMessage({ type: 'PAGE_CONTEXT_GET' });
      setCtx(pageCtx);
      if (pageCtx && pageCtx.addresses.length > 0) {
        const keys = pageCtx.addresses.map(a => toAddressKey(a));
        const records = await sendMessage({ type: 'RECORDS_GET_MANY', payload: { keys } });
        const byKey = new Map<AddressKey, AddressRecord>(records.map(r => [r.key, r]));
        setDetected(pageCtx.addresses.map(a => ({ address: a, record: byKey.get(toAddressKey(a)) })));
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
  }, []);

  if (editing) {
    const pageSource = ctx ? buildPageSource(ctx) : undefined;
    return (
      <RecordEditor
        initial={editing.record}
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

  const hasAddresses = detected !== null && detected.length > 0;

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

      {!hasAddresses && detected !== null && !error && (
        <EmptyState message="No EVM addresses detected on this page. Open an Etherscan address or transaction page, then refresh." />
      )}

      {hasAddresses && (
        <ul className="flex flex-col gap-2">
          {detected!.map(({ address, record }) => (
            <li key={toAddressKey(address)} className="rounded border border-slate-200 bg-white p-3 shadow-sm">
              <p className="truncate font-mono text-xs text-slate-600" title={address}>
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
                    onClick={() => setEditing({ record })}
                    className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus-visible:underline">
                    Edit
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing({ address })}
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
