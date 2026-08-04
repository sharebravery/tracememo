/**
 * Address extraction helpers.
 *
 * Only complete `0x` + 40 hexadecimal character sequences are considered.
 * Validation and canonical-key derivation come from `@extension/shared` (viem).
 */
export const ADDRESS_REGEX = /\b0x[0-9a-fA-F]{40}\b/g;

/** Non-global pattern for cheap "contains an address" checks. */
export const ADDRESS_TEST = /0x[0-9a-fA-F]{40}/;

/** Extract every complete address candidate from a string. */
export const extractAddressCandidates = (text: string): string[] => [...text.matchAll(ADDRESS_REGEX)].map(m => m[0]);
