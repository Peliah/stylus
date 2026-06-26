import { prisma } from './prisma';

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
