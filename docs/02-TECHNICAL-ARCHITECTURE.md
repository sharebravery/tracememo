# TraceMemo Technical Architecture

> Version: 2.0  
> Date: 2026-08-04  
> Scope: Chrome MVP only  
> Architecture: local-first, Manifest V3, minimum permissions

## 1. Fixed technical decisions

There are no framework alternatives in the MVP.

| Area | Decision |
|---|---|
| Project template | `Jonghakseo/chrome-extension-boilerplate-react-vite` |
| Template commit | `6fde1ace754505c3dc7b7df48d1a619e12aa42c4` |
| Template version | `0.5.0` |
| Package manager | pnpm from the local development environment |
| Extension runtime | Chrome Manifest V3 |
| UI | React `19.1.x` from template |
| Build | Vite `6.3.x` and Turborepo from template |
| Language | TypeScript strict |
| Styles | Tailwind CSS from template |
| UI primitives | Native HTML plus existing template UI; no Radix dependency in MVP |
| Local database | Dexie 4 over IndexedDB |
| Runtime validation | Zod |
| EVM address utilities | viem utility functions only |
| Unit tests | Vitest |
| DOM tests | Vitest + jsdom |
| Extension E2E | WebdriverIO already provided by template, kept minimal |
| CI | GitHub Actions |

Do not add WXT, Plasmo, Next.js, Supabase, Firebase, a server, or a wallet SDK to the MVP.

## 2. Template policy

The upstream template is archived. TraceMemo must use a pinned copy rather than treating the template as a maintained dependency.

### 2.1 Bootstrap commands

```bash
git clone https://github.com/Jonghakseo/chrome-extension-boilerplate-react-vite.git tracememo
cd tracememo
git checkout 6fde1ace754505c3dc7b7df48d1a619e12aa42c4
rm -rf .git
git init
pnpm install
```

Toolchain policy:

- use the Node.js and pnpm versions already installed on the developer's computer;
- do not run `nvm`, `corepack prepare`, global package-manager installation, or automatic toolchain upgrades;
- do not add exact Node.js or pnpm version checks to CI;
- if the local toolchain cannot install or build the pinned template, stop and report the incompatibility instead of changing versions automatically.

Before feature development:

1. change root `package.json` `name` to `tracememo`;
2. remove an exact `packageManager` pin when it prevents the local pnpm version from running;
3. update extension name and description in template locale files;
4. commit the lockfile produced by the local pnpm installation.

### 2.2 Remove unused template surfaces

Delete these product surfaces and their manifest references:

- `pages/popup`
- `pages/new-tab`
- `pages/options`
- `pages/devtools`
- `pages/devtools-panel`
- `pages/content-ui`
- `pages/content-runtime`

Keep:

- `chrome-extension`
- `pages/side-panel`
- `pages/content`
- `packages/shared`
- `packages/storage`
- `packages/i18n`
- `packages/ui`
- template build and test utilities required by the retained modules.

Update `pnpm-workspace.yaml` only when a deleted module remains matched through a broad glob and causes an error. Do not redesign the monorepo.

## 3. Runtime architecture

TraceMemo uses three runtime contexts.

```text
Etherscan / BaseScan page
        │
        │ content script detects complete EVM addresses
        ▼
Content script
        │
        │ typed chrome.runtime messages
        ▼
Background service worker
        │
        ├── validates requests with Zod
        ├── reads and writes IndexedDB through repository functions
        └── returns records for detected addresses
        │
        ▼
Side panel
        ├── Current Page
        ├── Library
        └── Settings
```

### 3.1 Single data boundary

Only the background service worker performs record CRUD.

The side panel and content script never write directly to IndexedDB. They use typed messages handled by the background service worker.

Benefits:

- one validation boundary;
- one conflict policy;
- no duplicate data logic across contexts;
- simpler tests;
- easier future sync migration.

### 3.2 Service worker lifecycle

The service worker can stop between events. Therefore:

- never rely on in-memory state for persisted records;
- open Dexie lazily inside handlers;
- make every handler idempotent where practical;
- reconnect the side panel from persisted state after suspension;
- do not use long-running timers.

## 4. Repository structure

Use the template structure and add only one domain package.

