# TraceMemo

> Private context for every onchain address.

TraceMemo is a local-first Chrome extension for Web3 researchers. Attach private labels, tags, global notes, and independent chain context (chain note, confidence, sources) to EVM addresses across the web. When the same address appears again, TraceMemo shows your private label beside it — no spreadsheets or separate notes required.

## Features

- **One global record per address.** A shared label, tags, and global note follow the address everywhere.
- **Independent chain contexts.** Built-in block explorers support chain-specific notes, confidence, and sources for the same address. The same address is never assumed to have the same contract code, purpose, or state across chains.
- **Evidence-backed.** Add source links per chain context, kept separate from your conclusion.
- **Confidence-aware.** Mark claims as `unverified`, `likely`, or `confirmed`. "Confirmed" is always shown as your own assessment, never as an official platform verification.
- **Inline private labels.** A small badge appears beside matching addresses on scanned pages. The original address is never replaced or hidden.
- **Per-tab isolation.** Current Page state is isolated per Chrome tab; switching tabs never bleeds context.
- **Primary address detection.** On `/address/0x...` pages, the page's main address is identified and sorted first. Transaction hashes (`/tx/...`) are never mistaken for addresses.
- **Search & filter.** The Library view provides fast local search across labels, addresses, notes, and tags, with confidence filtering.
- **Backup & restore.** Export all records to a versioned JSON file and re-import on another device. Import is all-or-nothing: one invalid record rejects the whole file.

## Supported Sites & Scanning

- **Built-in block explorers** (automatic detection with chain context):
  - `etherscan.io` (Ethereum Mainnet, chain id 1)
  - `basescan.org` (Base, chain id 8453)
  - `polygonscan.com` (Polygon, chain id 137)
  - `bscscan.com` (BNB Smart Chain, chain id 56)
  - `arbiscan.io` (Arbitrum One, chain id 42161)
- **Generic web pages**: Scan any webpage on demand by clicking the extension toolbar icon (`activeTab` + `scripting`). Generic pages identify EVM addresses and display Global Records without guessing a chain.
- **Always-scan sites**: Users can opt in to "Always scan this site" for specific origins, which requests host permission for that origin and automatically runs the scanner on visit.

The extension is designed for Google Chrome (Manifest V3). The toolbar icon opens the side panel directly.

## Privacy & Security

- **Local-first storage.** All research records are stored solely in your browser's IndexedDB on your device.
- **No server, no sync.** There is no user account, no cloud sync, no backend server, and no telemetry/analytics.
- **No wallet interaction.** TraceMemo never connects to `window.ethereum`, never touches private keys or seed phrases, never requests signatures, and makes no RPC calls.
- **Minimal permissions.** Broad host access (`<all_urls>`) is never requested by default; it is only declared as an optional permission capability for per-site opt-in.
- **Plaintext exports.** Exported JSON backup files are plaintext. Store your backup files securely.

See [`docs/privacy.md`](docs/privacy.md) for the full privacy notice and [`docs/store-listing.md`](docs/store-listing.md) for Chrome Web Store details.

## Development

Prerequisites: Node.js 22+ and pnpm 10.

```bash
pnpm install          # Install dependencies
pnpm dev              # Development watch build (outputs to dist/)
```

To load unpacked in Chrome:
1. Open `chrome://extensions`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select the `dist/` directory.
4. Click the extension toolbar icon to open the side panel.

## Testing & Quality

```bash
pnpm lint             # ESLint checks
pnpm type-check       # TypeScript type checking
pnpm test             # Vitest unit, adapter, and smoke tests
pnpm build            # Production build into dist/
pnpm zip              # Package production ZIP into dist-zip/
```

CI (`.github/workflows/ci.yml`) runs lint, type-check, test, build, and zip on every pull request and push to `main`.

## Internationalization

- English (default and fallback)
- 简体中文 (`zh_CN`, auto-selected by Chrome UI language)

## Project Structure

```text
chrome-extension/   Manifest, background service worker, permissions router, icons
pages/content/      Content script (EVM scanner, adapter registry, inline annotation)
pages/side-panel/   Side panel UI (Current Page, Library, Settings, Record Editor)
packages/shared/    Domain types, chains registry, Zod schemas, message protocol
packages/research-db/  Dexie / IndexedDB repository, migrations, import/export
packages/storage/   Chrome storage helpers (settings & preferences)
packages/i18n/      Locale message bundles
docs/               Product specs, architecture, release checklist, privacy notice
```

## Acknowledgements

TraceMemo's Chrome extension project structure originated from [`Jonghakseo/chrome-extension-boilerplate-react-vite`](https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite) and follows its MIT License.

## License

[MIT](LICENSE)
