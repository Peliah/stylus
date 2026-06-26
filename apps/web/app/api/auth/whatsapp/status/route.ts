import { NextResponse } from 'next/server';
import { getVendorWhatsAppStatus } from '@/lib/whatsapp-connection';
import { toVendorError } from '@/lib/vendor-errors';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { phone?: string };
    if (!body.phone?.trim()) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const status = await getVendorWhatsAppStatus(body.phone);
    return NextResponse.json(status);
  } catch (error) {
    console.error('[Auth WhatsApp Status]', error);
    return NextResponse.json({ error: toVendorError(error) }, { status: 400 });
  }
}
