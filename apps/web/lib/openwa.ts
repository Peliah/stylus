import { enqueueOutboundMessage } from './outbound-queue';
import { deliverTextMessage } from './openwa-client';

function isSessionUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('not active') ||
    message.includes('disconnected') ||
    message.includes('session') ||
    message.includes('unauthorized') ||
    message.includes('failed to fetch') ||
    message.includes('econnrefused')
  );
}

export interface SendMessageResult {
  success: boolean;
  queued: boolean;
}

/**
 * Sends a text message, queueing for retry when the gateway is down.
 */
export async function sendMessage(
  chatId: string,
  text: string
): Promise<SendMessageResult> {
  try {
    await deliverTextMessage(chatId, text);
    return { success: true, queued: false };
  } catch (error) {
    if (isSessionUnavailableError(error)) {
      await enqueueOutboundMessage(chatId, text);
      return { success: false, queued: true };
    }

    console.error(`Error sending message to ${chatId}:`, error);
    return { success: false, queued: false };
  }
}

export {
  deliverTextMessage,
  getGatewaySnapshot,
  getSessionStatus,
  registerWebhook,
} from './openwa-client';
