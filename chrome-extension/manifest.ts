import { SUPPORTED_CHAINS } from '@extension/shared';
import { readFileSync } from 'node:fs';
import type { ManifestType } from '@extension/shared';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

/**
 * TraceMemo manifest.
 *
 * Minimum-permission Manifest V3 surface:
 * - one background service worker;
 * - a side panel as the sole UI (toolbar click opens it directly);
 * - one static content script scoped to the supported explorers only (generic
 *   pages are scanned on demand via activeTab/scripting, or always-on via a
 *   dynamically registered content script per enabled site - see background
 *   site-permissions);
 * - `storage`, `sidePanel`, `activeTab`, and `scripting` permissions only.
 *
 * Host lists are derived from the single chain-config source
 * (`SUPPORTED_CHAINS`) so the manifest can never drift from the chain registry.
 */
const SUPPORTED_HOSTS = SUPPORTED_CHAINS.map(c => `https://${c.hostname}/*`) as readonly string[];

const manifest = {
  manifest_version: 3,
  minimum_chrome_version: '116',
  default_locale: 'en',
  name: '__MSG_extensionName__',
  description: '__MSG_extensionDescription__',
  version: packageJson.version,
  permissions: ['storage', 'sidePanel', 'activeTab', 'scripting'],
  host_permissions: [...SUPPORTED_HOSTS],
  optional_host_permissions: ['<all_urls>'],
  background: {
    service_worker: 'background.js',
    type: 'module',
  },
  action: {
    default_title: '__MSG_openSidePanel__',
    default_icon: {
      '16': 'icon-16.png',
      '32': 'icon-32.png',
      '48': 'icon-48.png',
      '128': 'icon-128.png',
    },
  },
  icons: {
    '16': 'icon-16.png',
    '32': 'icon-32.png',
    '48': 'icon-48.png',
    '128': 'icon-128.png',
  },
  content_scripts: [
    {
      matches: [...SUPPORTED_HOSTS],
      js: ['content/all.iife.js'],
      run_at: 'document_idle',
    },
  ],
  side_panel: {
    default_path: 'side-panel/index.html',
  },
} satisfies ManifestType;

export default manifest;
