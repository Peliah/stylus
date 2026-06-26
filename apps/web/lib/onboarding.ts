import { prisma } from './prisma';
import { getGatewaySnapshotForSession } from './openwa-session';
import { phoneDigitsMatch } from './phone';
import { resolveVendorSessionId } from './vendor-session';

export type OnboardingStep = 'whatsapp' | 'catalog' | 'complete';

export function getOnboardingStep(vendor: {
  onboardingComplete: boolean;
  whatsappLinkedAt: Date | null;
}): OnboardingStep {
  if (vendor.onboardingComplete) return 'complete';
  if (!vendor.whatsappLinkedAt) return 'whatsapp';
  return 'catalog';
}

export async function getOnboardingStatus(vendorId: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    include: { _count: { select: { products: true } } },
  });

  if (!vendor) {
    throw new Error('Vendor not found');
  }

  const sessionId = resolveVendorSessionId(vendor);
  const gateway = await getGatewaySnapshotForSession(sessionId);
  const phoneMatches =
    gateway.state === 'connected' &&
    gateway.phone !== null &&
    phoneDigitsMatch(vendor.phoneNumber, gateway.phone);

  return {
    vendor: {
      id: vendor.id,
      name: vendor.name,
      phoneNumber: vendor.phoneNumber,
      onboardingComplete: vendor.onboardingComplete,
      whatsappLinkedAt: vendor.whatsappLinkedAt,
      openwaSessionId: vendor.openwaSessionId,
      productCount: vendor._count.products,
    },
    step: getOnboardingStep(vendor),
    gateway,
    phoneMatches,
    sessionId,
  };
}

export async function linkVendorWhatsApp(vendorId: string) {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) throw new Error('Vendor not found');

  const sessionId = resolveVendorSessionId(vendor);
  const gateway = await getGatewaySnapshotForSession(sessionId);

  if (gateway.state !== 'connected' || !gateway.phone) {
    throw new Error('WhatsApp is not connected yet. Scan the QR code first.');
  }

  if (!phoneDigitsMatch(vendor.phoneNumber, gateway.phone)) {
    throw new Error(
      `Connected WhatsApp (+${gateway.phone}) does not match your account (+${vendor.phoneNumber.replace('@c.us', '')}). Log in with the number on this device.`
    );
  }

  return prisma.vendor.update({
    where: { id: vendorId },
    data: {
      openwaSessionId: sessionId,
      whatsappLinkedAt: new Date(),
    },
  });
}

export async function completeOnboarding(vendorId: string) {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) throw new Error('Vendor not found');

  if (!vendor.whatsappLinkedAt) {
    throw new Error('Connect WhatsApp before finishing setup.');
  }

  return prisma.vendor.update({
    where: { id: vendorId },
    data: { onboardingComplete: true },
  });
}

export async function updateVendorShopName(vendorId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Shop name is required');

  return prisma.vendor.update({
    where: { id: vendorId },
    data: { name: trimmed },
  });
}
