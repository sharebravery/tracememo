# TraceMemo Privacy Notice

> Version: 1.0 · Date: 2026-08-04

TraceMemo is a local-first Chrome extension that lets you attach a private label, note, confidence level, and source links to EVM addresses you research on Etherscan and BaseScan.

## What stays on your device

- Every record you create (label, note, confidence, sources, timestamps) is stored locally in your browser's IndexedDB on this device only.
- Small preferences (annotation toggle, onboarding state) are stored in `chrome.storage.local` on this device only.
- TraceMemo has **no account, no sign-in, no cloud sync, and no backend server**. There is nowhere for your records to be transmitted.

## What the extension accesses

- TraceMemo runs a content script only on `https://etherscan.io/*` and `https://basescan.org/*`. It reads the visible text of those pages to detect EVM addresses and to insert private labels next to addresses you have saved.
- The content script sends only normalized addresses and basic page metadata (URL, title, site id) to the extension's background service worker, which looks up matching records. No page content is sent anywhere outside the extension.
- The toolbar icon opens the Chrome side panel, which is the extension's only UI.

## What the extension does not do

- It does **not** connect to `window.ethereum` or any wallet.
- It does **not** request signatures, build or send transactions, or read balances, tokens, or transaction history.
- It does **not** make RPC calls to any blockchain node.
- It does **not** use cookies, browsing history, webRequest, or clipboard-read permissions.
- It does **not** load executable code from a remote server.
- It does **not** include advertising or analytics SDKs and does **not** transmit analytics.

## Permissions requested

| Permission | Why |
|---|---|
| `storage` | Persist records (IndexedDB) and small settings (`chrome.storage.local`). |
| `sidePanel` | Open the side panel as the primary UI. |
| Host access to `etherscan.io` and `basescan.org` | Detect addresses and show private labels on those pages. |

The manifest does **not** request `<all_urls>`, `tabs`, `scripting`, `cookies`, `history`, `webRequest`, `clipboardRead`, or any broad host access.

## User-generated labels

Labels and confidence levels you assign are your own private notes. They are not platform verifications. The UI always marks user labels as "Private" and clarifies that confidence is your own assessment.

## Data export, import, and deletion

- From **Settings → Backup & data** you can export all records to a versioned JSON file.
- You can import a TraceMemo JSON file (10 MB maximum). Importing validates every record and resolves conflicts by keeping the record with the newer `updatedAt`.
- You can clear all records after an explicit confirmation. A backup download is offered before clearing.

## Service worker lifecycle

The background service worker may stop between events. Records are always read from IndexedDB on demand, so no data is lost when the worker restarts.

## Changes to this notice

Behavior changes that affect privacy will update this document. TraceMemo does not auto-update privacy-relevant behavior without a new version.