```text
tracememo/
├─ chrome-extension/
│  ├─ manifest.ts
│  ├─ public/
│  └─ src/background/
│     ├─ index.ts
│     ├─ message-router.ts
│     └─ side-panel.ts
├─ pages/
│  ├─ content/
│  │  └─ src/
│  │     ├─ index.ts
│  │     ├─ adapter/
│  │     │  ├─ etherscan-family.ts
│  │     │  └─ sites.ts
│  │     ├─ detection/
│  │     │  ├─ scan-addresses.ts
│  │     │  └─ normalize-address.ts
│  │     └─ annotation/
│  │        ├─ render-label.ts
│  │        └─ remove-labels.ts
│  └─ side-panel/
│     └─ src/
│        ├─ App.tsx
│        ├─ routes.tsx
│        ├─ features/
│        │  ├─ current-page/
│        │  ├─ library/
│        │  ├─ record-editor/
│        │  └─ settings/
│        └─ messaging/
├─ packages/
│  ├─ research-db/
│  │  ├─ package.json
│  │  └─ lib/
│  │     ├─ database.ts
│  │     ├─ schema.ts
│  │     ├─ records-repository.ts
│  │     └─ import-export.ts
│  ├─ shared/
│  │  └─ lib/
│  │     ├─ domain/
│  │     ├─ messages/
│  │     └─ validation/
│  ├─ storage/
│  ├─ i18n/
│  └─ ui/
├─ tests/
│  ├─ fixtures/
│  └─ e2e/
├─ docs/
│  ├─ privacy.md
│  └─ store-listing.md
├─ package.json
├─ pnpm-lock.yaml
└─ pnpm-workspace.yaml
```

Do not introduce `apps/`, a second frontend, or a backend directory in MVP.

## 5. Manifest design

The final manifest must contain only required surfaces.

Conceptual target:

```ts
const manifest = {
  manifest_version: 3,
  minimum_chrome_version: '116',
  default_locale: 'en',
  name: '__MSG_extensionName__',
  description: '__MSG_extensionDescription__',
  version: packageJson.version,
  permissions: ['storage', 'sidePanel', 'activeTab', 'scripting'],
  optional_host_permissions: ['<all_urls>'],
  host_permissions: [
    'https://etherscan.io/*',
    'https://basescan.org/*',
    'https://polygonscan.com/*',
    'https://bscscan.com/*',
    'https://arbiscan.io/*',
  ],
  background: {
    service_worker: 'background.js',
    type: 'module',
  },
  action: {
    default_title: '__MSG_openSidePanel__',
    default_icon: {
      '16': 'icon-16.png',
      '32': 'icon-32.png',
      '48': 'icon-48.png',
      '128': 'icon-128.png',
    },
  },
  icons: {
    '16': 'icon-16.png',
    '32': 'icon-32.png',
    '48': 'icon-48.png',
    '128': 'icon-128.png',
  },
  content_scripts: [
    {
      matches: [
        'https://etherscan.io/*',
        'https://basescan.org/*',
        'https://polygonscan.com/*',
        'https://bscscan.com/*',
        'https://arbiscan.io/*',
      ],
      js: ['content/all.iife.js'],
      run_at: 'document_idle',
    },
  ],
  side_panel: {
    default_path: 'side-panel/index.html',
  },
} satisfies ManifestType;
```

### 5.1 Forbidden manifest entries

MVP manifest must not contain:
- `<all_urls>` in default `host_permissions` or `content_scripts`;
- `tabs`;
- `notifications`;
- `cookies`;
- `history`;
- `webRequest`;
- `declarativeNetRequest`;
- `clipboardRead`;
- new-tab override;
- popup;
- devtools page;
- broad `web_accessible_resources` matches.

If a requested feature appears to need one of these, stop and update the specification before implementation.

### 5.2 Opening the side panel

On installation, configure toolbar clicks to open the side panel using `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })` when supported.

No popup fallback is required for MVP.

## 6. Domain model

### 6.1 Canonical identity

TraceMemo supports EVM addresses globally, with built-in chain context for Ethereum Mainnet (1), Base (8453), Polygon (137), BNB Smart Chain (56), and Arbitrum One (42161). One global record per EVM address holds a shared label/tags/note plus independent per-chain contexts.

```ts
export type SupportedChainId = 1 | 8453 | 137 | 56 | 42161;
export type EvmAddress = `0x${string}`;
export type AddressKey = `evm:${string}`;
```

Rules:

- validate with viem `isAddress`;
- display checksum address using viem `getAddress`;
- canonical global key is `evm:${address.toLowerCase()}` - one record per address; the chain id is NOT part of the key;
- each record stores per-chain contexts (chainId, chain-level note, confidence, sources); the same address across different explorers shares the global label/tags/note but NOT the chain-level note, confidence, or sources;
- the same address is not assumed to have the same contract code, purpose, or state across chains;
- Etherscan maps to 1, BaseScan to 8453, PolygonScan to 137, BscScan to 56, Arbiscan to 42161.

### 6.2 Record types

