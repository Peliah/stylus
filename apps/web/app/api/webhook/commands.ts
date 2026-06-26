/**
 * Parses and executes actions based on Vendor WhatsApp replies (1, 2, 3, or edit).
 */
import { prisma } from '../../../lib/prisma';
import { sendMessage } from '../../../lib/openwa';
import {
  approveActionsOnly,
  approveAndSendSuggestion,
  approveWithCustomReply,
  rejectSuggestion,
} from '../../../lib/suggestion-actions';
import { getOrCreateDefaultVendor, VENDOR_PHONE_NUMBER } from './db';

export async function handleVendorCommand(commandText: string) {
  const trimmed = commandText.trim();
  const vendor = await getOrCreateDefaultVendor();

  const suggestion = await prisma.suggestion.findFirst({
    where: { vendorId: vendor.id, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });

  if (!suggestion) {
    await sendMessage(VENDOR_PHONE_NUMBER, 'No pending suggestions found to approve.');
    return;
  }

  try {
    if (trimmed === '1') {
      await approveAndSendSuggestion(suggestion.id);
      await sendMessage(VENDOR_PHONE_NUMBER, 'Suggestion approved and reply dispatched.');
    } else if (trimmed === '2') {
      await approveActionsOnly(suggestion.id);
      await sendMessage(VENDOR_PHONE_NUMBER, 'CRM database action updated (no reply sent).');
    } else if (trimmed === '3') {
      await rejectSuggestion(suggestion.id);
      await sendMessage(VENDOR_PHONE_NUMBER, 'Suggestion rejected.');
    } else if (trimmed.toLowerCase().startsWith('edit ')) {
      const customReply = trimmed.substring(5).trim();
      await approveWithCustomReply(suggestion.id, customReply);
      await sendMessage(VENDOR_PHONE_NUMBER, 'Custom reply dispatched and actions executed.');
    } else {
      await sendMessage(
        VENDOR_PHONE_NUMBER,
        'Invalid command. Reply with:\n' +
          '• *1* to Approve and Send suggested reply\n' +
          '• *2* to Approve Action only (no reply)\n' +
          '• *3* to Reject suggestion\n' +
          '• *edit [custom text]* to send a modified message'
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await sendMessage(VENDOR_PHONE_NUMBER, `Failed to process command: ${message}`);
  }
}
