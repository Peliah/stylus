import {
  type GatewaySnapshot,
  normalizeGatewayStatus,
} from './gateway';

const OPENWA_API_URL = process.env.OPENWA_API_URL || 'http://localhost:2785';
const OPENWA_API_KEY = process.env.OPENWA_API_KEY || 'openwa_secure_token';
const OPENWA_SESSION_ID = process.env.OPENWA_SESSION_ID || 'default';

interface OpenWARequestOptions {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  body?: Record<string, unknown>;
}

/**
 * Low-level request wrapper for OpenWA REST endpoints.
 */
async function openwaRequest({ method, path, body }: OpenWARequestOptions) {
  const url = `${OPENWA_API_URL}/api/sessions/${OPENWA_SESSION_ID}${path}`;
  const headers: Record<string, string> = {
    'X-API-Key': OPENWA_API_KEY,
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenWA API Error [${response.status}]: ${errText || response.statusText}`);
  }

  return await response.json();
}

interface ContactCheckResponse {
  exists?: boolean;
  whatsappId?: string;
  data?: {
    exists?: boolean;
    chatId?: string;
    whatsappId?: string;
  };
}

/**
 * Resolves a phone number to the chat id OpenWA/WhatsApp expects (often @lid, not @c.us).
 */
export async function resolveWhatsAppChatId(phoneInput: string): Promise<string> {
  const digits = phoneInput.replace(/@.*$/, '').replace(/\D/g, '');
  if (!digits) {
    throw new Error('Enter a valid phone number');
  }

  const url = `${OPENWA_API_URL}/api/sessions/${OPENWA_SESSION_ID}/contacts/check/${digits}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'X-API-Key': OPENWA_API_KEY },
  });

  if (!response.ok) {
    throw new Error('Could not verify WhatsApp number. Is the gateway connected?');
  }

  const data = (await response.json()) as ContactCheckResponse;
  const exists = data.exists ?? data.data?.exists;
  const chatId = data.whatsappId ?? data.data?.whatsappId ?? data.data?.chatId;

  if (!exists || !chatId) {
    throw new Error('This number is not registered on WhatsApp.');
  }

  return chatId;
}

/**
 * Sends immediately via OpenWA — throws on failure.
 * Resolves @c.us ids to the canonical WhatsApp chat id before sending.
 */
export async function deliverTextMessage(chatId: string, text: string): Promise<void> {
  const targetChatId =
    chatId.includes('@lid') || !chatId.endsWith('@c.us')
      ? chatId
      : await resolveWhatsAppChatId(chatId);

  try {
    await openwaRequest({
      method: 'POST',
      path: '/messages/send-text',
      body: { chatId: targetChatId, text },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('[500]')) {
      throw new Error(
        'WhatsApp could not deliver to this number. Check the number and try again.'
      );
    }
    throw error;
  }
}

/**
 * Registers our Next.js webhook receiver endpoint inside the OpenWA gateway.
 */
export async function registerWebhook(webhookUrl: string, secret?: string): Promise<boolean> {
  try {
    await openwaRequest({
      method: 'POST',
      path: '/webhooks',
      body: {
        url: webhookUrl,
        events: ['message.received', 'message.sent'],
        secret: secret || undefined,
      },
    });
    console.log(`Successfully registered OpenWA webhook to ${webhookUrl}`);
    return true;
  } catch (error) {
    console.error(`Failed to register webhook to ${webhookUrl}:`, error);
    return false;
  }
}

/**
 * Fetches OpenWA session health for monitoring and dashboard status.
 */
export async function getGatewaySnapshot(): Promise<GatewaySnapshot> {
  try {
    const url = `${OPENWA_API_URL}/api/sessions/${OPENWA_SESSION_ID}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'X-API-Key': OPENWA_API_KEY },
    });

    if (!response.ok) {
      return {
        sessionId: OPENWA_SESSION_ID,
        rawStatus: 'DISCONNECTED',
        state: 'disconnected',
        phone: null,
        pushName: null,
        lastError: `HTTP ${response.status}`,
      };
    }

    const data = (await response.json()) as {
      status?: string;
      phone?: string;
      pushName?: string;
      lastError?: string | null;
    };

    const rawStatus = data.status || 'unknown';
    return {
      sessionId: OPENWA_SESSION_ID,
      rawStatus,
      state: normalizeGatewayStatus(rawStatus),
      phone: data.phone ?? null,
      pushName: data.pushName ?? null,
      lastError: data.lastError ?? null,
    };
  } catch {
    return {
      sessionId: OPENWA_SESSION_ID,
      rawStatus: 'UNREACHABLE',
      state: 'unreachable',
      phone: null,
      pushName: null,
      lastError: 'OpenWA API unreachable',
    };
  }
}

/** @deprecated Use getGatewaySnapshot() */
export async function getSessionStatus(): Promise<{ success: boolean; status: string }> {
  const snapshot = await getGatewaySnapshot();
  return {
    success: snapshot.state !== 'unreachable',
    status: snapshot.rawStatus,
  };
}
