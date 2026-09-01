# TraceMemo Release Checklist

Manual smoke testing checklist before tagging and publishing a release.

## 1. Build & Installation

- [ ] Run fresh production build (`pnpm build && pnpm zip`).
- [ ] Install production ZIP in Chrome (`chrome://extensions` -> Load unpacked / Drag & drop ZIP).
- [ ] Verify toolbar icon click opens the side panel directly without errors.
- [ ] Verify onboarding screen appears on first launch and dismissing it saves state.

## 2. Generic Page & Global Record

- [ ] Open a generic HTTPS webpage containing an EVM address.
- [ ] Click toolbar / scan to detect the EVM address.
- [ ] Verify the detected address appears under Current Page without guessing any chain (no fake Ethereum context).
- [ ] Create and save a Global Record (label, tags, global note).
- [ ] Verify the saved private label renders beside the address on the page.

## 3. Explorer Chain Context

- [ ] Open an Etherscan (`etherscan.io`) address page:
  - [ ] Auto-scans without manual click.
  - [ ] Shows Ethereum Mainnet chain context.
  - [ ] Save/edit Ethereum-specific note, confidence, and source.
- [ ] Open an Arbiscan (`arbiscan.io`) address page:
  - [ ] Auto-scans without manual click.
  - [ ] Shows Arbitrum chain context.
  - [ ] Save/edit Arbitrum-specific note, confidence, and source.
- [ ] Confirm that global label and note are shared between explorers, but chain-specific notes, confidence, and sources remain independent.

## 4. Per-Origin Always-Scan & Permissions

- [ ] On a generic webpage, enable "Always scan this site".
- [ ] Confirm browser prompts for origin host permission and permission is granted.
- [ ] Refresh the page or restart Chrome; confirm Always-scan auto-detects addresses without clicking toolbar.
- [ ] In Settings -> Always-scan sites, remove/disable the site.
- [ ] Confirm host permission and dynamic content script registration are removed.

## 5. Data Backup, Restore & Clear

- [ ] Export research library to JSON from Settings -> Backup & data.
- [ ] Verify exported JSON contains saved records in plaintext format.
- [ ] Clear all data with confirmation (download backup prompt works).
- [ ] Confirm Library and annotations are cleared.
- [ ] Import the previously exported JSON file; confirm preview counts and that all records and chain contexts are fully restored.

## 6. UI & Internationalization

- [ ] Switch Chrome language / system locale to `zh_CN`.
- [ ] Verify Chinese localization renders cleanly across side-panel views.
- [ ] Verify no unhandled exceptions or obvious errors in Chrome extension service worker / side-panel console.
