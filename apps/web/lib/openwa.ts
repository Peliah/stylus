const OPENWA_API_URL = process.env.OPENWA_API_URL || 'http://localhost:2785';
const OPENWA_API_KEY = process.env.OPENWA_API_KEY || 'openwa_secure_token';
const OPENWA_SESSION_ID = process.env.OPENWA_SESSION_ID || 'default';

interface OpenWARequestOptions {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  body?: any;
}

/**
 * Low-level request wrapper for OpenWA REST endpoints.
 */
async function openwaRequest({ method, path, body }: OpenWARequestOptions) {
  const url = `${OPENWA_API_URL}/api/sessions/${OPENWA_SESSION_ID}${path}`;
  const headers: Record<string, string> = {
    'X-API-Key': OPENWA_API_KEY,
    'Content-Type': applicationJsonHeader(body),
  };

  function applicationJsonHeader(data: any): string {
    return data ? 'application/json' : '';
  }

  // Remove content-type if body is empty to prevent issues
  if (!body) {
    delete headers['Content-Type'];
  }

  try {
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
  } catch (error) {
    console.error(`Failed to call OpenWA path ${path}:`, error);
    throw error;
  }
}

/**
 * Sends a standard text message to a specific WhatsApp chat ID (e.g. "123456789@c.us").
 */
export async function sendMessage(chatId: string, text: string): Promise<{ success: boolean; data: any }> {
  try {
    const data = await openwaRequest({
      method: 'POST',
      path: '/messages/send-text',
      body: {
        chatId,
        text,
      },
    });
    return { success: true, data };
  } catch (error) {
    console.error(`Error sending message to ${chatId}:`, error);
    return { success: false, data: null };
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
        secret: secret || undefined, // Used for signing signatures
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
 * Checks connection health of the OpenWA gateway session.
 */
export async function getSessionStatus(): Promise<{ success: boolean; status: string }> {
  try {
    // OpenWA session detail endpoint
    const url = `${OPENWA_API_URL}/api/sessions/${OPENWA_SESSION_ID}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': OPENWA_API_KEY,
      },
    });

    if (!response.ok) {
      return { success: false, status: 'DISCONNECTED' };
    }

    const data = await response.json();
    return { success: true, status: data.status || 'CONNECTED' };
  } catch (error) {
    return { success: false, status: 'UNREACHABLE' };
  }
}