```ts
export type Confidence = 'confirmed' | 'likely' | 'unverified';

export interface ResearchSource {
  id: string;
  url: string;
  title: string;
  createdAt: string;
}

export interface ChainContext {
  chainId: SupportedChainId;
  note: string;
  confidence: Confidence;
  sources: ResearchSource[];
  createdAt: string;
  updatedAt: string;
}

export interface AddressRecord {
  key: AddressKey;
  address: EvmAddress;
  label: string;
  tags: string[];
  note: string;
  chains: ChainContext[];
  createdAt: string;
  updatedAt: string;
}

// UI-authored DTOs. The background generates key, timestamps, and source ids.
export interface SourceInput {
  url: string;
  title: string;
}

export interface RecordCreateInput {
  address: EvmAddress;
  chainId: SupportedChainId;
  label: string;
  tags: string[];
  note: string;
  chainNote: string;
  confidence: Confidence;
  sources: SourceInput[];
}

export interface RecordUpdateInput {
  key: AddressKey;
  chainId: SupportedChainId;
  label: string;
  tags: string[];
  note: string;
  chainNote: string;
  confidence: Confidence;
  sources: SourceInput[];
}
```

### 6.3 Validation

Zod schemas enforce:

- address validity;
- chain id is 1 or 8453;
- label length 1–60;
- note maximum 2,000;
- at most 20 tags per record (40 chars each); at most 2 chain contexts per record;
- at most 50 sources per chain context;
- source URL must be `https:` or `http:`, max 2,048 chars;
- source title maximum 300;
- page title max 300, page URL max 2,048;
- at most 500 account keys per request;
- import file max 10 MB;
- timestamps are ISO 8601 strings (offset allowed);
- import envelope version is supported.

The background owns `key`, `chainId`, `createdAt`, `updatedAt`, and source `id`. Source ids use `crypto.randomUUID()`. The UI submits only `RecordCreateInput` / `RecordUpdateInput`.

Do not render imported HTML. All user text is displayed as text content.

## 7. Local database

### 7.1 Dexie schema

Database name:

```text
tracememo
```

Initial schema:

```ts
class TraceMemoDatabase extends Dexie {
  records!: Table<AddressRecord, AddressKey>;

  constructor() {
    super('tracememo');
    // v1: evm:<address> (no chain). v2: eip155:<chainId>:<address> (per chain).
    // v3: one global record per address with per-chain contexts.
    this.version(1).stores({ records: '&key, address, label, confidence, createdAt, updatedAt' });
    this.version(2).stores({ records: '&key, chainId, address, label, confidence, createdAt, updatedAt' });
    this.version(3).stores({ records: '&key, address, label, updatedAt' });
  }
}
```

Search can start with normalized in-memory filtering because MVP data volume is small. Do not add a search engine.

### 7.2 Repository API

```ts
export interface RecordsRepository {
  list(): Promise<AddressRecord[]>;
  get(key: AddressKey): Promise<AddressRecord | undefined>;
  getMany(keys: AddressKey[]): Promise<AddressRecord[]>;
  upsert(input: AddressRecord): Promise<AddressRecord>;
  remove(key: AddressKey): Promise<void>;
  clear(): Promise<void>;
  exportAll(): Promise<TraceMemoExport>;
  importAll(input: TraceMemoExport): Promise<ImportResult>;
}
```

All repository functions are covered by unit tests.

### 7.3 Settings storage

Use the template `packages/storage` helpers for small settings only:

```ts
interface Settings {
  annotationsEnabled: boolean;
  onboardingSeen: boolean;
}
```

Do not store the research library in `chrome.storage.sync` or `chrome.storage.local`.

## 8. Message protocol

All cross-context messages are discriminated unions validated with Zod.

Required requests:

```ts
export type RequestMessage =
  | { type: 'PAGE_CONTEXT_SET'; payload: PageContextInput }
  | { type: 'PAGE_CONTEXT_GET'; payload: { tabId: number } }
  | { type: 'RECORDS_GET_MANY'; payload: { keys: AddressKey[] } }
  | { type: 'RECORD_LIST' }
  | { type: 'RECORD_GET'; payload: { key: AddressKey } }
  | { type: 'RECORD_CREATE'; payload: RecordCreateInput }
  | { type: 'RECORD_UPDATE'; payload: RecordUpdateInput }
  | { type: 'RECORD_DELETE'; payload: { key: AddressKey } }
  | { type: 'DATA_EXPORT' }
  | { type: 'DATA_IMPORT'; payload: { data: TraceMemoExport } }
  | { type: 'DATA_IMPORT_PREVIEW'; payload: { data: TraceMemoExport } }
  | { type: 'DATA_CLEAR' }
  | { type: 'SETTINGS_GET' }
  | { type: 'SETTINGS_UPDATE'; payload: Partial<Settings> }
  | { type: 'OPEN_RECORD'; payload: { key: AddressKey; chainId: SupportedChainId } };

type ImportPreview = { total: number; created: number; updated: number; skipped: number };
type ImportResult = { created: number; updated: number; skipped: number; invalid: number };
```

