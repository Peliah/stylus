import { NextResponse } from 'next/server';
import { getVendorWhatsAppQr } from '@/lib/whatsapp-connection';
import { toVendorError } from '@/lib/vendor-errors';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { phone?: string };
    if (!body.phone?.trim()) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const qr = await getVendorWhatsAppQr(body.phone);
    return NextResponse.json(qr);
  } catch (error) {
    console.error('[Auth WhatsApp QR]', error);
    return NextResponse.json({ error: toVendorError(error) }, { status: 400 });
  }
}
