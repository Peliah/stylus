export async function register() {
  // Only run in the Node.js runtime environment (not Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { registerWebhook } = await import('./lib/openwa');
    
    // webhook endpoint of Next.js CRM
    const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhook';
    const webhookSecret = process.env.WEBHOOK_SECRET;

    console.log(`[Startup] Auto-registering CRM webhook at: ${webhookUrl}`);
    try {
      await registerWebhook(webhookUrl, webhookSecret);
    } catch (error) {
      console.error('[Startup] Failed to register webhook on boot:', error);
    }

    // Start worker regardless — webhook registration can be retried from OpenWA UI
    await import('./lib/worker');
    console.log('[Startup] Background BullMQ worker initialized.');

    await import('./lib/outbound-queue');
    console.log('[Startup] Outbound message retry worker initialized.');

    const { startHealthCheck } = await import('./lib/health');
    startHealthCheck();
  }
}
