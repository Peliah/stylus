import { NextResponse } from 'next/server';
import { getGatewaySnapshot } from '../../../lib/openwa-client';
import { getOutboundPendingCount } from '../../../lib/outbound-queue';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [gateway, outboundPending] = await Promise.all([
      getGatewaySnapshot(),
      getOutboundPendingCount(),
    ]);

    return NextResponse.json({
      gateway: {
        sessionId: gateway.sessionId,
        status: gateway.rawStatus,
        state: gateway.state,
        connected: gateway.state === 'connected',
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
