import { redis } from './redis';
import { normalizeWhatsAppPhone } from './phone';

const SELF_CHAT_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

function selfChatKey(phone: string) {
  return `vendor:selfchat:${normalizeWhatsAppPhone(phone)}`;
}

/** Cache the WhatsApp chat id used for self-chat (@lid), learned from inbound webhooks. */
export async function saveVendorSelfChatId(phone: string, chatId: string) {
  if (!chatId) return;
  await redis.set(selfChatKey(phone), chatId, 'EX', SELF_CHAT_TTL_SECONDS);
}

export async function getVendorSelfChatId(phone: string): Promise<string | null> {
  return redis.get(selfChatKey(phone));
}
