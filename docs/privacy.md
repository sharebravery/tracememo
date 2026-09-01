# TraceMemo Privacy Notice

> Version: 1.2 · Date: 2026-09-01

TraceMemo is a local-first Chrome extension for Web3 researchers. It lets you attach private labels, tags, notes, confidence levels, and source links to EVM addresses you encounter on block explorers and across the web.

## Data Processed Locally

All data processing occurs locally on your device:

- EVM addresses detected on allowed or user-scanned pages.
- Chain context (chain id, note, confidence, sources) on recognized block explorers.
- The page URL and page title of scanned pages.
- Your custom labels, tags, notes, confidence assessments, and source links.
- Extension preferences (annotation display toggle, onboarding state, always-scan origin list).

## What Stays on Your Device

- **Research Library (IndexedDB)**: Every record you create is stored in your browser's IndexedDB on this device only, under the global address key `evm:<address>`. Each record holds a shared label, tags, and global note, plus independent per-chain contexts (chain-level note, confidence, sources).
- **Settings (`chrome.storage.local`)**: Extension preferences and the list of user-enabled always-scan origins are stored locally.
- **Per-Tab Page Context (`chrome.storage.session`)**: Detected addresses, page URL, and page title for an active tab are held in memory-backed session storage and deleted when the tab closes or the browser exits.
- **No Cloud Transmission**: TraceMemo has no user accounts, no sign-in, no cloud sync, and no backend servers. Your records and notes are never transmitted over the network.

## What TraceMemo Does Not Do

- It does **not** connect to `window.ethereum` or any crypto wallet.
- It does **not** handle private keys or seed phrases, request signatures, or execute transactions.
- It does **not** query balances, tokens, or transaction history via RPC.
- It does **not** use cookies, browsing history, webRequest, or clipboard-read permissions.
- It does **not** load remote scripts or executable code.
- It does **not** include analytics, telemetry, tracking, or remote error reporting.

## Permissions Requested

| Permission | Purpose |
|---|---|
| `storage` | Store research records in IndexedDB, settings in `chrome.storage.local`, and per-tab page context in `chrome.storage.session`. |
| `sidePanel` | Display the side panel as the extension's primary user interface. |
| `activeTab` | Temporarily access and scan the active tab when you click the extension toolbar icon. |
| `scripting` | Inject the EVM address scanner on demand upon user interaction, and manage dynamic content script registration for user-enabled Always-scan sites. |
| Host permissions for 5 explorers | Automatically detect addresses and display private labels on `etherscan.io`, `basescan.org`, `polygonscan.com`, `bscscan.com`, and `arbiscan.io`. |
| `optional_host_permissions: ['<all_urls>']` | Declared solely as an optional capability. Host permissions are requested on a per-origin basis only when you explicitly enable "Always scan this site". |

The manifest does **not** request `tabs`, `cookies`, `history`, `webRequest`, `clipboardRead`, or default broad host access.

## User-Generated Labels & Confidence

Labels, tags, and confidence assessments are your own private research notes. They are never official platform verifications or identity attestations. The UI marks user annotations as "Private" and reminds you that confidence levels reflect personal research assessments.

## Data Export, Import, and Deletion

- **Export**: Export all records at any time from **Settings -> Backup & data** to a versioned JSON file.
- **Plaintext Warning**: Exported backup files are unencrypted plaintext. Store them in a secure location.
- **Import**: Import a TraceMemo JSON backup file (up to 10 MB). Import is all-or-nothing: the entire file is validated upfront, and any invalid record causes the entire import to be rejected without modifying existing data.
- **Clear Data**: Delete all local records at any time after an explicit confirmation. A backup download is offered prior to deletion.
- **Data Persistence**: Clearing browser storage or uninstalling the extension will delete locally stored IndexedDB data. Export a backup before doing so.

## Changes to this Notice

Any functional changes affecting privacy or permissions will be reflected in updates to this document and release notes.