Response envelope:

```ts
type ResponseMessage<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };
```

Never include stack traces or user record content in production error messages.

### 8.2 Sender authorization

Every message is schema-validated AND authorized by sender. `sender.id` must equal `chrome.runtime.id`. Content scripts (a real `sender.tab.id` and an allowed `sender.tab.url`) may only send `PAGE_CONTEXT_SET`, `RECORDS_GET_MANY`, and `OPEN_RECORD`. The side panel (`sender.url` under the extension's own side-panel URL) may send record CRUD, import/export, clear, settings, `PAGE_CONTEXT_GET`, and `RECORDS_GET_MANY`. Content scripts may not call `DATA_IMPORT`, `DATA_CLEAR`, `DATA_EXPORT`, or any write outside the current page. `PAGE_CONTEXT_SET` always uses `sender.tab.id`; client-supplied tab ids are ignored.

### 8.1 Per-tab page context

The content script sends a `PageContextInput` after initial scan and meaningful DOM changes. The background takes the real tab id from `MessageSender.tab.id` and never trusts client-supplied tab ids:

```ts
export type SiteId = 'etherscan' | 'basescan' | 'polygonscan' | 'bscscan' | 'arbiscan';

interface PageContextInput {
  tabUrl: string;
  pageTitle: string;
  site?: SiteId;
  chainId?: SupportedChainId;
  addressKeys: AddressKey[];
  primaryAddressKey?: AddressKey;
  observedAt: string;
}

interface PageContext extends PageContextInput {
  tabId: number;
}
```

The content script extracts a `primaryAddressKey` from `/address/0x...` URL paths (never from `/tx/` transaction hashes) and includes it in the page context. The primary address is ensured to be in `addressKeys`, deduplicated, and sorted first.

The background stores page context per tab in `chrome.storage.session` under `tracememo-page-context:<tabId>` and removes it when the tab closes (`chrome.tabs.onRemoved`). The side panel reads the active tab id via `chrome.tabs.query` (no `tabs` permission) and requests that tab's context, so state never bleeds across tabs. Research records remain in IndexedDB.

## 9. Explorer adapter

### 9.1 Site configuration

```ts
interface ExplorerSite {
  id: SiteId;
  hostname: string;
}
```

Use one Etherscan-family adapter and a site registry. Do not duplicate scanner logic.

### 9.2 Address detection

Detection algorithm:

1. wait for `document_idle`;
2. inspect text nodes and address-link `href` values inside the page main content;
3. match only complete `0x` plus 40 hexadecimal characters;
4. validate every match with viem;
5. deduplicate by canonical key;
6. cap each scan at 500 unique addresses;
7. skip `script`, `style`, `textarea`, `input`, `code`, contenteditable, and TraceMemo-owned nodes;
8. send normalized addresses to the background;
9. request matching records;
10. render annotations for matches.

### 9.3 Dynamic pages

Use one debounced `MutationObserver`:

- debounce: 300 ms;
- rescan only changed subtrees when practical;
- disconnect while TraceMemo inserts its own nodes;
- hard stop after repeated adapter errors;
- remove observer on page unload.

### 9.4 Annotation rendering

Each annotation:

- is a small button or badge after the visible address;
- uses a TraceMemo-owned data attribute;
- displays the saved label and a small private-note cue;
- includes the complete canonical address in an accessible label;
- never replaces the original address text;
- opens or focuses the matching side-panel record;
- can be fully removed when annotations are disabled.

Use a Shadow DOM wrapper only if normal scoped CSS cannot prevent host-page collisions. Do not default to a complex injected React tree.

## 10. Side-panel UI

### 10.1 Navigation

Use three top-level routes or tabs:

- Current Page
- Library
- Settings

Do not add dashboards, charts, feeds, or marketing screens.

### 10.2 State management

Use React state and small feature hooks. Do not add Redux, Zustand, XState, TanStack Query, or another state library.

The background service worker is the data source. The side panel:

- requests fresh data on open;
- updates local UI after successful background responses;
- handles service-worker restart by retrying one failed message;
- displays a plain error state after retry failure.

### 10.3 UI component policy

Do not install `@radix-ui/themes`, the combined `radix-ui` package, shadcn/ui, or another component system for the MVP.

The side panel is a small form-and-list interface. Build it with:

- semantic native elements such as `button`, `form`, `label`, `input`, `textarea`, and `select`;
- Tailwind CSS and the retained template UI package;
- visible text labels instead of icon-only controls that depend on tooltips;
- an inline two-step delete state instead of a modal confirmation dialog.

Radix Primitives may be introduced after MVP only when a real interaction requires complex focus management or keyboard behavior, such as a dialog, popover, dropdown menu, or combobox. In that case:

1. install only the individual primitive required by that interaction;
2. document why a native element is insufficient;
3. keep product styling in Tailwind;
4. do not introduce Radix Themes.

Minimum product components:

- `AddressRow`
- `PrivateLabel`
- `RecordEditor`
- `ConfidenceSelect`
- `SourceList`
- `SearchInput`
- `InlineDeleteConfirm`
- `EmptyState`

## 11. Import and export

### 11.1 Export format

```ts
interface TraceMemoExport {
  format: 'tracememo';
  version: 2;
  exportedAt: string;
  records: AddressRecord[];
}
```

Filename:

```text
tracememo-backup-YYYY-MM-DD.json
```

### 11.2 Import procedure

1. read file as text;
2. enforce a 10 MB maximum;
3. parse JSON;
4. validate the envelope and every record strictly;
5. if ANY record is invalid, reject the whole file with no database writes;
6. otherwise run a dry-run preview returning create/update/skip counts;
7. user confirms;
8. run one Dexie transaction;
9. return result counts;
10. refresh annotations and library.

Import is all-or-nothing: a single invalid record rejects the entire file. There is no skip-invalid path.

Conflict rule:

- same canonical key: keep the record with the newer valid `updatedAt`;
- equal timestamps: keep the existing local record.

## 12. Logging and error handling

Production logs may contain:

- error code;
- app version;
- adapter ID;
- operation name.

Production logs must not contain:

- address;
- label;
- note;
- source URL or title;
- imported file contents;
- full current page URL.

No remote error service in MVP.

## 13. Testing

### 13.1 Unit tests

Required:

- address normalization and canonical key;
- Zod validation;
- repository CRUD;
- import conflict behavior;
- export round trip;
- search filtering;
- settings defaults.

### 13.2 Adapter fixture tests

Create minimal synthetic HTML fixtures for:

- Etherscan address page;
- Etherscan transaction table;
- BaseScan address page;
- dynamic row insertion;
- excluded editable and code regions;
- malformed and truncated addresses.

Tests cover:

- detection;
- deduplication;
- label insertion;
- annotation update;
- annotation removal;
- safe failure.

Do not copy full production pages into the repository.

### 13.3 E2E smoke test

Use the template's browser E2E setup to verify:

1. build and load unpacked extension;
2. toolbar opens side panel;
3. fixture page detects address;
4. user creates record;
5. label appears;
6. browser reload preserves record;
7. export, clear, and import restore it.

Do not build a large E2E suite before the primary smoke flow is stable.

## 14. CI

Pull-request CI runs in this order:

```text
pnpm install --frozen-lockfile
→ lint
→ type-check
→ unit and adapter tests
→ production build
→ manifest policy test
→ E2E smoke
→ build ZIP artifact
```

Manifest policy test fails when it finds:

- `<all_urls>`;
- a forbidden permission;
- an unsupported host;
- a popup, new-tab override, or devtools page;
- a remote script URL.

## 15. Performance limits

- maximum 500 unique addresses per scan;
- debounce MutationObserver at 300 ms;
- one annotation per visible address occurrence;
- avoid full-document rescans during every mutation;
- side panel initial interactive target: under 500 ms on a typical development machine;
- library target: 5,000 records without broken CRUD or search;
- extension must never block navigation or explorer controls.

## 16. Future architecture boundary

Cloud sync, payments, teams, public labels, and additional networks are not partially scaffolded in MVP.

The only future-proofing required now is:

- versioned export format;
- repository interface;
- typed message protocol;
- adapter registry;
- i18n-managed user strings.

Do not add unused provider interfaces, feature flags, backend clients, or billing abstractions.

## 17. Definition of done for a code change

A change is complete only when:

- it implements one approved milestone item;
- TypeScript passes;
- runtime inputs are validated where applicable;
- tests cover the changed behavior;
- no unnecessary permission is added;
- user research content is absent from production logs;
- page integration fails safely;
- build output loads in Chrome;
- documentation is updated when behavior changes;
- no unexplained TODO remains.

