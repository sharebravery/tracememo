import { t } from '@extension/i18n';
import type { Confidence } from '@extension/shared';

interface ConfidenceOption {
  value: Confidence;
  label: string;
  description: string;
}

const CONFIDENCE_LABEL_KEY: Record<Confidence, string> = {
  confirmed: 'confidence_confirmed',
  likely: 'confidence_likely',
  unverified: 'confidence_unverified',
};

const CONFIDENCE_DESC_KEY: Record<Confidence, string> = {
  confirmed: 'confidence_confirmed_desc',
  likely: 'confidence_likely_desc',
  unverified: 'confidence_unverified_desc',
};

const CONFIDENCE_OPTIONS: ConfidenceOption[] = (
  [{ value: 'unverified' }, { value: 'likely' }, { value: 'confirmed' }] as { value: Confidence }[]
).map(o => ({
  value: o.value,
  label: t(CONFIDENCE_LABEL_KEY[o.value] as 'confidence_confirmed'),
  description: t(CONFIDENCE_DESC_KEY[o.value] as 'confidence_confirmed_desc'),
}));

export { CONFIDENCE_OPTIONS, type ConfidenceOption };
