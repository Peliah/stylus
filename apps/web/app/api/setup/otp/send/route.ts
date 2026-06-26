import { NextResponse } from 'next/server';
import { sendSetupOtp } from '@/lib/setup-service';
import { getSetupIdFromCookie } from '@/lib/setup-session';
import { toVendorError } from '@/lib/vendor-errors';

export async function POST() {
  try {
    const setupId = await getSetupIdFromCookie();
    if (!setupId) {
      return NextResponse.json({ error: 'No active setup session.' }, { status: 400 });
    }

    const result = await sendSetupOtp(setupId);
    return NextResponse.json({
      ok: true,
      phone: result.phone,
      message: 'Verification code sent to your WhatsApp.',
    });
  } catch (error) {
    console.error('[Setup OTP Send]', error);
    return NextResponse.json({ error: toVendorError(error) }, { status: 400 });
  }
}
