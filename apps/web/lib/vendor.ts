import { getServerSession } from 'next-auth';
import { prisma } from './prisma';
import { authOptions } from './auth';
import { getGatewaySnapshotForSession } from './openwa-session';
import { phoneDigitsMatch } from './phone';

const OPENWA_API_URL = process.env.OPENWA_API_URL || 'http://localhost:2785';
const OPENWA_API_KEY = process.env.OPENWA_API_KEY || 'openwa_secure_token';

export const VENDOR_PHONE_NUMBER = process.env.VENDOR_PHONE_NUMBER || '';

interface OpenWASessionSummary {
  id: string;
  status?: string;
  phone?: string | null;
}

async function listGatewaySessions(): Promise<OpenWASessionSummary[]> {
  const response = await fetch(`${OPENWA_API_URL}/api/sessions`, {
    headers: { 'X-API-Key': OPENWA_API_KEY },
  });
  if (!response.ok) return [];
  return (await response.json()) as OpenWASessionSummary[];
}

function isActiveSession(status?: string): boolean {
  return status === 'ready' || status === 'connected';
}

export async function getOrCreateDefaultVendor() {
  let vendor = await prisma.vendor.findFirst({
    where: { phoneNumber: VENDOR_PHONE_NUMBER },
  });

  if (!vendor) {
    vendor = await prisma.vendor.create({
      data: {
        name: 'Stylus Vendor',
        phoneNumber: VENDOR_PHONE_NUMBER,
        onboardingComplete: true,
      },
    });
  }

  return vendor;
}

/** Prefer authenticated vendor; fall back for scripts/webhooks without a session. */
export async function getActiveVendor() {
  const session = await getServerSession(authOptions);
  if (session?.user?.vendorId) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: session.user.vendorId },
    });
    if (vendor) return vendor;
  }
  return getOrCreateDefaultVendor();
}

/** Resolve vendor for inbound webhooks from the connected gateway phone. */
export async function resolveWebhookVendor() {
  const linkedVendors = await prisma.vendor.findMany({
    where: { whatsappLinkedAt: { not: null } },
  });

  const sessions = await listGatewaySessions();
  for (const session of sessions) {
    if (!isActiveSession(session.status) || !session.phone) continue;

    const match = linkedVendors.find((vendor) =>
      phoneDigitsMatch(vendor.phoneNumber, session.phone!)
    );
    if (match) {
      if (match.openwaSessionId !== session.id) {
        await prisma.vendor.update({
          where: { id: match.id },
          data: { openwaSessionId: session.id },
        });
      }
      return match;
    }
  }

  for (const vendor of linkedVendors) {
    if (!vendor.openwaSessionId) continue;
    const gateway = await getGatewaySnapshotForSession(vendor.openwaSessionId);
    if (
      gateway.state === 'connected' &&
      gateway.phone &&
      phoneDigitsMatch(vendor.phoneNumber, gateway.phone)
    ) {
      return vendor;
    }
  }

  if (VENDOR_PHONE_NUMBER) {
    const vendor = await prisma.vendor.findUnique({
      where: { phoneNumber: VENDOR_PHONE_NUMBER },
    });
    if (vendor) return vendor;
  }

  return getOrCreateDefaultVendor();
}

