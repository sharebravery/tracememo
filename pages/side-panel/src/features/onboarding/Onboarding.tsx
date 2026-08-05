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
      <header className="flex flex-col items-center text-center">
        <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-xl font-bold text-white shadow-xl shadow-violet-500/30">
          T
        </span>
        <h1 className="bg-gradient-to-r from-violet-300 via-indigo-200 to-cyan-200 bg-clip-text text-lg font-bold text-transparent">
          Welcome to TraceMemo
        </h1>
        <p className="text-sm text-slate-400">Private context for every onchain address.</p>
      </header>

      <section className="flex flex-col gap-2.5 text-sm text-slate-300">
        <p className="text-slate-400">
          TraceMemo is a local-first research notebook for EVM addresses on Etherscan and BaseScan.
        </p>
        <ul className="space-y-1.5">
          <li className="flex gap-2">
            <span className="text-violet-400">◆</span>{' '}
            <span className="text-slate-300">Records stay on this device only - no account, no cloud sync.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-violet-400">◆</span>{' '}
            <span className="text-slate-300">
              Reads Etherscan and BaseScan pages to find addresses and show your private labels.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-violet-400">◆</span>{' '}
            <span className="text-slate-300">
              Never connects a wallet, requests signatures, sends transactions, or calls RPC.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-violet-400">◆</span>{' '}
            <span className="text-slate-300">No analytics and no external data transmission.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-violet-400">◆</span>{' '}
            <span className="text-slate-300">Export or delete all data anytime from Settings.</span>
          </li>
        </ul>
      </section>

      <div className="mt-auto">
        <button
          type="button"
          onClick={() => void dismiss()}
          disabled={dismissing}
          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 disabled:opacity-50">
          {dismissing ? 'Starting…' : 'Get started'}
        </button>
      </div>
    </div>
  );
};
