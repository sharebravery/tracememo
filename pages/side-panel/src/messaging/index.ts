import type { RequestMessage, ResponseMap, ResponseMessage } from '@extension/shared';

/**
 * Typed wrapper around `chrome.runtime.sendMessage`.
 *
 * The side panel never touches IndexedDB directly; every data operation is a
 * request to the background service worker. The response is validated by shape
 * (`ok` discriminator) and its `data` is typed via `ResponseMap`.
 */
export const sendMessage = async <T extends RequestMessage['type']>(
  message: Extract<RequestMessage, { type: T }>,
): Promise<ResponseMap[T]> => {
  const response = (await chrome.runtime.sendMessage(message)) as ResponseMessage<ResponseMap[T]>;

  if (!response.ok) {
    throw new Error(response.error.message);
  }

  return response.data;
};
