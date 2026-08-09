// @vitest-environment jsdom
import { useCopyAddress } from './use-copy-address';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, beforeEach, vi } from 'vitest';

// React expects this to be true when testing with `act`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const writeText = vi.fn();

beforeEach(() => {
  writeText.mockReset();
  // jsdom does not implement the Async Clipboard API; stub it.
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
});

/**
 * Minimal renderHook without @testing-library/react. Renders a probe that
 * captures the hook's return value, so we can assert on `copy`/`status`.
 */
const renderHook = <T,>(fn: () => T) => {
  const result = { current: undefined as T | undefined };
  const Probe = () => {
    result.current = fn();
    return null;
  };
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<Probe />);
  });
  return {
    result,
    unmount: () => {
      act(() => root.unmount());
    },
  };
};

describe('useCopyAddress', () => {
  it('writes the address to the clipboard and reports "copied"', async () => {
    writeText.mockResolvedValue(undefined);
    const { result, unmount } = renderHook(() => useCopyAddress());
    expect(result.current?.status).toBe('idle');
    await act(async () => {
      await result.current!.copy('0xabc123');
    });
    expect(writeText).toHaveBeenCalledWith('0xabc123');
    expect(result.current?.status).toBe('copied');
    unmount();
  });

  it('reports "failed" when the clipboard rejects', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    const { result, unmount } = renderHook(() => useCopyAddress());
    await act(async () => {
      await result.current!.copy('0xabc123');
    });
    expect(result.current?.status).toBe('failed');
    unmount();
  });
});
