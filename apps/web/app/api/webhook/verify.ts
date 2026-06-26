/**
 * Webhook signature verification helper.
 * OpenWA signs with HMAC-SHA256; see their API spec (JSON payload, x-openwa-signature header).
 */
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

function sign(secret: string, payload: string): string {
  return (
    'sha256=' +
    crypto.createHmac('sha256', secret).update(payload).digest('hex')
  );
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET) {
    return true;
  }
  if (!signature) {
    return false;
  }

  // 1. Raw body (exact bytes OpenWA sent)
  if (timingSafeEqualStrings(signature, sign(WEBHOOK_SECRET, rawBody))) {
    return true;
  }

  try {
    const payload = JSON.parse(rawBody) as Record<string, unknown>;

    // 2. OpenWA docs: HMAC over JSON.stringify(payload) — often without embedded signature field
    const { signature: _embedded, ...withoutSignature } = payload;
    if (
      timingSafeEqualStrings(
        signature,
        sign(WEBHOOK_SECRET, JSON.stringify(withoutSignature))
      )
    ) {
      return true;
    }

    // 3. Full parsed object (some senders include signature in body)
    if (timingSafeEqualStrings(signature, sign(WEBHOOK_SECRET, JSON.stringify(payload)))) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}
