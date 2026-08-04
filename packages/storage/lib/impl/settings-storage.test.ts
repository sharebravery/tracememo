import { DEFAULT_SETTINGS_STATE, settingsStorage } from './settings-storage.js';
import { describe, expect, it } from 'vitest';

describe('settings defaults', () => {
  it('enables annotations and marks onboarding as unseen by default', () => {
    expect(DEFAULT_SETTINGS_STATE).toEqual({
      annotationsEnabled: true,
      onboardingSeen: false,
    });
  });

  it('returns the defaults when no value has been stored', async () => {
    // Without a chrome.storage implementation, createStorage falls back to the
    // provided default - mirroring first-install behavior.
    await expect(settingsStorage.get()).resolves.toEqual(DEFAULT_SETTINGS_STATE);
  });
});
