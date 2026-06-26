import { getDefaultSessionId } from './openwa-session';

export function resolveVendorSessionId(vendor: {
  id: string;
  openwaSessionId: string | null;
}): string {
  return vendor.openwaSessionId ?? getDefaultSessionId() ?? vendor.id;
}
