export interface WebhookMessageData {
  id?: string;
  from?: string;
  chatId?: string;
  body?: string;
  type?: string;
  hasMedia?: boolean;
  isGroup?: boolean;
  fromMe?: boolean;
}

const TEXT_MESSAGE_TYPES = new Set(['chat', 'text', 'conversation']);

/** Returns a short reason when the message should not be processed. */
export function getIgnoredMessageReason(data: WebhookMessageData): string | null {
  if (data.fromMe) return 'own_message';

  const chatId = data.chatId ?? data.from;
  if (!chatId) return 'missing_chat';

  if (
    data.isGroup === true ||
    chatId.endsWith('@g.us') ||
    data.from?.endsWith('@g.us')
  ) {
    return 'group_chat';
  }

  if (chatId.endsWith('@broadcast') || chatId === 'status@broadcast') {
    return 'broadcast';
  }

  return null;
}

/** OpenWA uses both "chat" and "text" for plain messages — only real media should flag. */
export function isMediaMessage(data: WebhookMessageData): boolean {
  if (data.hasMedia === true) return true;
  const type = (data.type ?? 'chat').toLowerCase();
  return !TEXT_MESSAGE_TYPES.has(type);
}
