import { NextResponse } from 'next/server';
import { prepareVendorWhatsApp } from '@/lib/whatsapp-connection';
import { normalizeWhatsAppPhone } from '@/lib/phone';
import { toVendorError } from '@/lib/vendor-errors';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { phone?: string };
    if (!body.phone?.trim()) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const result = await prepareVendorWhatsApp(body.phone);
    return NextResponse.json({
      phone: normalizeWhatsAppPhone(body.phone),
      connected: result.connected,
      gateway: {
        state: result.gateway.state,
        phone: result.gateway.phone,
        connected: result.connected,
      },
    });
  } catch (error) {
    console.error('[Auth WhatsApp Prepare]', error);
    return NextResponse.json({ error: toVendorError(error) }, { status: 400 });
  }
}
