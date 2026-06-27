import { getServerSession } from 'next-auth';
import { prisma } from './prisma';
import { authOptions } from './auth';
import { getGatewaySnapshotForSession } from './openwa-session';
import { phoneDigitsMatch } from './phone';

export const VENDOR_PHONE_NUMBER = process.env.VENDOR_PHONE_NUMBER || '';

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

/** Resolve vendor for inbound webhooks from connected gateway phone. */
export async function resolveWebhookVendor() {
  const linkedVendors = await prisma.vendor.findMany({
    where: { whatsappLinkedAt: { not: null } },
  });

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

