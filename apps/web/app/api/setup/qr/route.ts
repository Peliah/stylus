import { NextResponse } from 'next/server';
import { getSetupQr } from '@/lib/setup-service';
import { getSetupIdFromCookie } from '@/lib/setup-session';
import { toVendorError } from '@/lib/vendor-errors';

export async function POST() {
  try {
    const setupId = await getSetupIdFromCookie();
    if (!setupId) {
      return NextResponse.json({ error: 'No active setup session.' }, { status: 400 });
    }

    const qr = await getSetupQr(setupId);
    return NextResponse.json(qr);
  } catch (error) {
    console.error('[Setup QR]', error);
    return NextResponse.json({ error: toVendorError(error) }, { status: 400 });
  }
}
