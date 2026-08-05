# TraceMemo Product Requirements Document

> Version: 2.0  
> Date: 2026-08-04  
> Status: MVP development source of truth  
> Market: English-first; initial focus on the United States and Europe

## 1. Product definition

### 1.1 One-line positioning

> TraceMemo is a private, local-first research notebook that restores a user's own context whenever an onchain address appears again.

### 1.2 Tagline

> Private context for every onchain address.

### 1.3 Core user outcome

A user sees an unfamiliar EVM address on Etherscan or BaseScan, saves:

- a short label;
- a note;
- a confidence level;
- one or more source links.

When the same address appears again, TraceMemo shows the saved label and makes the supporting context available without forcing the user to search through spreadsheets or notes.

## 2. Market reality and product wedge

Address labeling itself is not a new category. Block explorers and existing extensions already provide private name tags, address books, local labels, and large public label datasets.

Therefore, TraceMemo must not compete as “another address replacer.” Its wedge is:

1. **Evidence-backed notes** — every attribution can retain its source.
2. **Confidence-aware research** — confirmed and speculative claims are visibly different.
3. **Local-first ownership** — no account or cloud is required for the core workflow.
4. **Consistent workflow across supported explorers** - one global record per EVM address (shared label, tags, and global note) holds independent per-chain contexts (chain-level note, confidence, sources). The same address on Ethereum Mainnet and Base shares the global label but NOT the chain-level note, confidence, or sources. The same address is not assumed to have the same contract code, purpose, or state across chains.
5. **Portable data** — the user can export and re-import the full research library.

### 2.1 Positioning statement

For independent Web3 researchers and creators who repeatedly investigate wallet and contract addresses, TraceMemo is a browser-side research notebook that preserves private labels, reasoning, and evidence across block explorers. Unlike simple address replacement extensions, it keeps the source and confidence behind each label.

## 3. Target user

### 3.1 Primary user

Independent Web3 researcher or content creator who:

- uses Etherscan-family explorers several times per week;
- stores address notes in spreadsheets, Notion, Obsidian, or text files;
- needs to distinguish facts from hypotheses;
- values privacy and data portability;
- is comfortable installing a Chrome extension.

### 3.2 Secondary user after MVP validation

- small research teams;
- protocol operations teams;
- security analysts;
- investment research teams.

These users do not change the MVP scope.

### 3.3 Explicit non-users

The MVP is not for users seeking:

- a crypto wallet;
- trading, signals, copying, or automation;
- portfolio tracking;
- transaction simulation;
- compliance screening;
- automatic identity attribution;
- monitoring or alerts.

## 4. Product principles

1. **Research, not custody.** Never touch assets or wallet secrets.
2. **Evidence before certainty.** User labels are personal notes, not verified platform claims.
3. **Local before cloud.** Core value works offline after installation.
4. **Minimum permission.** Access only the supported explorer domains.
5. **One primary loop.** Detect → save context → restore context.
6. **Exportable by default.** The user owns the data.
7. **English-first.** UI strings remain i18n-ready, but MVP ships only English.

## 5. MVP scope

### 5.1 Supported environment

- Google Chrome stable;
- Chromium browsers may work but are not separate acceptance targets;
- desktop only;
- Manifest V3.

### 5.2 Supported sites

- `https://etherscan.io/*`
- `https://basescan.org/*`

Both are implemented through one Etherscan-family adapter with site configuration. Etherscan corresponds to Ethereum Mainnet (chain id 1); BaseScan corresponds to Base (chain id 8453).

### 5.3 Supported identifier

- valid 20-byte EVM address in `0x` hexadecimal form;
- normalized to checksum format for display;
- canonical lookup key is `evm:<lowercase address>` - one global record per address. The chain id is NOT part of the key; each record holds per-chain contexts (chainId, chain-level note, confidence, sources). The same address on Ethereum Mainnet (1) and Base (8453) shares the global label/tags/note but NOT the chain-level note, confidence, or sources;

MVP does not support ENS, transaction hashes, Solana addresses, Bitcoin addresses, or other chain-specific identifiers.

### 5.4 Record fields

Each record contains:

| Field | Required | Rule |
|---|---:|---|
Global record (one per address):

| Field | Required | Rule |
|---|---:|---|
| Address | Yes | Valid EVM address |
| Label | Yes | 1–60 characters, shared across chains |
| Tags | No | Up to 20 tags, shared across chains |
| Global note | No | Maximum 2,000 characters, shared across chains |
| Created at | Yes | ISO timestamp |
| Updated at | Yes | ISO timestamp |

Per-chain context (Ethereum and/or Base, independent):

| Field | Required | Rule |
|---|---:|---|
| Chain id | Yes | Ethereum Mainnet (1) or Base (8453) |
| Chain note | No | Maximum 2,000 characters, per chain |
| Confidence | Yes | `confirmed`, `likely`, or `unverified`, per chain |
| Sources | No | URL plus captured page title and creation time, per chain |

No custom tags, entity groups, risk score, or relationship graph in MVP.

## 6. Core functional requirements

### FR-01 Open the workspace

Clicking the toolbar icon opens the Chrome side panel.

The side panel has three views:

1. **Current Page**
2. **Library**
3. **Settings**

No popup is used.

### FR-02 Detect addresses on a supported page

On Etherscan or BaseScan, the extension:

- detects complete valid EVM addresses in relevant page content;
- deduplicates them;
- ignores scripts, styles, inputs, editable fields, and extension-owned DOM;
- sends only normalized addresses and current page metadata to the extension background context;
- does not call an RPC or external API.

### FR-03 Show existing context

When a detected address has a saved record:

- display a small, non-blocking label beside the address;
- provide an affordance to open the record in the side panel;
- mark the annotation as private user context;
- allow all inline annotations to be disabled in Settings.

