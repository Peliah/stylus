const seen = new Map<string, number>();
const TTL_MS = 5 * 60 * 1000;

/** Skip duplicate webhook deliveries for the same WhatsApp message id. */
export function isDuplicateWebhookMessage(messageId: string | undefined): boolean {
  if (!messageId) return false;

  const now = Date.now();
  for (const [id, expiresAt] of seen) {
    if (expiresAt <= now) seen.delete(id);
  }

  if (seen.has(messageId)) return true;
  seen.set(messageId, now + TTL_MS);
  return false;
}
