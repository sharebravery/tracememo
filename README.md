# TraceMemo

> Private context for every onchain address.

TraceMemo is a local-first Chrome extension for Web3 researchers. Attach a private label, tags, a global note, and per-chain context (chain-level note, confidence, sources) to EVM addresses on Etherscan and BaseScan. When the same address appears again, TraceMemo shows your private label beside it - no spreadsheets or separate notes required.

## Features

- **One global record per address.** A shared label, tags, and global note follow the address across Etherscan and BaseScan.
- **Independent chain contexts.** Ethereum Mainnet and Base each have their own note, confidence, and sources for the same address. The same address is never assumed to have the same contract code, purpose, or state across chains.
- **Evidence-backed.** Add source links per chain context, kept separate from your conclusion.
- **Confidence-aware.** Mark a claim as `unverified`, `likely`, or `confirmed`. "Confirmed" is always shown as your own assessment, never as a platform verification.
- **Inline private labels.** A small gradient badge appears beside matching addresses on supported explorer pages. The original address is never replaced or hidden.
- **Per-tab isolation.** Current Page state is isolated per Chrome tab; switching tabs never bleeds context.
- **Primary address.** On `/address/0x...` pages, the page's main address is identified and sorted first. Transaction hashes (`/tx/...`) are never mistaken for addresses.
- **Search & pagination.** The Current Page view includes an address filter and paginates 20 at a time with Show more.
- **Backup & restore.** Export all records to a versioned JSON file and re-import on another device. Import is all-or-nothing: one invalid record rejects the whole file.

## Privacy

- Records are stored only on your device (IndexedDB). There is no account, no cloud sync, and no backend server.
- TraceMemo reads Etherscan and BaseScan pages to detect addresses and show your private labels. It does not run on other sites.
- It never connects a wallet, requests signatures, sends transactions, reads balances, or makes RPC calls.
- No analytics, advertising, or remote error reporting.
- Exported JSON is plaintext and not encrypted - store backups securely. Deleting the extension or clearing browser data may permanently delete records.

See [`docs/privacy.md`](docs/privacy.md) for the full privacy notice and [`docs/store-listing.md`](docs/store-listing.md) for the Chrome Web Store listing.

## Supported sites

- `https://etherscan.io/*` (Ethereum Mainnet, chain id 1)
- `https://basescan.org/*` (Base, chain id 8453)

Chrome only (Manifest V3). Firefox is not supported.

The toolbar icon opens the side panel directly (no popup). The side panel defaults to the Current Page view.

## Development

Prerequisites: Node.js 22+ and pnpm 10, already on your machine. This project does not pin or auto-switch toolchain versions.

```bash
pnpm install          # install dependencies
pnpm dev              # watch build (load dist/ as an unpacked extension in Chrome)
```

Load it in Chrome: open `chrome://extensions`, enable Developer mode, click "Load unpacked", and select the `dist/` folder. Click the toolbar icon to open the side panel.

## Testing & quality

```bash
pnpm lint             # eslint
pnpm type-check       # tsc --noEmit
pnpm test             # vitest (unit + adapter + jsdom fixture tests)
pnpm build            # production build into dist/
pnpm zip              # build + package a ZIP into dist-zip/
```

CI (`.github/workflows/ci.yml`) runs lint, type-check, test, build, and zip on every pull request and push to `main`.

## Project layout

```
chrome-extension/   manifest, background service worker, icons
pages/content/      content script (detection + annotation)
pages/side-panel/   side panel UI (Current Page, Library, Settings)
packages/shared/    domain types, Zod schemas, message protocol
packages/research-db/  Dexie/IndexedDB repository + import/export
packages/storage/   settings (chrome.storage)
packages/i18n/      locale messages
docs/               PRD, architecture, implementation plan, privacy, store listing
```

## License

MIT
