import { getServerSession } from 'next-auth';
import { prisma } from './prisma';
import { authOptions } from './auth';

export const VENDOR_PHONE_NUMBER = process.env.VENDOR_PHONE_NUMBER || '';

export async function getOrCreateDefaultVendor() {
  let vendor = await prisma.vendor.findFirst({
    where: { phoneNumber: VENDOR_PHONE_NUMBER },
  });

  if (!vendor) {
    vendor = await prisma.vendor.create({
      data: {
        name: 'Stylus Vendor',
        phoneNumber: VENDOR_PHONE_NUMBER,
      },
    });
  }

  return vendor;
}

/** Prefer authenticated vendor; fall back for scripts/webhooks without a session. */
export async function getActiveVendor() {
  const session = await getServerSession(authOptions);
  if (session?.user?.vendorId) {
    const vendor = await prisma.vendor.findUnique({
      where: { id: session.user.vendorId },
    });
    if (vendor) return vendor;
  }
  return getOrCreateDefaultVendor();
}

