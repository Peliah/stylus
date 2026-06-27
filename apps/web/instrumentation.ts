export async function register() {
  // Only run in the Node.js runtime environment (not Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { prisma } = await import('./lib/prisma');
    const { ensureWebhooksForSession } = await import('./lib/openwa-session');
    const { phoneDigitsMatch } = await import('./lib/phone');

    const OPENWA_API_URL = process.env.OPENWA_API_URL || 'http://localhost:2785';
    const OPENWA_API_KEY = process.env.OPENWA_API_KEY || 'openwa_secure_token';
    const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhook';
    const webhookSecret = process.env.WEBHOOK_SECRET;

    console.log(`[Startup] Registering CRM webhook at: ${webhookUrl}`);
    try {
      const linkedVendors = await prisma.vendor.findMany({
        where: { whatsappLinkedAt: { not: null }, openwaSessionId: { not: null } },
        select: { openwaSessionId: true, phoneNumber: true },
      });

      const sessionIds = new Set(
        linkedVendors
          .map((vendor) => vendor.openwaSessionId)
          .filter((sessionId): sessionId is string => Boolean(sessionId))
      );

      // Also register on any connected gateway session matching a linked vendor phone
      const sessionsRes = await fetch(`${OPENWA_API_URL}/api/sessions`, {
        headers: { 'X-API-Key': OPENWA_API_KEY },
      });
      if (sessionsRes.ok) {
        const sessions = (await sessionsRes.json()) as Array<{
          id: string;
          status?: string;
          phone?: string | null;
        }>;
        for (const vendor of linkedVendors) {
          const match = sessions.find(
            (session) =>
              (session.status === 'ready' || session.status === 'connected') &&
              session.phone &&
              phoneDigitsMatch(vendor.phoneNumber, session.phone)
          );
          if (match) sessionIds.add(match.id);
        }
      }

      if (sessionIds.size === 0) {
        const { registerWebhook } = await import('./lib/openwa');
        await registerWebhook(webhookUrl, webhookSecret);
      } else {
        for (const sessionId of sessionIds) {
          await ensureWebhooksForSession(sessionId, [webhookUrl], webhookSecret);
        }
      }
    } catch (error) {
      console.error('[Startup] Failed to register webhook on boot:', error);
    }

    await import('./lib/worker');
    console.log('[Startup] Background BullMQ worker initialized.');

    await import('./lib/outbound-queue');
    console.log('[Startup] Outbound message retry worker initialized.');

    const { startHealthCheck } = await import('./lib/health');
    startHealthCheck();
  }
}
