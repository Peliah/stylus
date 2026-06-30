// import {
//   ensureOpenwaSession,
//   getGatewaySnapshotForSession,
//   getOpenwaSessionQr,
//   registerWebhookForSession,
//   startOpenwaSession,
// } from './openwa-session';
// import { sendLoginOtp, verifyLoginOtp } from './auth-otp';
// import { normalizeWhatsAppPhone } from './phone';
// import {
//   createSetupId,
//   deletePendingSetup,
//   getPendingSetup,
//   savePendingSetup,
//   updatePendingSetup,
//   type PendingSetup,
// } from './setup-session';

// export async function createSetupSession(): Promise<PendingSetup> {
//   const setupId = createSetupId();
//   const openwaSessionId = await ensureOpenwaSession(null, `stylus-setup-${setupId}`);

//   const setup: PendingSetup = {
//     setupId,
//     openwaSessionId,
//     connectedPhone: null,
//     shopName: null,
//     createdAt: new Date().toISOString(),
//   };

//   await savePendingSetup(setup);
//   await startOpenwaSession(openwaSessionId);

//   const webhookUrl = process.env.WEBHOOK_URL;
//   const webhookSecret = process.env.WEBHOOK_SECRET;
//   if (webhookUrl) {
//     await registerWebhookForSession(setup.openwaSessionId, webhookUrl, webhookSecret);
//   }

//   return setup;
// }

// export async function getSetupStatus(setupId: string) {
//   const setup = await getPendingSetup(setupId);
//   if (!setup) {
//     throw new Error('Setup session expired. Please start again.');
//   }

//   const gateway = await getGatewaySnapshotForSession(setup.openwaSessionId);

//   if (gateway.state === 'connected' && gateway.phone) {
//     const phone = normalizeWhatsAppPhone(gateway.phone);
//     if (setup.connectedPhone !== phone) {
//       await updatePendingSetup(setupId, { connectedPhone: phone });
//       setup.connectedPhone = phone;
//     }
//   }

//   return { setup, gateway };
// }

// export async function getSetupQr(setupId: string) {
//   const setup = await getPendingSetup(setupId);
//   if (!setup) {
//     throw new Error('Setup session expired. Please start again.');
//   }
//   return getOpenwaSessionQr(setup.openwaSessionId);
// }

// export async function saveSetupShopName(setupId: string, shopName: string) {
//   const trimmed = shopName.trim();
//   if (!trimmed) throw new Error('Shop name is required');

//   const updated = await updatePendingSetup(setupId, { shopName: trimmed });
//   if (!updated) throw new Error('Setup session expired. Please start again.');
//   return updated;
// }

// export async function sendSetupOtp(setupId: string) {
//   const { setup } = await getSetupStatus(setupId);
//   if (!setup.connectedPhone) {
//     throw new Error('Connect WhatsApp first by scanning the QR code.');
//   }
//   return sendLoginOtp(setup.connectedPhone, { sessionId: setup.openwaSessionId });
// }

// export async function verifySetupOtp(setupId: string, code: string) {
//   const setup = await getPendingSetup(setupId);
//   if (!setup?.connectedPhone) {
//     throw new Error('Setup session expired. Please start again.');
//   }
//   const phone = await verifyLoginOtp(setup.connectedPhone, code);
//   return { setup, phone };
// }

// export async function consumeSetup(setupId: string): Promise<void> {
//   await deletePendingSetup(setupId);
// }
import {
  ensureOpenwaSession,
  getGatewaySnapshotForSession,
  getOpenwaSessionQr,
  registerWebhookForSession,
  startOpenwaSession,
} from './openwa-session';
import { sendLoginOtp, verifyLoginOtp } from './auth-otp';
import { deliverTextMessage } from './openwa-client';
import { getVendorSelfChatId } from './vendor-chat-id';
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

  // The OTP must be delivered to the self-chat, but WhatsApp Web now requires
  // an @lid (not @c.us) for that chat. We only learn the @lid from an inbound
  // webhook event (fromMe message), so prime it with a throwaway self-message
  // and give the webhook a moment to record it before sending the real OTP.
  await primeSelfChatId(setup.connectedPhone, setup.openwaSessionId);

  return sendLoginOtp(setup.connectedPhone, { sessionId: setup.openwaSessionId });
}

/**
 * Sends a harmless self-chat message to force WhatsApp/OpenWA to emit a
 * message.sent webhook event for our own number, which is what lets the
 * webhook handler cache the real @lid via saveVendorSelfChatId. Without this,
 * the very first OTP attempt after a fresh setup has no cached lid yet and
 * fails with "No LID for user".
 */
async function primeSelfChatId(phone: string, sessionId: string): Promise<void> {
  const existing = await getVendorSelfChatId(phone);
  if (existing) return; // already cached from a previous self-chat round-trip

  try {
    await deliverTextMessage(phone, 'Stylus setup: connecting your WhatsApp…', sessionId);
  } catch {
    // If even the priming send fails, fall through — sendLoginOtp will
    // surface a clear error to the user (e.g. "open your self-chat and
    // send any message, then tap Resend").
    return;
  }

  // Give the webhook a brief moment to receive the fromMe event and call
  // saveVendorSelfChatId before we try sending the OTP itself.
  for (let attempt = 0; attempt < 5; attempt++) {
    const cached = await getVendorSelfChatId(phone);
    if (cached) return;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
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