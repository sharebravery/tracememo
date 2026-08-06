# TraceMemo Linear Implementation Plan

> Execute exactly in order.  
> One milestone per pull request unless a milestone is explicitly divided into smaller PRs.

## Global rule

Records are one global entry per EVM address: the canonical key is `evm:<lowercase address>` and holds a shared label/tags/note plus independent per-chain contexts (chainId, chain-level note, confidence, sources). The same address on Ethereum Mainnet (1) and Base (8453) shares the global label but NOT the chain-level note, confidence, or sources. Page context is isolated per Chrome tab. The side panel defaults to the Current Page view. The content script extracts a primary address from `/address/0x...` paths and sorts it first; `/tx/` hashes are never treated as addresses.

The canonical command set (used by CI and every milestone's acceptance) is: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm build`, and `pnpm zip`. Do not introduce conflicting commands or version pins.

Before every milestone:

1. read the PRD sections relevant to the milestone;
2. read the matching architecture sections;
3. list the exact acceptance criteria;
4. implement only that milestone;
5. run the required checks;
6. report gaps before moving forward.

## Milestone 1 — Template baseline

### Goal

Create a clean TraceMemo extension shell from the pinned boilerplate.

### Tasks

1. Clone and pin template commit.
2. Reinitialize Git history.
3. Use the Node.js and pnpm versions already installed locally; do not install, switch, or pin them.
4. Install dependencies and commit the lockfile produced by the local pnpm version.
5. Rename package and locale strings to TraceMemo.
6. Remove unused pages:
   - popup;
   - new tab;
   - options;
   - devtools;
   - devtools panel;
   - content UI;
   - content runtime.
7. Reduce manifest to:
   - background;
   - side panel;
   - content script;
   - Etherscan and BaseScan hosts;
   - `storage` and `sidePanel` permissions.
8. Configure toolbar click to open the side panel.
9. Add a manifest snapshot test.
10. Confirm that no Radix package or other component system was added.

### Acceptance criteria

- [ ] `pnpm install --frozen-lockfile` succeeds.
- [ ] `pnpm build` succeeds.
- [ ] extension loads unpacked in Chrome.
- [ ] toolbar icon opens an empty TraceMemo side panel.
- [ ] no popup, new-tab override, options page, or devtools page exists.
- [ ] manifest contains no `<all_urls>` or forbidden permission.
- [ ] no exact Node.js or pnpm version check was added.
- [ ] no Radix, Radix Themes, or other UI framework dependency was added.

### Stop condition

Do not create database models or page detection until every criterion passes.

---

## Milestone 2 — Local library CRUD

### Goal

Allow users to manually create and manage local address records in the side panel.

### Tasks

1. Add `packages/research-db`.
2. Add domain types and Zod schemas to `packages/shared`.
3. Implement Dexie schema version 1.
4. Implement repository CRUD.
5. Implement background message router and response envelope.
6. Build Library view.
7. Build Record Editor.
8. Add local search and confidence filter.
9. Add inline two-step delete confirmation without a modal library.
10. Add repository and validation tests.

### Acceptance criteria

- [ ] valid EVM address can be saved manually.
- [ ] invalid address is rejected before persistence.
- [ ] label, note, confidence, and sources persist after browser restart.
- [ ] record can be edited and deleted.
- [ ] search matches address, label, and note.
- [ ] background is the only record CRUD boundary.
- [ ] unit tests pass.
- [ ] no user record content appears in production logs.

### Stop condition

Do not inject labels into explorer pages until CRUD is stable after browser restart.

---

## Milestone 3 — Etherscan integration

### Goal

Complete the primary Detect → Save → Restore loop on Etherscan.

### Tasks

1. Implement site registry with Etherscan.
2. Implement complete-address detection.
3. Add excluded DOM regions and 500-address cap.
4. Send `PageContext` to background.
5. Build Current Page view.
6. Prefill current page as a source.
7. Request matching records for detected addresses.
8. Render private inline labels without replacing original addresses.
9. Make annotation click focus the record in side panel.
10. Add debounced MutationObserver.
11. Add minimal Etherscan fixtures and adapter tests.

### Acceptance criteria

- [ ] fixture address page detection works.
- [ ] fixture transaction list detection works.
- [ ] malformed and truncated addresses are ignored.
- [ ] editable and code regions are ignored.
- [ ] user can save a detected address from Current Page.
- [ ] matching label appears without hiding original address.
- [ ] page refresh restores label.
- [ ] dynamic inserted row receives label after debounce.
- [ ] adapter failure does not break page controls.

### Stop condition

Do not add BaseScan until Etherscan fixture and real-page smoke tests pass.

---

## Milestone 4 — BaseScan and research context

### Goal

Prove a consistent workflow across Etherscan and BaseScan (one global record per address; per-chain note/confidence/sources are independent; the shared label is the same across chains) and finish the evidence-backed workflow.

### Tasks

1. Add BaseScan site configuration to the same adapter.
2. Add BaseScan fixtures.
3. Verify an Etherscan-created record appears on BaseScan for the same address.
4. Finish source list add, open, and remove actions.
5. Add visible private-user cue.
6. Add confidence explanations.
7. Add annotation enable/disable setting.
8. Remove annotations immediately when disabled.
9. Verify keyboard navigation and focus states in primary flow.

### Acceptance criteria

- [ ] one global record per address is shown in the Library.
- [ ] the shared label appears on both Etherscan and BaseScan for the same address.
- [ ] chain-level note, confidence, and sources are independent per chain and are not copied across chains.
- [ ] sources are clearly separated from the user's conclusion.
- [ ] confidence defaults to `unverified`.
- [ ] no confidence state looks like an official platform verification.
- [ ] annotations can be disabled and removed.
- [ ] primary side-panel workflow is keyboard usable.
- [ ] both adapter fixture suites pass.

### Stop condition

Do not add more explorers, tags, or arbitrary-site scanning.

---

## Milestone 5 — Backup and private beta release

### Goal

Produce a safe, testable Chrome private-beta build.

### Tasks

1. Implement versioned JSON export.
2. Implement 10 MB import limit.
3. Implement import validation and preview.
4. Implement conflict policy in one Dexie transaction.
5. Implement clear-all with explicit confirmation.
6. Add first-run privacy explanation.
7. Add Settings privacy and permission copy.
8. Add docs:
   - `docs/privacy.md`;
   - `docs/store-listing.md`.
9. Add manifest policy test.
10. Add primary E2E smoke flow.
11. Add performance smoke test with 5,000 generated records.
12. Build and install production ZIP.
13. Test with at least five private testers before expanding distribution.

### Acceptance criteria

- [ ] export → clear → import restores equivalent data.
- [ ] invalid import is rejected without partial writes.
- [ ] conflict preview counts are correct.
- [ ] privacy copy matches observed network and storage behavior.
- [ ] no remote request sends user research content.
- [ ] manifest policy test passes.
- [ ] unit, adapter, build, and E2E smoke checks pass.
- [ ] production ZIP installs and completes the primary user flow.
- [ ] no P0 or P1 issue remains.

---

## After milestone 5

Stop feature development and run product validation.

Collect:

- number of users who create a first record;
- number who create five records in seven days;
- second-week return feedback;
- whether sources and confidence are valued over plain labels;
- permission and privacy concerns;
- page compatibility failures.

Create a new PRD before implementing any of these:

- cloud sync;
- authentication;
- payments;
- team workspaces;
- public labels;
- monitoring;
- AI attribution;
- wallet connection;
- additional address formats.

## Coding-agent prompt

Use this at the beginning of each milestone task:

```text
Read README.md, 01-PRD.md, 02-TECHNICAL-ARCHITECTURE.md, and 03-IMPLEMENTATION-PLAN.md.
Implement only Milestone N and its acceptance criteria.
Use the pinned chrome-extension-boilerplate-react-vite structure and the Node.js/pnpm versions already installed locally.
Do not add WXT, Radix, Radix Themes, another UI framework, a backend, wallet integration, RPC calls, analytics, <all_urls>, remote JavaScript, cloud sync, billing, or features from later milestones.
Keep the background service worker as the only record CRUD boundary.
Add tests for every changed domain rule or page-adapter behavior.
End with scope, files changed, commands/results, acceptance status, permission changes, limitations, and the next smallest task.
```

