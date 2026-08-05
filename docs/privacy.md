# TraceMemo Privacy Notice

> Version: 1.1 · Date: 2026-08-05

TraceMemo is a local-first Chrome extension that lets you attach a private label, note, confidence level, and source links to EVM addresses you research on Etherscan (Ethereum Mainnet) and BaseScan (Base).

## Data processed locally

The extension processes the following data, all on your device:

- EVM addresses and their **chain id** (1 for Ethereum Mainnet, 8453 for Base).
- The page URL and page title of supported explorer pages you visit.
- Your labels, notes, and confidence levels.
- Source URLs and source titles you add to a record.
- Settings (annotation toggle, onboarding-seen flag).

## What stays on your device

- Every record you create is stored in your browser's IndexedDB **on this device only**, under a global address key (`evm:<address>`). One record per address holds a shared label, tags, and global note, plus independent per-chain contexts (chain-level note, confidence, sources). The shared label is the same across Ethereum Mainnet and Base; the chain-level note, confidence, and sources are not.
- Small preferences are stored in `chrome.storage.local` on this device.
- Page context (detected addresses, URL, title) is held in `chrome.storage.session` **per tab** and is cleared when the tab closes or the browser exits.
- TraceMemo has **no account, no sign-in, no cloud sync, and no backend server**. There is nowhere for your records to be transmitted.

## What the extension does not do

- It does **not** connect to `window.ethereum` or any wallet.
- It does **not** request signatures, build or send transactions, or read balances, tokens, or transaction history.
- It does **not** make RPC calls to any blockchain node.
- It does **not** use cookies, browsing history, webRequest, or clipboard-read permissions.
- It does **not** load executable code from a remote server.
- It does **not** include advertising, analytics, or remote error-reporting SDKs, and does **not** transmit analytics or telemetry.

## Permissions requested

| Permission | Why |
|---|---|
| `storage` | Persist records (IndexedDB) and small settings (`chrome.storage.local`); per-tab page context (`chrome.storage.session`). |
| `sidePanel` | Open the side panel as the primary UI. |
| Host access to `etherscan.io` and `basescan.org` | Detect addresses on those pages and show private labels beside them. |

The manifest does **not** request `<all_urls>`, `tabs`, `scripting`, `cookies`, `history`, `webRequest`, `clipboardRead`, or any broad host access. `chrome.tabs.query`/`onActivated`/`onRemoved` are used without the `tabs` permission (only the active tab id is read; page URLs/titles come from the content script on supported pages).

## User-generated labels

Labels and confidence levels you assign are your own private notes. They are not platform verifications. The UI always marks user labels as "Private" and clarifies that confidence is your own assessment. A "Confirmed" label is never presented as an official verification.

## Data export, import, and deletion

- From **Settings -> Backup & data** you can export all records to a versioned JSON file.
- You can import a TraceMemo JSON file (10 MB maximum). Import is all-or-nothing: every record is validated first, and a single invalid record rejects the whole file with no writes. Conflicts keep the record with the newer `updatedAt`.
- You can clear all records after an explicit confirmation. A backup download is offered before clearing.
- **Deleting the extension or clearing browser data may permanently delete your records.** Export a backup first if you want to keep them.
- **The exported JSON is a plaintext file, not an encrypted backup.** Anyone with the file can read it. Store exports securely.

## Service worker lifecycle

The background service worker may stop between events. Records are always read from IndexedDB on demand, so no data is lost when the worker restarts.

## Changes to this notice

Behavior changes that affect privacy will update this document. TraceMemo does not auto-update privacy-relevant behavior without a new version.
