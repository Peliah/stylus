// /**
//  * Main webhook route handler.
//  * Performs signature validation, body parsing, and filters for message events.
//  * Identifies if the sender is the Vendor or a Customer.
//  * For Vendor messages, invokes command handling.
//  * For Customer messages, tries command fast-path then enqueues AI jobs.
//  */
// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '../../../lib/prisma';
// import { addMessageJob } from '../../../lib/queue';
// import { sendMessage } from '../../../lib/openwa';
// import { verifyWebhookSignature } from './verify';
// import { resolveWebhookVendor } from './db';
// import { handleVendorCommand, handleCustomerCommand, createCommandContext } from './commands';
// import { getIgnoredMessageReason, isMediaMessage } from './message-utils';
// import { phoneDigitsMatch } from '../../../lib/phone';
// import { getVendorCommands, seedDefaultCommands } from '../../../lib/commands/load';
// import { parseMessage } from '../../../lib/commands/parse';
// import { isDuplicateWebhookMessage } from './dedupe';
// import { saveVendorSelfChatId } from '../../../lib/vendor-chat-id';

// export async function POST(req: NextRequest) {
//   try {
//     const rawBody = await req.text();
//     const signature = req.headers.get('x-openwa-signature');

//     if (!verifyWebhookSignature(rawBody, signature)) {
//       return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
//     }

//     const body = JSON.parse(rawBody);
//     const { event, data } = body;

//     if (event !== 'message.received' && event !== 'message.sent') {
//       console.log(`[Webhook] Ignored event: ${event}`);
//       return NextResponse.json({ received: true, ignoredEvent: event });
//     }

//     const { id: messageId, from, body: messageContent, type } = data;
//     const replyChatId: string = data.chatId ?? from;
//     const text = messageContent ?? '';

//     if (isDuplicateWebhookMessage(messageId)) {
//       console.log(`[Webhook] Duplicate message ${messageId}, skipping`);
//       return NextResponse.json({ received: true, ignoredReason: 'duplicate' });
//     }

//     const ignoredReason = getIgnoredMessageReason(data);
//     if (ignoredReason) {
//       console.log(`[Webhook] Ignored message (${ignoredReason}) from ${from ?? 'unknown'}`);
//       return NextResponse.json({ received: true, ignoredReason });
//     }

//     // const vendor = await resolveWebhookVendor();
//     // await seedDefaultCommands(vendor.id);
//     // const customerReplyId = from ?? replyChatId;
//     // const commandCtx = await createCommandContext(vendor, customerReplyId);

//     // if (data.fromMe && replyChatId) {
//     //   await saveVendorSelfChatId(vendor.phoneNumber, replyChatId);
//     // }
//     const vendor = await resolveWebhookVendor();
//     await seedDefaultCommands(vendor.id);
//     const customerReplyId = from ?? replyChatId;

//     // Cache the self-chat id BEFORE building the command context, so that
//     // during initial setup (no session linked yet) we still record the lid
//     // instead of throwing before this ever runs.
//     if (data.fromMe && replyChatId) {
//       await saveVendorSelfChatId(vendor.phoneNumber, replyChatId);
//     }

//     let commandCtx;
//     try {
//       commandCtx = await createCommandContext(vendor, customerReplyId);
//     } catch (err) {
//       console.warn(
//         `[Webhook] No active session for vendor ${vendor.id} yet (likely mid-setup): ${
//           err instanceof Error ? err.message : err
//         }`
//       );
//       // Setup-phase message (e.g. self-chat used to capture the lid) — nothing
//       // more to do until a session exists, but don't 500 the whole webhook.
//       return NextResponse.json({ received: true, ignoredReason: 'no_session_yet' });
//     }

//     const vendorCommands = await getVendorCommands(vendor.id, 'VENDOR');
//     const customerCommands = await getVendorCommands(vendor.id, 'CUSTOMER');
//     const parsedVendor = parseMessage(text, vendorCommands);
//     const parsedCustomer = parseMessage(text, customerCommands);
//     const isCommand = Boolean(parsedVendor || parsedCustomer);

//     // Self-chat and other messages you send appear as message.sent + fromMe, not message.received.
//     if (event === 'message.sent') {
//       if (!data.fromMe) {
//         console.log(`[Webhook] Ignored outbound message.sent to ${replyChatId}`);
//         return NextResponse.json({ received: true, ignoredEvent: event });
//       }
//       if (!isCommand) {
//         console.log(`[Webhook] Ignored own message.sent (not a command): "${text}"`);
//         return NextResponse.json({ received: true, ignoredReason: 'own_message_not_command' });
//       }
//     }

