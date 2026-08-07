/**
 * TraceMemo domain types.
 *
 * Pure TypeScript types only - no runtime dependencies. Runtime validation
 * lives in `../validation/index.ts`, address-key helpers in `./address.ts`,
 * chain helpers in `./chains.ts`, and field limits in `../limits.ts`.
 *
 * Identity model: one global record per EVM address (shared label, tags, and
 * global note), plus independent per-chain contexts (chainId, chain-level note,
 * confidence, sources). The same address on Ethereum Mainnet (1) and Base
 * (8453) shares the global label but NOT the chain-level note, confidence, or
 * sources. The canonical global key is `evm:<lowercase address>`; chainId
 * lives in each chain context, never in the global key.
 */

/** Supported EVM chain ids. Ethereum Mainnet and Base only for MVP. */
export type SupportedChainId = 1 | 8453 | 137 | 56 | 42161;

/** Canonical global address key: `evm:<lowercase address>`. */
export type AddressKey = `evm:${string}`;

/** A 20-byte EVM address in 0x hexadecimal form. */
export type EvmAddress = `0x${string}`;

/** User-assigned confidence in an attribution. */
export type Confidence = 'confirmed' | 'likely' | 'unverified';

/** Supported explorer site identifiers. */
export type SiteId = 'etherscan' | 'basescan' | 'polygonscan' | 'bscscan' | 'arbiscan';

/** A persisted source backing a chain context. */
export interface ResearchSource {
  id: string;
  url: string;
  title: string;
  createdAt: string;
}

/** Per-chain research context. Chain-level note, confidence, and sources are
 * independent per chain and never shared across chains. */
export interface ChainContext {
  chainId: SupportedChainId;
  note: string;
  confidence: Confidence;
  sources: ResearchSource[];
  createdAt: string;
  updatedAt: string;
}

/** One global record per EVM address. Label, tags, and note are shared across
 * all chains; `chains` holds the independent per-chain contexts. */
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

/** Source input authored by the UI. The background generates `id` and `createdAt`. */
export interface SourceInput {
  url: string;
  title: string;
}

/** DTO for creating a global record. `chainId` and chain-level fields are
 * optional: a record can be saved with global context only (no chain context)
 * when the page is not a known explorer. */
export interface RecordCreateInput {
  address: EvmAddress;
  chainId?: SupportedChainId;
  label: string;
  tags: string[];
  note: string;
  chainNote?: string;
  confidence?: Confidence;
  sources?: SourceInput[];
}

/** DTO for updating global fields and upserting one chain context. */
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

/** Network context resolved from the page URL. Null on non-explorer pages. */
export interface NetworkContext {
  chainId: SupportedChainId;
  site: SiteId;
}

/** Page context as authored by the content script. `site` and `chainId` are
 * optional: present on explorer pages, absent on generic web pages. */
export interface PageContextInput {
  tabUrl: string;
  pageTitle: string;
  site?: SiteId;
  chainId?: SupportedChainId;
  addressKeys: AddressKey[];
  primaryAddressKey?: AddressKey;
  observedAt: string;
}

/** Stored page context for one tab. */
export interface PageContext extends PageContextInput {
  tabId: number;
}

/** Small settings persisted via chrome.storage (not IndexedDB). */
export interface Settings {
  annotationsEnabled: boolean;
  onboardingSeen: boolean;
}

/** Versioned export envelope. Version 2 = global record + per-chain contexts. */
export interface TraceMemoExport {
  format: 'tracememo';
  version: 2;
  exportedAt: string;
  records: AddressRecord[];
}

/** Counts returned by an import write operation. */
export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  invalid: number;
}

/** Counts returned by an import dry-run preview (no writes). */
export interface ImportPreview {
  total: number;
  created: number;
  updated: number;
  skipped: number;
}

/** Default settings used on first install. */
export const DEFAULT_SETTINGS: Settings = {
  annotationsEnabled: true,
  onboardingSeen: false,
};
