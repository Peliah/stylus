import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

export async function getAuthSession() {
  return getServerSession(authOptions);
}

export async function requireAuthVendorId(): Promise<string> {
  const session = await getAuthSession();
  const vendorId = session?.user?.vendorId;
  if (!vendorId) {
    throw new Error('Unauthorized');
  }
  return vendorId;
}