The original address remains available and copyable.

### FR-04 Save a new record

From Current Page, the user can select a detected address and enter:

- label;
- note;
- confidence;
- source.

A record is one global entry per address. When creating a record, the user chooses the chain (Ethereum or Base) for the first chain context and enters the shared label/tags/global note plus the chain-level note/confidence/sources. Additional chain contexts can be added later. The Library shows one record per address.

The current page URL and title are offered as the default source. The user can remove the source before saving.

Successful save must:

- persist locally;
- update the side panel;
- update matching annotations on the page without a full page reload when practical.

### FR-05 Edit and delete a record

The Library view supports:

- edit label, note, confidence, and sources;
- delete with confirmation;
- copy address;
- open a saved source in a new tab.

### FR-06 Search the library

The Library view searches locally by:

- full or partial label;
- full or partial address;
- note text.

MVP needs one search box and one confidence filter. No advanced query language.

### FR-07 Manage sources

A record can contain multiple sources.

Each source stores:

- URL;
- page title;
- added timestamp.

The UI must visually separate the user's conclusion from its sources. Each source's `id` is generated by the background using `crypto.randomUUID()`; the UI never authors source ids or timestamps.

### FR-08 Import and export

Settings provides:

- export all data as versioned JSON;
- import a TraceMemo JSON file;
- preview counts before import;
- merge by canonical address;
- preserve the newest `updatedAt` record when an exact conflict exists;
- create a downloadable backup before destructive data clearing.

CSV is not part of MVP.

### FR-09 Clear local data

The user can clear all local research data after an explicit confirmation.

### FR-10 Explain privacy and permissions

The first-run screen and Settings must state:

- records remain on the device;
- the extension accesses Etherscan and BaseScan pages to find addresses and show private labels;
- no wallet connection or transaction capability exists;
- no analytics or external data transmission occurs in MVP.

## 7. Primary user flow

### 7.1 First saved record

1. User installs TraceMemo.
2. User opens an Etherscan address or transaction page.
3. User clicks the toolbar icon.
4. Side panel opens on Current Page.
5. User chooses an address.
6. User enters label, confidence, and optional note.
7. Current page is prefilled as a source.
8. User saves.
9. A private label appears beside matching addresses.

### 7.2 Context restored later

1. User opens Etherscan or BaseScan.
2. The content script detects an address with a saved record.
3. TraceMemo displays the private label.
4. User clicks the label.
5. Side panel opens the record with note, confidence, and sources.

## 8. UX rules

- Use visible text labels for primary actions; do not rely on tooltips to explain essential controls.
- Prefer native form controls and inline states over modal-heavy interaction.
- Keep the MVP side panel usable without a separate component framework.

- Side panel is the primary interface.
- Use plain English and avoid Web3 marketing language.
- Default confidence is `unverified`.
- `confirmed` must not look like an official TraceMemo verification badge.
- User-created labels must include a visible “Private” or “Your note” cue.
- Never replace or hide the complete source address.
- Inline labels must not overlap transaction controls or page navigation.
- Keyboard navigation and visible focus states are required.
- Empty states must explain the next action in one sentence.

## 9. Security and privacy requirements

### 9.1 Prohibited capabilities

MVP must not:

- access seed phrases or private keys;
- connect to `window.ethereum`;
- request wallet signatures;
- build or send transactions;
- query balances, tokens, or transaction history through RPC;
- request `<all_urls>`;
- use cookies, history, webRequest, or clipboard read permissions;
- upload addresses, labels, notes, sources, or page URLs;
- load executable code from a remote server;
- include advertising or analytics SDKs.

### 9.2 User-generated attribution

TraceMemo must not present a private user label as a platform-verified identity. UI copy must clarify that the label and confidence are created by the user.

## 10. MVP exclusions

The following are deferred until after real-user validation:

- more block explorers;
- arbitrary webpage scanning;
- context-menu capture;
- tags and folders;
- entity grouping;
- transaction hash notes;
- ENS;
- cloud sync and accounts;
- team workspaces;
- monitoring and alerts;
- public or purchased label datasets;
- AI summaries or attribution;
- payment and entitlement;
- Firefox release;
- mobile app.

## 11. Success criteria

The MVP is validated when, among the first 50 real users:

- at least 30 create a first record;
- at least 15 create five or more records in seven days;
- at least 10 return in the second week;
- at least 8 say source-backed context is more useful than a plain address label;
- no critical page breakage or privacy incident occurs;
- no user reports that TraceMemo appeared to be a wallet or trading tool.

These are validation targets, not analytics requirements. Initial measurement can use interviews, opt-in feedback, and Chrome Web Store data.

## 12. Release acceptance

The MVP is ready for private beta only when:

- [ ] toolbar icon opens the side panel;
- [ ] local CRUD works after browser restart;
- [ ] Etherscan and BaseScan detection tests pass;
- [ ] saved labels render without hiding the original address;
- [ ] source and confidence are stored and displayed;
- [ ] JSON export, clear, and import restore the same data;
- [ ] manifest contains no `<all_urls>` or unrelated permissions;
- [ ] build contains no remote executable code;
- [ ] production logs contain no user research content;
- [ ] privacy copy matches actual behavior;
- [ ] keyboard navigation works for the primary flow;
- [ ] release ZIP loads successfully as an unpacked extension;
- [ ] no P0 or P1 defect remains.

## 13. Post-MVP decision gate

Do not automatically build cloud sync.

After private beta, choose only one next direction based on evidence:

1. more Etherscan-family explorers;
2. better research organization such as tags and entities;
3. optional encrypted sync;
4. team collaboration.

A separate PRD is required before adding accounts, billing, public label data, or wallet-related capabilities.

