/**
 * Main webhook route handler.
 * Performs signature validation, body parsing, and filters for message events.
 * Identifies if the sender is the Vendor or a Customer.
 * For Vendor messages, invokes command handling.
 * For Customer messages, upserts the Customer, logs the Message,
 * handles media messages by flagging them for manual review (no emoji),
 * and enqueues jobs for AI intent extraction.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { addMessageJob } from '../../../lib/queue';
import { sendMessage } from '../../../lib/openwa';
import { verifyWebhookSignature } from './verify';
import { getOrCreateDefaultVendor, VENDOR_PHONE_NUMBER } from './db';
import { handleVendorCommand } from './commands';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-openwa-signature');

    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const { event, data } = body;

    if (event !== 'message.received' && event !== 'message.sent') {
      console.log(`[Webhook] Ignored event: ${event}`);
      return NextResponse.json({ received: true, ignoredEvent: event });
    }

    // Outbound events echo our own sends — only process inbound messages
    if (event === 'message.sent') {
      console.log(`[Webhook] Ignored outbound message.sent (fromMe=${data?.fromMe ?? 'unknown'})`);
      return NextResponse.json({ received: true, ignoredEvent: event });
    }

    const { id: messageId, from, body: messageContent, type } = data;
    const isMedia = type !== 'chat';

    const cleanFrom = from.split('@')[0];
    const cleanVendor = VENDOR_PHONE_NUMBER.split('@')[0];
    const isFromVendor = cleanFrom === cleanVendor;

    if (isFromVendor) {
      console.log(`[Webhook] Received vendor command: "${messageContent}"`);
      await handleVendorCommand(messageContent);
    } else {
      console.log(`[Webhook] Received customer message from ${from}: "${messageContent}"`);
      
      const vendor = await getOrCreateDefaultVendor();
      const customer = await prisma.customer.upsert({
        where: {
          vendorId_phoneNumber: {
            vendorId: vendor.id,
            phoneNumber: from,
          },
        },
        update: {},
        create: {
          vendorId: vendor.id,
          phoneNumber: from,
          name: data.sender?.pushname || null,
        },
      });

      await prisma.message.create({
        data: {
          customerId: customer.id,
          content: messageContent || `[Media type: ${type}]`,
          sender: 'CUSTOMER',
          isMedia,
        },
      });

      if (isMedia) {
        await sendMessage(
          VENDOR_PHONE_NUMBER,
          `Customer ${customer.name || from} sent media (${type}). Flagged for manual review.`
        );
        return NextResponse.json({ received: true, status: 'media_flagged' });
      }

      await addMessageJob({
        messageId,
        customerPhoneNumber: from,
        vendorPhoneNumber: VENDOR_PHONE_NUMBER,
        content: messageContent,
        isMedia,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
