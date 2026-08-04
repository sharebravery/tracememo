import { readFileSync } from 'node:fs';
import type { ManifestType } from '@extension/shared';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

/**
 * TraceMemo manifest.
 *
 * Minimum-permission Manifest V3 surface:
 * - one background service worker;
 * - one side panel as the primary UI (no popup);
 * - one content script scoped to the supported explorers only;
 * - `storage` and `sidePanel` permissions only.
 *
 * Forbidden in MVP: `<all_urls>`, `tabs`, `scripting`, `notifications`,
 * `cookies`, `history`, `webRequest`, `declarativeNetRequest`,
 * `clipboardRead`, new-tab override, popup, devtools page, and broad
 * `web_accessible_resources` matches. See docs/02-TECHNICAL-ARCHITECTURE.md
 * section 5.1.
 */
const SUPPORTED_HOSTS = ['https://etherscan.io/*', 'https://basescan.org/*'] as const;

const manifest = {
  manifest_version: 3,
  default_locale: 'en',
  name: '__MSG_extensionName__',
  description: '__MSG_extensionDescription__',
  version: packageJson.version,
  permissions: ['storage', 'sidePanel'],
  host_permissions: [...SUPPORTED_HOSTS],
  background: {
    service_worker: 'background.js',
    type: 'module',
  },
  action: {
    default_title: '__MSG_openSidePanel__',
    default_icon: 'icon-34.png',
  },
  icons: {
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
