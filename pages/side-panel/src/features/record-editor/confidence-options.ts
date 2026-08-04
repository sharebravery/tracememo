import type { Confidence } from '@extension/shared';

/**
 * Confidence options with user-facing descriptions.
 *
 * Per the PRD, `confirmed` must not look like an official platform
 * verification badge - the descriptions make clear these are the user's own
 * assessments.
 */
export interface ConfidenceOption {
  value: Confidence;
  label: string;
  description: string;
}

export const CONFIDENCE_OPTIONS: ConfidenceOption[] = [
  {
    value: 'unverified',
    label: 'Unverified',
    description: 'A starting hypothesis. Default when you have not checked yet.',
  },
  {
    value: 'likely',
    label: 'Likely',
    description: 'Some evidence supports this, but it is not confirmed.',
  },
  {
    value: 'confirmed',
    label: 'Confirmed',
    description: 'Your own conclusion. This is not a platform verification.',
  },
];
