# TraceMemo Chrome Web Store Listing

## Short name

TraceMemo

## Summary (132 chars max)

Private, chain-aware context for onchain addresses. Attach a label, note, confidence, and sources to EVM addresses on Etherscan and BaseScan.

## Detailed description

TraceMemo is a local-first research notebook for Web3 researchers. When you see an EVM address on Etherscan or BaseScan, save a short label, a note, a confidence level, and one or more source links. The next time that address appears on the same chain, TraceMemo shows your private label beside it - no spreadsheets or separate notes required.

Records are one global entry per EVM address: a shared label, tags, and global note, plus independent per-chain contexts (chain-level note, confidence, sources) for Ethereum Mainnet (chain id 1) and Base (chain id 8453). The shared label appears on both chains; the chain-level note, confidence, and sources are independent and are not copied across chains. The same address is not assumed to have the same contract code, purpose, or state across chains.

What makes TraceMemo different from a simple address replacer:

- **Evidence-backed notes.** Every attribution can keep its source links, separate from your conclusion.
- **Confidence-aware research.** Mark a claim as unverified, likely, or confirmed so facts stay distinct from hypotheses. "Confirmed" is always shown as your own assessment, never as an official platform verification.
- **Local-first ownership.** Records stay on your device. There is no account and no cloud sync. Export and re-import the full library anytime.
- **Consistent workflow across explorers.** The same research workflow applies on Etherscan and BaseScan; a record is tied to its chain.

How it works:

1. Open an Etherscan or BaseScan page and click the toolbar icon to open the side panel.
2. On the Current Page tab, pick a detected address and save context for it. The current page is offered as the default source.
3. TraceMemo shows a small private label beside matching addresses on the same chain. Click a label to open the record.

Privacy:

- Records are stored only on your device (IndexedDB), one global record per address with per-chain contexts. No analytics, no advertising, no remote error reporting, no backend.
- TraceMemo never connects a wallet, requests signatures, sends transactions, reads balances, or makes RPC calls.
- The extension only runs on etherscan.io and basescan.org. It does not request `<all_urls>` or broad host access.
- Exported backups are plaintext JSON, not encrypted. Store them securely. Deleting the extension or clearing browser data may permanently delete records.

Data control:

- Export all records to a versioned JSON backup.
- Import a TraceMemo backup (10 MB max). Every record is validated; one invalid record rejects the whole file.
- Clear all records after an explicit confirmation, with a backup offered first.

## Category

Productivity / Developer Tools

## Languages

English

## Single purpose

Attach private, source-backed, chain-aware research notes to EVM addresses and restore that context when the address appears again on Etherscan or BaseScan.

## Permission justification

- `storage`: store your research records and preferences locally on the device, and hold per-tab page context in session storage.
- `sidePanel`: provide the side panel as the extension's primary interface.
- Host permissions for `etherscan.io` and `basescan.org`: detect addresses on those pages and display your private labels beside them.

TraceMemo does not request `<all_urls>`, `tabs`, `scripting`, `cookies`, `history`, `webRequest`, or `clipboardRead`. It uses `chrome.tabs.query`/`onActivated`/`onRemoved` without the `tabs` permission only to read the active tab id and clean up per-tab state.

## Data use disclosure (Chrome Web Store Privacy Practices)

- Data collected: none is transmitted off the device. Records, settings, and per-tab page context are processed and stored locally.
- Data used: addresses, chain id, page URL/title, labels, notes, confidence, source URL/title, and settings - all for the core on-device research workflow.
- No authentication, no personal communications, no financial data, no authentication credentials are collected or transmitted.
- No analytics or crash reporting is sent to the developer.

## Not a wallet

TraceMemo is a research and note-taking tool. It is not a wallet, does not custody assets, and cannot send transactions or interact with smart contracts.
