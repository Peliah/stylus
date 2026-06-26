import { prisma } from './prisma';
import type { GatewaySnapshot } from './gateway';
import { normalizeWhatsAppPhone, phoneDigitsMatch, whatsAppPhoneVariants } from './phone';
import {
  ensureOpenwaSession,
  getGatewaySnapshotForSession,
  getOpenwaSessionQr,
  registerWebhookForSession,
  startOpenwaSession,
} from './openwa-session';

export async function getVendorConnectionStatus(vendor: {
  phoneNumber: string;
  openwaSessionId: string | null;
}): Promise<{ gateway: GatewaySnapshot; connected: boolean }> {
  if (!vendor.openwaSessionId) {
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
    };
  }

  const gateway = await getGatewaySnapshotForSession(vendor.openwaSessionId);
  const connected =
    gateway.state === 'connected' &&
    gateway.phone !== null &&
    phoneDigitsMatch(vendor.phoneNumber, gateway.phone);

  return { gateway, connected };
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
  const sessionName = `stylus-vendor-${vendor.id}`;
  const sessionId = await ensureOpenwaSession(existingSessionId, sessionName);
  await startOpenwaSession(sessionId);

  if (vendor.openwaSessionId !== sessionId) {
    await prisma.vendor.update({
      where: { id: vendor.id },
      data: { openwaSessionId: sessionId },
    });
  }

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

  if (!vendor.openwaSessionId) {
    return {
      exists: true as const,
      connected: false,
      phone: vendor.phoneNumber,
      gateway: {
        state: 'disconnected' as const,
        phone: null,
        pushName: null,
      },
    };
  }

  const gateway = await getGatewaySnapshotForSession(vendor.openwaSessionId);
  const connected =
    gateway.state === 'connected' &&
    gateway.phone !== null &&
    phoneDigitsMatch(vendor.phoneNumber, gateway.phone);

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
