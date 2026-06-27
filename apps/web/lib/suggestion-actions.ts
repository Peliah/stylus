import type { Suggestion } from '@prisma/client';
import { prisma } from './prisma';
import { logVendorReply } from './suggestions';
import { sendMessage } from './openwa';
import { executeApprovedActions } from './order-actions';
import { getActiveVendor } from './vendor';

async function getOwnedSuggestion(
  suggestionId: string,
  vendorId: string
): Promise<Suggestion | null> {
  return prisma.suggestion.findFirst({
    where: { id: suggestionId, vendorId, status: 'PENDING' },
  });
}

export async function approveAndSendSuggestion(
  suggestionId: string,
  sessionId?: string
): Promise<void> {
  const vendor = await getActiveVendor();
  const suggestion = await getOwnedSuggestion(suggestionId, vendor.id);
  if (!suggestion) throw new Error('Suggestion not found or already handled');

  await executeApprovedActions(suggestion);
  await sendMessage(suggestion.customerPhoneNumber, suggestion.proposedReply, { sessionId });
  await logVendorReply(vendor.id, suggestion.customerPhoneNumber, suggestion.proposedReply);

  await prisma.suggestion.update({
    where: { id: suggestion.id },
    data: { status: 'APPROVED' },
  });
}

export async function approveActionsOnly(suggestionId: string): Promise<void> {
  const vendor = await getActiveVendor();
  const suggestion = await getOwnedSuggestion(suggestionId, vendor.id);
  if (!suggestion) throw new Error('Suggestion not found or already handled');

  await executeApprovedActions(suggestion);

  await prisma.suggestion.update({
    where: { id: suggestion.id },
    data: { status: 'APPROVED' },
  });
}

export async function rejectSuggestion(suggestionId: string): Promise<void> {
  const vendor = await getActiveVendor();
  const suggestion = await getOwnedSuggestion(suggestionId, vendor.id);
  if (!suggestion) throw new Error('Suggestion not found or already handled');

  await prisma.suggestion.update({
    where: { id: suggestion.id },
    data: { status: 'REJECTED' },
  });
}

export async function approveWithCustomReply(
  suggestionId: string,
  customReply: string,
  sessionId?: string
): Promise<void> {
  const trimmed = customReply.trim();
  if (!trimmed) throw new Error('Reply cannot be empty');

  const vendor = await getActiveVendor();
  const suggestion = await getOwnedSuggestion(suggestionId, vendor.id);
  if (!suggestion) throw new Error('Suggestion not found or already handled');

  await executeApprovedActions(suggestion);
  await sendMessage(suggestion.customerPhoneNumber, trimmed, { sessionId });
  await logVendorReply(vendor.id, suggestion.customerPhoneNumber, trimmed);

  await prisma.suggestion.update({
    where: { id: suggestion.id },
    data: { status: 'APPROVED', proposedReply: trimmed },
  });
}
