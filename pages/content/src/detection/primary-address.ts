import { isEvmAddress } from '@extension/shared';
import type { EvmAddress } from '@extension/shared';

/**
 * Extract the "primary" address from an explorer URL path. Only
 * `/address/0x...` is treated as a primary address; `/tx/0x...` (a transaction
 * hash) is never mistaken for an address.
 */
export const extractPrimaryAddressFromPath = (pathname: string): EvmAddress | undefined => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length >= 2 && segments[0] === 'address') {
    const candidate = segments[1];
    if (isEvmAddress(candidate)) {
      return candidate as EvmAddress;
    }
  }
  return undefined;
};