//     const isMedia = isMediaMessage(data);

//     // Messages sent from the linked WhatsApp account (including self-chat tests)
//     if (data.fromMe) {
//       if (parsedVendor) {
//         console.log(`[Webhook] Vendor command (fromMe/${event}): "${text}"`);
//         await handleVendorCommand(text, commandCtx);
//         return NextResponse.json({ received: true, handled: 'vendor_command' });
//       }
//       if (parsedCustomer) {
//         console.log(`[Webhook] Customer command (fromMe/self-test/${event}): "${text}"`);
//         await handleCustomerCommand(text, replyChatId, commandCtx);
//         return NextResponse.json({ received: true, handled: 'customer_command' });
//       }
//       console.log(`[Webhook] Ignored own message (not a command): "${text}"`);
//       return NextResponse.json({ received: true, ignoredReason: 'own_message_not_command' });
//     }

//     const isFromVendor = phoneDigitsMatch(vendor.phoneNumber, from);

//     if (isFromVendor) {
//       console.log(`[Webhook] Received vendor command: "${text}"`);
//       await handleVendorCommand(text, commandCtx);
//     } else {
//       console.log(`[Webhook] Received customer message from ${from}: "${text}"`);

//       const customerPhone = from ?? replyChatId;
//       const customer = await prisma.customer.upsert({
//         where: {
//           vendorId_phoneNumber: {
//             vendorId: vendor.id,
//             phoneNumber: customerPhone,
//           },
//         },
//         update: {},
//         create: {
//           vendorId: vendor.id,
//           phoneNumber: customerPhone,
//           name: data.sender?.pushname || null,
//         },
//       });

//       await prisma.message.create({
//         data: {
//           customerId: customer.id,
//           content: text || `[Media type: ${type}]`,
//           sender: 'CUSTOMER',
//           isMedia,
//         },
//       });

//       if (isMedia) {
//         await sendMessage(
//           vendor.phoneNumber,
//           `Customer ${customer.name || from} sent media (${type}). Flagged for manual review.`,
//           { sessionId: commandCtx.sessionId }
//         );
//         return NextResponse.json({ received: true, status: 'media_flagged' });
//       }

//       if (parsedCustomer) {
//         console.log(
//           `[Webhook] Customer command from ${customerPhone}: "${text}" → vendor ${vendor.id} session ${commandCtx.sessionId}`
//         );
//         await handleCustomerCommand(text, customerReplyId, commandCtx);
//         return NextResponse.json({ received: true, handled: 'customer_command' });
//       }

//       await addMessageJob({
//         messageId,
//         customerPhoneNumber: from ?? replyChatId,
//         vendorPhoneNumber: vendor.phoneNumber,
//         content: text,
//         isMedia,
//       });
//     }

//     return NextResponse.json({ received: true });
//   } catch (error) {
//     console.error('[Webhook] Error processing webhook:', error);
//     return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
//   }
// }


