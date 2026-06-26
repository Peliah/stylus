import {
  ensureOpenwaSession,
  getGatewaySnapshotForSession,
  getOpenwaSessionQr,
  registerWebhookForSession,
  startOpenwaSession,
} from './openwa-session';
import { sendLoginOtp, verifyLoginOtp } from './auth-otp';
import { normalizeWhatsAppPhone } from './phone';
import {
  createSetupId,
  deletePendingSetup,
  getPendingSetup,
  savePendingSetup,
  updatePendingSetup,
  type PendingSetup,
} from './setup-session';

export async function createSetupSession(): Promise<PendingSetup> {
  const setupId = createSetupId();
  const openwaSessionId = await ensureOpenwaSession(null, `stylus-setup-${setupId}`);

  const setup: PendingSetup = {
    setupId,
    openwaSessionId,
    connectedPhone: null,
    shopName: null,
    createdAt: new Date().toISOString(),
  };

  await savePendingSetup(setup);
  await startOpenwaSession(openwaSessionId);

  const webhookUrl = process.env.WEBHOOK_URL;
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (webhookUrl) {
    await registerWebhookForSession(setup.openwaSessionId, webhookUrl, webhookSecret);
  }

  return setup;
}

export async function getSetupStatus(setupId: string) {
  const setup = await getPendingSetup(setupId);
  if (!setup) {
    throw new Error('Setup session expired. Please start again.');
  }

  const gateway = await getGatewaySnapshotForSession(setup.openwaSessionId);

  if (gateway.state === 'connected' && gateway.phone) {
    const phone = normalizeWhatsAppPhone(gateway.phone);
    if (setup.connectedPhone !== phone) {
      await updatePendingSetup(setupId, { connectedPhone: phone });
      setup.connectedPhone = phone;
    }
  }

  return { setup, gateway };
}

export async function getSetupQr(setupId: string) {
  const setup = await getPendingSetup(setupId);
  if (!setup) {
    throw new Error('Setup session expired. Please start again.');
  }
  return getOpenwaSessionQr(setup.openwaSessionId);
}

export async function saveSetupShopName(setupId: string, shopName: string) {
  const trimmed = shopName.trim();
  if (!trimmed) throw new Error('Shop name is required');

  const updated = await updatePendingSetup(setupId, { shopName: trimmed });
  if (!updated) throw new Error('Setup session expired. Please start again.');
  return updated;
}

export async function sendSetupOtp(setupId: string) {
  const { setup } = await getSetupStatus(setupId);
  if (!setup.connectedPhone) {
    throw new Error('Connect WhatsApp first by scanning the QR code.');
  }
  return sendLoginOtp(setup.connectedPhone, { sessionId: setup.openwaSessionId });
}

export async function verifySetupOtp(setupId: string, code: string) {
  const setup = await getPendingSetup(setupId);
  if (!setup?.connectedPhone) {
    throw new Error('Setup session expired. Please start again.');
  }
  const phone = await verifyLoginOtp(setup.connectedPhone, code);
  return { setup, phone };
}

export async function consumeSetup(setupId: string): Promise<void> {
  await deletePendingSetup(setupId);
}
