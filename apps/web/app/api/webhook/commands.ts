/**
 * Parses and executes actions based on Vendor replies (1, 2, 3, or edit).
 * Looks up the latest pending suggestion for the vendor, handles the options:
 * - 1: Approve and Send suggested reply (updates suggestion status)
 * - 2: Approve Action Only (no message sent to customer)
 * - 3: Reject suggestion
 * - edit [custom text]: Send edited reply and execute actions
 * Handles invalid options by sending usage instructions.
 */
import { prisma } from '../../../lib/prisma';
import { sendMessage } from '../../../lib/openwa';
import { logVendorReply } from '../../../lib/suggestions';
import { getOrCreateDefaultVendor, VENDOR_PHONE_NUMBER } from './db';
import { executeApprovedActions } from './actions';

export async function handleVendorCommand(commandText: string) {
  const trimmed = commandText.trim();

  const vendor = await getOrCreateDefaultVendor();
  const suggestion = await prisma.suggestion.findFirst({
    where: {
      vendorId: vendor.id,
      status: 'PENDING',
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!suggestion) {
    await sendMessage(VENDOR_PHONE_NUMBER, 'No pending suggestions found to approve.');
    return;
  }

  const customerPhone = suggestion.customerPhoneNumber;

  if (trimmed === '1') {
    console.log(`[Command] Vendor approved suggestion for customer ${customerPhone}`);
    await executeApprovedActions(suggestion);
    await sendMessage(customerPhone, suggestion.proposedReply);
    await logVendorReply(vendor.id, customerPhone, suggestion.proposedReply);

    await prisma.suggestion.update({
      where: { id: suggestion.id },
      data: { status: 'APPROVED' },
    });

    await sendMessage(VENDOR_PHONE_NUMBER, 'Suggestion approved and reply dispatched.');

  } else if (trimmed === '2') {
    console.log(`[Command] Vendor approved actions only for ${customerPhone}`);
    await executeApprovedActions(suggestion);
    
    await prisma.suggestion.update({
      where: { id: suggestion.id },
      data: { status: 'APPROVED' },
    });

    await sendMessage(VENDOR_PHONE_NUMBER, 'CRM database action updated (no reply sent).');

  } else if (trimmed === '3') {
    console.log(`[Command] Vendor rejected suggestion for ${customerPhone}`);
    await prisma.suggestion.update({
      where: { id: suggestion.id },
      data: { status: 'REJECTED' },
    });

    await sendMessage(VENDOR_PHONE_NUMBER, 'Suggestion rejected.');

  } else if (trimmed.toLowerCase().startsWith('edit ')) {
    const customReply = trimmed.substring(5).trim();
    console.log(`[Command] Vendor edited reply for ${customerPhone}: "${customReply}"`);

    await executeApprovedActions(suggestion);
    await sendMessage(customerPhone, customReply);
    await logVendorReply(vendor.id, customerPhone, customReply);

    await prisma.suggestion.update({
      where: { id: suggestion.id },
      data: { status: 'APPROVED', proposedReply: customReply },
    });

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
}