/**
 * Main webhook route handler.
 * Performs signature validation, body parsing, and filters for message events.
 * Identifies if the sender is the Vendor or a Customer.
 * For Vendor messages, invokes command handling.
 * For Customer messages, tries command fast-path then enqueues AI jobs.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { addMessageJob } from '../../../lib/queue';
import { sendMessage } from '../../../lib/openwa';
import { verifyWebhookSignature } from './verify';
import { resolveWebhookVendor } from './db';
import { handleVendorCommand, handleCustomerCommand, createCommandContext } from './commands';
import { getIgnoredMessageReason, isMediaMessage } from './message-utils';
import { phoneDigitsMatch } from '../../../lib/phone';
import { getVendorCommands, seedDefaultCommands } from '../../../lib/commands/load';
import { parseMessage } from '../../../lib/commands/parse';
import { isDuplicateWebhookMessage } from './dedupe';
import { saveVendorSelfChatId } from '../../../lib/vendor-chat-id';

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

    const { id: messageId, from, body: messageContent, type } = data;
    const replyChatId: string = data.chatId ?? from;
    const text = messageContent ?? '';

    if (isDuplicateWebhookMessage(messageId)) {
      console.log(`[Webhook] Duplicate message ${messageId}, skipping`);
      return NextResponse.json({ received: true, ignoredReason: 'duplicate' });
    }

    const ignoredReason = getIgnoredMessageReason(data);
    if (ignoredReason) {
      console.log(`[Webhook] Ignored message (${ignoredReason}) from ${from ?? 'unknown'}`);
      return NextResponse.json({ received: true, ignoredReason });
    }

    const vendor = await resolveWebhookVendor();
    await seedDefaultCommands(vendor.id);
    const customerReplyId = from ?? replyChatId;

    // Cache the self-chat id BEFORE building the command context, so that
    // during initial setup (no session linked yet) we still record the lid
    // instead of throwing before this ever runs.
    if (data.fromMe && replyChatId) {
      await saveVendorSelfChatId(vendor.phoneNumber, replyChatId);
    }

    let commandCtx;
    try {
      commandCtx = await createCommandContext(vendor, customerReplyId);
    } catch (err) {
      console.warn(
        `[Webhook] No active session for vendor ${vendor.id} yet (likely mid-setup): ${
          err instanceof Error ? err.message : err
        }`
      );
      // Setup-phase message (e.g. the priming self-chat used to capture the
      // lid) — nothing more to do until a session exists, but don't 500 the
      // whole webhook.
      return NextResponse.json({ received: true, ignoredReason: 'no_session_yet' });
    }

    const vendorCommands = await getVendorCommands(vendor.id, 'VENDOR');
    const customerCommands = await getVendorCommands(vendor.id, 'CUSTOMER');
    const parsedVendor = parseMessage(text, vendorCommands);
    const parsedCustomer = parseMessage(text, customerCommands);
    const isCommand = Boolean(parsedVendor || parsedCustomer);

    // Self-chat and other messages you send appear as message.sent + fromMe, not message.received.
    if (event === 'message.sent') {
      if (!data.fromMe) {
        console.log(`[Webhook] Ignored outbound message.sent to ${replyChatId}`);
        return NextResponse.json({ received: true, ignoredEvent: event });
      }
      if (!isCommand) {
        console.log(`[Webhook] Ignored own message.sent (not a command): "${text}"`);
        return NextResponse.json({ received: true, ignoredReason: 'own_message_not_command' });
      }
    }

    const isMedia = isMediaMessage(data);

    // Messages sent from the linked WhatsApp account (including self-chat tests)
    if (data.fromMe) {
      if (parsedVendor) {
        console.log(`[Webhook] Vendor command (fromMe/${event}): "${text}"`);
        await handleVendorCommand(text, commandCtx);
        return NextResponse.json({ received: true, handled: 'vendor_command' });
      }
      if (parsedCustomer) {
        console.log(`[Webhook] Customer command (fromMe/self-test/${event}): "${text}"`);
        await handleCustomerCommand(text, replyChatId, commandCtx);
        return NextResponse.json({ received: true, handled: 'customer_command' });
      }
      console.log(`[Webhook] Ignored own message (not a command): "${text}"`);
      return NextResponse.json({ received: true, ignoredReason: 'own_message_not_command' });
    }

    const isFromVendor = phoneDigitsMatch(vendor.phoneNumber, from);

    if (isFromVendor) {
      console.log(`[Webhook] Received vendor command: "${text}"`);
      await handleVendorCommand(text, commandCtx);
    } else {
      console.log(`[Webhook] Received customer message from ${from}: "${text}"`);

      const customerPhone = from ?? replyChatId;
      const customer = await prisma.customer.upsert({
        where: {
          vendorId_phoneNumber: {
            vendorId: vendor.id,
            phoneNumber: customerPhone,
          },
        },
        update: {},
        create: {
          vendorId: vendor.id,
          phoneNumber: customerPhone,
          name: data.sender?.pushname || null,
        },
      });

      await prisma.message.create({
        data: {
          customerId: customer.id,
          content: text || `[Media type: ${type}]`,
          sender: 'CUSTOMER',
          isMedia,
        },
      });

      if (isMedia) {
        await sendMessage(
          vendor.phoneNumber,
          `Customer ${customer.name || from} sent media (${type}). Flagged for manual review.`,
          { sessionId: commandCtx.sessionId }
        );
        return NextResponse.json({ received: true, status: 'media_flagged' });
      }

      if (parsedCustomer) {
        console.log(
          `[Webhook] Customer command from ${customerPhone}: "${text}" → vendor ${vendor.id} session ${commandCtx.sessionId}`
        );
        await handleCustomerCommand(text, customerReplyId, commandCtx);
        return NextResponse.json({ received: true, handled: 'customer_command' });
      }

      await addMessageJob({
        messageId,
        customerPhoneNumber: from ?? replyChatId,
        vendorPhoneNumber: vendor.phoneNumber,
        content: text,
        isMedia,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}