import { sendMessage } from '../../messaging';
import { useState } from 'react';

interface OnboardingProps {
  onDone: () => void;
}

/**
 * First-run privacy explanation. Shown until the user dismisses it, which sets
 * `onboardingSeen` in settings. Content mirrors actual extension behavior so it
 * can serve as the privacy notice (PRD FR-10).
 */
export const Onboarding = ({ onDone }: OnboardingProps) => {
  const [dismissing, setDismissing] = useState(false);

  const dismiss = async () => {
    setDismissing(true);
    try {
      await sendMessage({ type: 'SETTINGS_UPDATE', payload: { onboardingSeen: true } });
      onDone();
    } catch {
      setDismissing(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-6">
      <header>
        <h1 className="text-lg font-semibold text-slate-900">Welcome to TraceMemo</h1>
        <p className="text-sm text-slate-600">Private context for every onchain address.</p>
      </header>

      <section className="flex flex-col gap-2 text-sm text-slate-700">
        <p>TraceMemo is a local-first research notebook for EVM addresses on Etherscan and BaseScan.</p>
        <ul className="list-disc space-y-1 pl-5 text-slate-600">
          <li>Records stay on this device only - there is no account and no cloud sync.</li>
          <li>TraceMemo reads Etherscan and BaseScan pages to find addresses and show your private labels.</li>
          <li>It never connects a wallet, requests signatures, sends transactions, or calls RPC.</li>
          <li>No analytics and no external data transmission.</li>
          <li>You can export or delete all data at any time from Settings.</li>
        </ul>
      </section>

      <div className="mt-auto">
        <button
          type="button"
          onClick={() => void dismiss()}
          disabled={dismissing}
          className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50">
          {dismissing ? 'Starting…' : 'Get started'}
        </button>
      </div>
    </div>
  );
};
