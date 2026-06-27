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

export interface SendMessageOptions {
  sessionId?: string;
}

/**
 * Sends a text message, queueing for retry when the gateway is down.
 */
export async function sendMessage(
  chatId: string,
  text: string,
  options?: SendMessageOptions
): Promise<SendMessageResult> {
  const sessionId = options?.sessionId;
  try {
    await deliverTextMessage(chatId, text, sessionId);
    return { success: true, queued: false };
  } catch (error) {
    if (isSessionUnavailableError(error)) {
      await enqueueOutboundMessage(chatId, text, sessionId);
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
