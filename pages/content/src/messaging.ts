import type { RequestMessage, ResponseMap, ResponseMessage } from '@extension/shared';

/**
 * Typed wrapper around `chrome.runtime.sendMessage` for the content script.
 * The content script never touches IndexedDB; it asks the background for
 * matching records and reports page context.
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
