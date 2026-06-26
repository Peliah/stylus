import type { Suggestion } from '@prisma/client';
import type { SuggestedAction } from './openai';
import { prisma } from './prisma';

export function parseProposedActions(value: Suggestion['proposedActions']): SuggestedAction[] {
  if (Array.isArray(value)) {
    return value as unknown as SuggestedAction[];
  }
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as unknown as SuggestedAction[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function logVendorReply(
  vendorId: string,
  customerPhoneNumber: string,
  content: string
): Promise<void> {
  const customer = await prisma.customer.findFirst({
    where: { vendorId, phoneNumber: customerPhoneNumber },
  });
  if (!customer) return;

  await prisma.message.create({
    data: {
      customerId: customer.id,
      content,
      sender: 'VENDOR',
      isMedia: false,
    },
  });
}
