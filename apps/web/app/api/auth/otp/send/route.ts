import { NextResponse } from 'next/server';
import { sendLoginOtp } from '@/lib/auth-otp';
import { prisma } from '@/lib/prisma';
import { normalizeWhatsAppPhone } from '@/lib/phone';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      phone?: string;
      intent?: 'login' | 'signup';
    };

    if (!body.phone?.trim()) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const phone = normalizeWhatsAppPhone(body.phone);
    const intent = body.intent ?? 'login';

    if (intent === 'login') {
      const vendor = await prisma.vendor.findUnique({ where: { phoneNumber: phone } });
      if (!vendor) {
        return NextResponse.json(
          { error: 'No shop found for this number. Create an account first.' },
          { status: 404 }
        );
      }
    } else {
      const existing = await prisma.vendor.findUnique({ where: { phoneNumber: phone } });
      if (existing) {
        return NextResponse.json(
          { error: 'This number already has a shop. Log in instead.' },
          { status: 409 }
        );
      }
    }

    const result = await sendLoginOtp(body.phone);
    return NextResponse.json({
      ok: true,
      phone: result.phone,
      message: 'Verification code sent to your WhatsApp.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send code';
    console.error('[OTP Send]', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
