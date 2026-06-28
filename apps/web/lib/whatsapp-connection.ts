import { prisma } from './prisma';
import type { GatewaySnapshot } from './gateway';
import { normalizeWhatsAppPhone, phoneDigitsMatch, whatsAppPhoneVariants } from './phone';
import { resolveMessagingSessionId } from './messaging-session';
import {
  ensureOpenwaSession,
  getGatewaySnapshotForSession,
  getOpenwaSessionQr,
  registerWebhookForSession,
  startOpenwaSession,
} from './openwa-session';

async function syncVendorSessionId(vendorId: string, sessionId: string, current: string | null) {
  if (current !== sessionId) {
    await prisma.vendor.update({
      where: { id: vendorId },
      data: { openwaSessionId: sessionId },
    });
  }
}

export async function getVendorConnectionStatus(vendor: {
  id: string;
  phoneNumber: string;
  openwaSessionId: string | null;
}): Promise<{ gateway: GatewaySnapshot; connected: boolean; sessionId: string | null }> {
  let sessionId: string | null = null;
  try {
    sessionId = await resolveMessagingSessionId(vendor);
  } catch {
    sessionId = vendor.openwaSessionId;
  }

  if (!sessionId) {
    return {
      gateway: {
        sessionId: '',
        rawStatus: 'DISCONNECTED',
        state: 'disconnected',
        phone: null,
        pushName: null,
        lastError: null,
      },
      connected: false,
      sessionId: null,
    };
  }

  const gateway = await getGatewaySnapshotForSession(sessionId);
  const connected =
    gateway.state === 'connected' &&
    gateway.phone !== null &&
    phoneDigitsMatch(vendor.phoneNumber, gateway.phone);

  return { gateway, connected, sessionId };
}

export async function prepareVendorWhatsApp(phoneInput: string) {
  const variants = whatsAppPhoneVariants(phoneInput);
  const phone = normalizeWhatsAppPhone(phoneInput);
  const vendor = await prisma.vendor.findFirst({
    where: { phoneNumber: { in: variants.length ? variants : [phone] } },
  });
  if (!vendor) {
    throw new Error('No shop found for this number. Get started to create one.');
  }

  const existingSessionId = vendor.openwaSessionId ?? null;
  let sessionId: string;
  try {
    sessionId = await resolveMessagingSessionId(vendor);
  } catch {
    const sessionName = `stylus-vendor-${vendor.id}`;
    sessionId = await ensureOpenwaSession(existingSessionId, sessionName);
  }

  await startOpenwaSession(sessionId);
  await syncVendorSessionId(vendor.id, sessionId, vendor.openwaSessionId);

  const webhookUrl = process.env.WEBHOOK_URL;
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (webhookUrl) {
    await registerWebhookForSession(sessionId, webhookUrl, webhookSecret);
  }

  const gateway = await getGatewaySnapshotForSession(sessionId);
  const connected =
    gateway.state === 'connected' &&
    gateway.phone !== null &&
    phoneDigitsMatch(vendor.phoneNumber, gateway.phone);

  return { vendor, sessionId, gateway, connected };
}

export async function getVendorWhatsAppQr(phoneInput: string) {
  const { sessionId } = await prepareVendorWhatsApp(phoneInput);
  return getOpenwaSessionQr(sessionId);
}

export async function getVendorWhatsAppStatus(phoneInput: string) {
  const variants = whatsAppPhoneVariants(phoneInput);
  const phone = normalizeWhatsAppPhone(phoneInput);
  const vendor = await prisma.vendor.findFirst({
    where: { phoneNumber: { in: variants.length ? variants : [phone] } },
  });
  if (!vendor) {
    return { exists: false as const, connected: false };
  }

  const { gateway, connected, sessionId } = await getVendorConnectionStatus(vendor);
  if (sessionId && sessionId !== vendor.openwaSessionId) {
    await syncVendorSessionId(vendor.id, sessionId, vendor.openwaSessionId);
  }

  return {
    exists: true as const,
    connected,
    phone: vendor.phoneNumber,
    gateway: {
      state: gateway.state,
      phone: gateway.phone,
      pushName: gateway.pushName,
    },
  };
}
