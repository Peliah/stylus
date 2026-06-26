import { NextResponse } from 'next/server';
import { createSetupSession } from '@/lib/setup-service';
import { setupCookieOptions } from '@/lib/setup-session';
import { toVendorError } from '@/lib/vendor-errors';

export async function POST() {
  try {
    const setup = await createSetupSession();
    const response = NextResponse.json({
      setupId: setup.setupId,
      message: 'Preparing connection…',
    });
    response.cookies.set(setupCookieOptions(setup.setupId));
    return response;
  } catch (error) {
    console.error('[Setup Start]', error);
    return NextResponse.json(
      { error: toVendorError(error, "We couldn't start setup. Try again.") },
      { status: 400 }
    );
  }
}
