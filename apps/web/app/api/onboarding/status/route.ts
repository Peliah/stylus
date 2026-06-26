import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/session';
import { getOnboardingStatus } from '@/lib/onboarding';
import { getOpenwaSessionQr } from '@/lib/openwa-session';

export async function GET() {
  const session = await getAuthSession();
  const vendorId = session?.user?.vendorId;
  if (!vendorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const status = await getOnboardingStatus(vendorId);
  return NextResponse.json(status);
}

export async function POST(req: Request) {
  const session = await getAuthSession();
  const vendorId = session?.user?.vendorId;
  if (!vendorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as { action?: string };
  if (body.action === 'qr') {
    const status = await getOnboardingStatus(vendorId);
    const qr = await getOpenwaSessionQr(status.sessionId);
    return NextResponse.json(qr);
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
