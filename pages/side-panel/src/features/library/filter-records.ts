import type { AddressRecord, Confidence } from '@extension/shared';

export interface LibraryFilter {
  query: string;
  confidence: Confidence | 'all';
}

/**
 * In-memory search over the record list. MVP data volume is small, so a
 * normalized filter is sufficient (docs/02-TECHNICAL-ARCHITECTURE.md 7.1).
 *
 * Matches full or partial label, address, global note, tags, or any chain-level
 * note (case-insensitive). The confidence filter matches if any chain context
 * has that confidence.
 */
export const filterRecords = (records: AddressRecord[], filter: LibraryFilter): AddressRecord[] => {
  const query = filter.query.trim().toLowerCase();

  return records.filter(record => {
    if (filter.confidence !== 'all' && !record.chains.some(c => c.confidence === filter.confidence)) {
      return false;
    }

    if (!query) {
      return true;
    }

    return (
      record.label.toLowerCase().includes(query) ||
      record.address.toLowerCase().includes(query) ||
      record.note.toLowerCase().includes(query) ||
      record.tags.some(tag => tag.toLowerCase().includes(query)) ||
      record.chains.some(chain => chain.note.toLowerCase().includes(query))
    );
  });
};
