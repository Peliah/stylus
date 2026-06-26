import { NextResponse } from 'next/server';
import { saveSetupShopName } from '@/lib/setup-service';
import { getSetupIdFromCookie } from '@/lib/setup-session';
import { toVendorError } from '@/lib/vendor-errors';

export async function POST(req: Request) {
  try {
    const setupId = await getSetupIdFromCookie();
    if (!setupId) {
      return NextResponse.json({ error: 'No active setup session.' }, { status: 400 });
    }

    const body = (await req.json()) as { shopName?: string };
    const setup = await saveSetupShopName(setupId, body.shopName ?? '');
    return NextResponse.json({ ok: true, shopName: setup.shopName });
  } catch (error) {
    console.error('[Setup Shop]', error);
    return NextResponse.json({ error: toVendorError(error) }, { status: 400 });
  }
}
