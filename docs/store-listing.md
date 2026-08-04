# TraceMemo Chrome Web Store Listing

## Short name

TraceMemo

## Summary (132 chars max)

Private context for every onchain address. Attach a label, note, confidence, and source to EVM addresses on Etherscan and BaseScan.

## Detailed description

TraceMemo is a local-first research notebook for Web3 researchers. When you see an EVM address on Etherscan or BaseScan, save a short label, a note, a confidence level, and one or more source links. The next time that address appears, TraceMemo shows your private label beside it - no spreadsheets or separate notes required.

What makes TraceMemo different from a simple address replacer:

- **Evidence-backed notes.** Every attribution can keep its source links, separate from your conclusion.
- **Confidence-aware research.** Mark a claim as unverified, likely, or confirmed so facts stay distinct from hypotheses. "Confirmed" is always shown as your own assessment, never as an official platform verification.
- **Local-first ownership.** Records stay on your device. There is no account and no cloud sync. Export and re-import the full library anytime.
- **Cross-explorer continuity.** The same private record follows an address across Etherscan and BaseScan.

How it works:

1. Open an Etherscan or BaseScan page and click the toolbar icon to open the side panel.
2. On the Current Page tab, pick a detected address and save context for it. The current page is offered as the default source.
3. TraceMemo shows a small private label beside matching addresses on supported explorer pages. Click a label to open the record.

Privacy:

- Records are stored only on your device (IndexedDB). No analytics, no external data transmission, no backend.
- TraceMemo never connects a wallet, requests signatures, sends transactions, reads balances, or makes RPC calls.
- The extension only runs on etherscan.io and basescan.org. It does not request `<all_urls>` or broad host access.

Data control:

- Export all records to a versioned JSON backup.
- Import a TraceMemo backup (10 MB max) with conflict-aware merging.
- Clear all records after an explicit confirmation, with a backup offered first.

## Category

Productivity / Developer Tools

## Languages

English

## Single purpose

Attach private, source-backed research notes to EVM addresses and restore that context when the address appears again on Etherscan and BaseScan.

## Permission justification

- `storage`: store your research records and preferences locally on the device.
- `sidePanel`: provide the side panel as the extension's primary interface.
- Host permissions for `etherscan.io` and `basescan.org`: detect addresses on those pages and display your private labels beside them.

TraceMemo does not request `<all_urls>`, `tabs`, `scripting`, `cookies`, `history`, `webRequest`, or `clipboardRead`.

## Not a wallet

TraceMemo is a research and note-taking tool. It is not a wallet, does not custody assets, and cannot send transactions or interact with smart contracts.
