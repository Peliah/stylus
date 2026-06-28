import { NextResponse } from 'next/server';
import { sendLoginOtp } from '@/lib/auth-otp';
import { prisma } from '@/lib/prisma';
import { resolveMessagingSessionId } from '@/lib/messaging-session';
import { normalizeWhatsAppPhone, whatsAppPhoneVariants } from '@/lib/phone';
import { getVendorWhatsAppStatus } from '@/lib/whatsapp-connection';
import { toVendorError } from '@/lib/vendor-errors';

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

    if (intent !== 'login') {
      return NextResponse.json(
        { error: 'Use Get started to create a new shop.' },
        { status: 400 }
      );
    }

    const variants = whatsAppPhoneVariants(body.phone);
    const vendor = await prisma.vendor.findFirst({
      where: { phoneNumber: { in: variants.length ? variants : [phone] } },
    });
    if (!vendor) {
      return NextResponse.json(
        { error: 'No shop found for this number. Get started to create one.' },
        { status: 404 }
      );
    }

    const waStatus = await getVendorWhatsAppStatus(body.phone);
    if (!waStatus.connected) {
      return NextResponse.json(
        { error: 'Connect WhatsApp first by scanning the QR code.', needsReconnect: true },
        { status: 400 }
      );
    }

    const sessionId = await resolveMessagingSessionId(vendor);
    if (sessionId !== vendor.openwaSessionId) {
      await prisma.vendor.update({
        where: { id: vendor.id },
        data: { openwaSessionId: sessionId },
      });
    }

    const result = await sendLoginOtp(body.phone, { sessionId });
    return NextResponse.json({
      ok: true,
      phone: result.phone,
      message: 'Verification code sent to your WhatsApp.',
    });
  } catch (error) {
    console.error('[OTP Send]', error);
    return NextResponse.json({ error: toVendorError(error) }, { status: 400 });
  }
}
