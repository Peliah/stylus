import { NextResponse } from 'next/server';
import { getOutboundPendingCount } from '../../../lib/outbound-queue';
import { getActiveVendor } from '../../../lib/vendor';
import { getVendorConnectionStatus } from '../../../lib/whatsapp-connection';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const vendor = await getActiveVendor();
    const [{ gateway, connected }, outboundPending] = await Promise.all([
      getVendorConnectionStatus(vendor),
      getOutboundPendingCount(),
    ]);

    return NextResponse.json({
      gateway: {
        sessionId: gateway.sessionId,
        status: gateway.rawStatus,
        state: gateway.state,
        connected,
        phone: gateway.phone,
        pushName: gateway.pushName,
        lastError: gateway.lastError,
      },
      outbound: {
        pending: outboundPending,
      },
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Health API] Failed to collect status:', error);
    return NextResponse.json(
      { error: 'Failed to collect health status' },
      { status: 500 }
    );
  }
}
