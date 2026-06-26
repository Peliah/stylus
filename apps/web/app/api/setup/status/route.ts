import { NextResponse } from 'next/server';
import { getSetupStatus } from '@/lib/setup-service';
import { getSetupIdFromCookie } from '@/lib/setup-session';
import { toVendorError } from '@/lib/vendor-errors';

export async function GET() {
  try {
    const setupId = await getSetupIdFromCookie();
    if (!setupId) {
      return NextResponse.json({ error: 'No active setup session.' }, { status: 400 });
    }

    const { setup, gateway } = await getSetupStatus(setupId);

    return NextResponse.json({
      setupId: setup.setupId,
      shopName: setup.shopName,
      connectedPhone: setup.connectedPhone,
      gateway: {
        state: gateway.state,
        phone: gateway.phone,
        pushName: gateway.pushName,
        connected: gateway.state === 'connected',
      },
    });
  } catch (error) {
    console.error('[Setup Status]', error);
    return NextResponse.json({ error: toVendorError(error) }, { status: 400 });
  }
}
