import { getGatewaySnapshotForSession } from './openwa-session';
import { phoneDigitsMatch } from './phone';

const OPENWA_API_URL = process.env.OPENWA_API_URL || 'http://localhost:2785';
const OPENWA_API_KEY = process.env.OPENWA_API_KEY || 'openwa_secure_token';

interface OpenWASessionSummary {
  id: string;
  status?: string;
  phone?: string | null;
}

/**
 * Finds the connected OpenWA session for a vendor phone.
 * Prefers an active gateway session matching the phone, then the stored session id.
 */
export async function resolveMessagingSessionId(vendor: {
  phoneNumber: string;
  openwaSessionId: string | null;
}): Promise<string> {
  const response = await fetch(`${OPENWA_API_URL}/api/sessions`, {
    headers: { 'X-API-Key': OPENWA_API_KEY },
  });

  if (response.ok) {
    const sessions = (await response.json()) as OpenWASessionSummary[];
    const match = sessions.find(
      (session) =>
        (session.status === 'ready' || session.status === 'connected') &&
        session.phone &&
        phoneDigitsMatch(vendor.phoneNumber, session.phone)
    );
    if (match) return match.id;
  }

  if (vendor.openwaSessionId) {
    const snapshot = await getGatewaySnapshotForSession(vendor.openwaSessionId);
    if (snapshot.state === 'connected') {
      return vendor.openwaSessionId;
    }
  }

  if (vendor.openwaSessionId) {
    return vendor.openwaSessionId;
  }

  throw new Error('No connected WhatsApp session found for this vendor.');
}
