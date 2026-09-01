# TraceMemo Release Checklist

Manual smoke testing checklist before tagging and publishing a release.

## 1. Build & Installation

- [ ] Run fresh production build and packaging (`pnpm build && pnpm zip`).
- [ ] Verify packaging output in `dist-zip/*.zip`.
- [ ] Test extension loading in Chrome (`chrome://extensions` with Developer mode enabled):
  - **Option A (Production package verification)**: Extract the generated `dist-zip/*.zip` into a temporary folder, click **Load unpacked**, and select the extracted directory.
  - **Option B (Local build smoke)**: Click **Load unpacked** and select the built `dist/` directory directly.
- [ ] Verify toolbar icon click opens the side panel directly without errors.
- [ ] Verify onboarding screen appears on first launch and dismissing it saves state.

> **Note on Automated E2E vs Manual Smoke Testing**:
> Automated E2E via WebdriverIO (`pnpm e2e`) depends on ChromeDriver and host Chrome version compatibility for extension inspection. When automated E2E cannot run in a local environment (e.g., ChromeDriver shadow DOM or headless extension discovery constraints on specific Chrome builds), the manual steps in this checklist serve as the authoritative verification.

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
