import { NextResponse } from 'next/server';
import { getSetupIdFromCookie } from '@/lib/setup-session';
import { toVendorError } from '@/lib/vendor-errors';

/** Validates setup is ready for OTP verification (vendor created via NextAuth signIn). */
export async function GET() {
  try {
    const setupId = await getSetupIdFromCookie();
    if (!setupId) {
      return NextResponse.json({ error: 'No active setup session.' }, { status: 400 });
    }
    return NextResponse.json({ ok: true, setupId });
  } catch (error) {
    return NextResponse.json({ error: toVendorError(error) }, { status: 400 });
  }
}
