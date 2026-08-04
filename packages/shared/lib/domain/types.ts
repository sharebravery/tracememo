/**
 * TraceMemo domain types.
 *
 * Pure TypeScript types only - no runtime dependencies. Runtime validation
 * lives in `../validation/index.ts` and address utilities in `./address.ts`.
 *
 * See docs/02-TECHNICAL-ARCHITECTURE.md section 6.
 */

/** A 20-byte EVM address in 0x hexadecimal form. */
export type EvmAddress = `0x${string}`;

/** Canonical lookup key: `evm:<lowercase address>`. Chain/site agnostic. */
export type AddressKey = `evm:${string}`;

/** User-assigned confidence in an attribution. */
export type Confidence = 'confirmed' | 'likely' | 'unverified';

/** Supported explorer site identifiers. */
export type SiteId = 'etherscan' | 'basescan';

/** A captured source backing a record's conclusion. */
export interface ResearchSource {
  id: string;
  url: string;
  title: string;
  createdAt: string;
}

/** A persisted research record for one EVM address. */
export interface AddressRecord {
  key: AddressKey;
  address: EvmAddress;
  label: string;
  note: string;
  confidence: Confidence;
  sources: ResearchSource[];
  createdAt: string;
  updatedAt: string;
}

/**
 * User-facing input for creating or updating a record.
 * - `address` is validated and normalized by the background.
 * - `createdAt` is optional so edits can preserve the original timestamp.
 */
export interface AddressRecordInput {
  address: EvmAddress;
  label: string;
  note: string;
  confidence: Confidence;
  sources: ResearchSource[];
  createdAt?: string;
}

/** Page context sent from the content script to the background. */
export interface PageContext {
  tabUrl: string;
  pageTitle: string;
  site: SiteId;
  addresses: EvmAddress[];
  observedAt: string;
}

/** Small settings persisted via chrome.storage (not IndexedDB). */
export interface Settings {
  annotationsEnabled: boolean;
  onboardingSeen: boolean;
}

/** Versioned export envelope. */
export interface TraceMemoExport {
  format: 'tracememo';
  version: 1;
  exportedAt: string;
  records: AddressRecord[];
}

/** Counts returned by an import operation. */
export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  invalid: number;
}

/** Default settings used on first install. */
export const DEFAULT_SETTINGS: Settings = {
  annotationsEnabled: true,
  onboardingSeen: false,
};
