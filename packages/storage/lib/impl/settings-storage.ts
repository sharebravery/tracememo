import { createStorage, StorageEnum } from '../base/index.js';
import type { BaseStorageType } from '../base/index.js';

/**
 * Small settings persisted via chrome.storage.local (NOT IndexedDB).
 *
 * Structurally identical to `Settings` in @extension/shared. Kept local to
 * avoid a workspace dependency cycle between `shared` and `storage`.
 * `liveUpdate` keeps every context (side panel, content script, background) in
 * sync through chrome.storage.onChanged. See
 * docs/02-TECHNICAL-ARCHITECTURE.md section 7.3.
 */
export interface SettingsState {
  annotationsEnabled: boolean;
  onboardingSeen: boolean;
}

export type SettingsStorageType = BaseStorageType<SettingsState>;

export const DEFAULT_SETTINGS_STATE: SettingsState = {
  annotationsEnabled: true,
  onboardingSeen: false,
};

/** chrome.storage.local key for the settings object. */
export const SETTINGS_STORAGE_KEY = 'tracememo-settings';

export const settingsStorage: SettingsStorageType = createStorage<SettingsState>(
  SETTINGS_STORAGE_KEY,
  DEFAULT_SETTINGS_STATE,
  {
    storageEnum: StorageEnum.Local,
    liveUpdate: true,
  },
);
