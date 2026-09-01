# TraceMemo Chrome Web Store Listing

## Short Name

TraceMemo

## Summary (132 characters max)

Private, local-first context for EVM addresses. Attach labels, notes, confidence, and sources across block explorers and the web.

## Detailed Description

TraceMemo is a local-first research notebook for Web3 researchers and blockchain analysts. When you encounter an EVM address on a block explorer or webpage, save a private label, tags, a global note, and chain-specific context (chain note, confidence level, and source links). When that address appears again, TraceMemo displays your private label right beside it — no spreadsheets or separate notes required.

### Key Features

- **Single Global Record per Address**: Save a unified label, tags, and global note that follow the address across the web.
- **Independent Chain Contexts**: Add chain-specific notes, confidence, and source links on supported block explorers (Ethereum Mainnet, Base, Polygon, BNB Smart Chain, Arbitrum One). The same address is never assumed to share the same contract bytecode, purpose, or state across different chains.
- **Evidence-Backed Notes**: Attach source URLs and page titles to keep your supporting evidence distinct from your conclusions.
- **Confidence-Aware Research**: Classify notes as `unverified`, `likely`, or `confirmed`. "Confirmed" represents your personal assessment, never an official platform verification.
- **Local-First & Private**: Records are stored strictly on your device in IndexedDB. No accounts, no cloud sync, no analytics, and no remote telemetry.
- **Portable Backups**: Export your entire research library to a versioned JSON backup and re-import anytime with strict all-or-nothing validation.

### How It Works

1. **Explorers**: Open any supported block explorer (Etherscan, BaseScan, PolygonScan, BscScan, Arbiscan). TraceMemo automatically identifies addresses and displays your private labels.
2. **Generic Web Pages**: Click the extension toolbar icon to scan any web page on demand (`activeTab`).
3. **Always-Scan Sites**: Enable "Always scan this site" in the side panel for trusted domains to automatically scan on every visit.
4. **Side Panel**: Open the side panel to view detected addresses on the current page, manage your research library, or edit records.

### Privacy & Data Ownership

- **100% Local Storage**: Your research notes remain on your device.
- **No Wallet Integration**: TraceMemo is strictly a research and note-taking tool. It never connects to `window.ethereum`, never touches private keys or seed phrases, never requests signatures, and makes no RPC calls.
- **No Analytics / No Backend**: Zero network requests are made to developer servers.
- **Permission Transparency**: Broad host permissions (`<all_urls>`) are declared solely as an optional capability and are never active by default. Permissions for generic sites are requested on a per-origin basis only when you enable "Always scan this site".

## Category

Productivity / Developer Tools

## Languages

- English (Default)
- 简体中文 (Simplified Chinese)

## Single Purpose Description

Attach private, evidence-backed research notes to EVM addresses and restore that context when the address appears again across block explorers and web pages.

## Permission Justifications

- `storage`: Persist research records locally in IndexedDB, settings in `chrome.storage.local`, and per-tab page context in `chrome.storage.session`.
- `sidePanel`: Provide the side panel as the extension's primary workspace.
- `activeTab`: Temporarily inspect and scan the active tab for EVM addresses when you click the extension toolbar icon.
- `scripting`: Inject the address scanner on demand upon user interaction, and manage dynamic content script registration for user-enabled Always-scan sites.
- Host permissions (`etherscan.io`, `basescan.org`, `polygonscan.com`, `bscscan.com`, `arbiscan.io`): Automatically detect addresses and render private labels on supported block explorers.
- Optional host permissions (`<all_urls>`): Used only on a per-origin basis when you explicitly enable "Always scan this site" for a particular website.

TraceMemo does not request `tabs`, `cookies`, `history`, `webRequest`, `clipboardRead`, or default `<all_urls>` access.

## Chrome Web Store Privacy Practices Disclosure

- **Data Collection**: No user data, research notes, addresses, or browsing history is transmitted off the device.
- **Data Usage**: Addresses, URLs, and research notes are processed locally solely for the extension's core note-taking and address-labeling functionality.
- **Authentication & Financial Info**: No authentication credentials, passwords, private keys, or financial transaction data are collected, stored, or processed.
