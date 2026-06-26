const OPENWA_API_URL = process.env.OPENWA_API_URL || 'http://localhost:2785';
const OPENWA_API_KEY = process.env.OPENWA_API_KEY || 'openwa_secure_token';
const DEFAULT_SESSION_ID = process.env.OPENWA_SESSION_ID || 'default';

import {
  type GatewaySnapshot,
  normalizeGatewayStatus,
} from './gateway';

async function openwaSessionFetch(
  sessionId: string,
  path: string,
  init?: RequestInit
): Promise<Response> {
  const url = `${OPENWA_API_URL}/api/sessions/${sessionId}${path}`;
  return fetch(url, {
    ...init,
    headers: {
      'X-API-Key': OPENWA_API_KEY,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
}

export function getDefaultSessionId(): string {
  return DEFAULT_SESSION_ID;
}

export async function ensureOpenwaSession(
  sessionId: string,
  name: string
): Promise<void> {
  const existing = await openwaSessionFetch(sessionId, '', { method: 'GET' });
  if (existing.ok) return;

  const response = await fetch(`${OPENWA_API_URL}/api/sessions`, {
    method: 'POST',
    headers: {
      'X-API-Key': OPENWA_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: sessionId, name }),
  });

  if (!response.ok && response.status !== 409) {
    const text = await response.text();
    throw new Error(`Failed to create OpenWA session: ${text}`);
  }
}

export async function startOpenwaSession(sessionId: string): Promise<void> {
  const response = await openwaSessionFetch(sessionId, '/start', { method: 'POST' });
  if (!response.ok && response.status !== 409) {
    const text = await response.text();
    throw new Error(`Failed to start OpenWA session: ${text}`);
  }
}

export interface SessionQrResult {
  qr: string | null;
  status: string;
  message?: string;
}

export async function getOpenwaSessionQr(sessionId: string): Promise<SessionQrResult> {
  const snapshot = await getGatewaySnapshotForSession(sessionId);
  if (snapshot.state === 'connected') {
    return { qr: null, status: 'connected' };
  }

  const response = await openwaSessionFetch(sessionId, '/qr', { method: 'GET' });
  const data = (await response.json()) as {
    qr?: string;
    message?: string;
    status?: string;
  };

  if (response.ok && data.qr) {
    return { qr: data.qr, status: snapshot.rawStatus };
  }

  return {
    qr: null,
    status: snapshot.rawStatus,
    message: data.message ?? 'QR not available yet. Try again in a few seconds.',
  };
}

export async function getGatewaySnapshotForSession(
  sessionId: string
): Promise<GatewaySnapshot> {
  try {
    const response = await openwaSessionFetch(sessionId, '', { method: 'GET' });

    if (!response.ok) {
      return {
        sessionId,
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
      sessionId,
      rawStatus,
      state: normalizeGatewayStatus(rawStatus),
      phone: data.phone ?? null,
      pushName: data.pushName ?? null,
      lastError: data.lastError ?? null,
    };
  } catch {
    return {
      sessionId,
      rawStatus: 'UNREACHABLE',
      state: 'unreachable',
      phone: null,
      pushName: null,
      lastError: 'OpenWA API unreachable',
    };
  }
}

export async function registerWebhookForSession(
  sessionId: string,
  webhookUrl: string,
  secret?: string
): Promise<boolean> {
  try {
    const response = await openwaSessionFetch(sessionId, '/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        url: webhookUrl,
        events: ['message.received', 'message.sent'],
        secret: secret || undefined,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Failed to register webhook for ${sessionId}:`, text);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Failed to register webhook for ${sessionId}:`, error);
    return false;
  }
}
