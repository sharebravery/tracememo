import { sendMessage } from '../../messaging';
import { t } from '@extension/i18n';
import { useState } from 'react';

interface OnboardingProps {
  onDone: () => void;
}

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
        <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-xl font-bold text-white">
          T
        </span>
        <h1 className="text-lg font-bold text-slate-200">{t('onboarding_welcome')}</h1>
        <p className="text-sm text-slate-400">{t('tagline')}</p>
      </header>

      <section className="flex flex-col gap-2.5 text-sm text-slate-300">
        <p className="text-slate-400">{t('onboarding_intro')}</p>
        <ul className="space-y-1.5">
          <li className="flex gap-2">
            <span className="text-violet-400">◆</span>
            <span className="text-slate-300">{t('onboarding_b1')}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-violet-400">◆</span>
            <span className="text-slate-300">{t('onboarding_b2')}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-violet-400">◆</span>
            <span className="text-slate-300">{t('onboarding_b3')}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-violet-400">◆</span>
            <span className="text-slate-300">{t('onboarding_b4')}</span>
          </li>
          <li className="flex gap-2">
            <span className="text-violet-400">◆</span>
            <span className="text-slate-300">{t('onboarding_b5')}</span>
          </li>
        </ul>
      </section>

      <div className="mt-auto">
        <button
          type="button"
          onClick={() => void dismiss()}
          disabled={dismissing}
          className="w-full rounded-lg bg-violet-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 disabled:opacity-50">
          {dismissing ? t('onboarding_starting') : t('onboarding_get_started')}
        </button>
      </div>
    </div>
  );
};
