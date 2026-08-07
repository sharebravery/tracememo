import { useCallback, useEffect, useRef, useState } from 'react';

type CopyStatus = 'idle' | 'copied' | 'failed';

const COPY_RESET_MS = 1500;

/**
 * Reusable address-copy hook. Provides a `copy` function and a `status` that
 * components can render as feedback. Handles timer cleanup, consecutive-click
 * debouncing, and clipboard failure.
 */
export const useCopyAddress = () => {
  const [status, setStatus] = useState<CopyStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const copy = useCallback(async (text: string) => {
    // Clear any pending reset so consecutive clicks don't fire stale timers.
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    try {
      await navigator.clipboard.writeText(text);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }

    timerRef.current = setTimeout(() => {
      setStatus('idle');
      timerRef.current = undefined;
    }, COPY_RESET_MS);
  }, []);

  // Cleanup on unmount.
  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  return { copy, status };
};
