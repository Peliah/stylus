/**
 * Parses and executes vendor and customer WhatsApp commands.
 */
import { prisma } from '../../../lib/prisma';
import { sendMessage } from '../../../lib/openwa';
import { enqueueOutboundMessage } from '../../../lib/outbound-queue';
import { getVendorCommands } from '../../../lib/commands/load';
import { parseMessage } from '../../../lib/commands/parse';
import { formatCatalog, formatHelpMessage, renderTemplate } from '../../../lib/commands/templates';
import { resolveMessagingSessionId } from '../../../lib/messaging-session';
import { whatsAppPhoneVariants } from '../../../lib/phone';
import {
  approveActionsOnly,
  approveAndSendSuggestion,
  approveWithCustomReply,
  rejectSuggestion,
} from '../../../lib/suggestion-actions';

export interface CommandContext {
  sessionId: string;
  vendorId: string;
  replyChatId?: string;
}

export async function createCommandContext(
  vendor: { id: string; phoneNumber: string; openwaSessionId: string | null },
  replyChatId?: string
): Promise<CommandContext> {
  const sessionId = await resolveMessagingSessionId(vendor);
  return { sessionId, vendorId: vendor.id, replyChatId };
}

async function reply(chatId: string, text: string, ctx: CommandContext) {
  const result = await sendMessage(chatId, text, { sessionId: ctx.sessionId });
  if (!result.success && !result.queued) {
    console.error(`[Commands] Failed to deliver reply to ${chatId}, queueing retry`);
    await enqueueOutboundMessage(chatId, text, ctx.sessionId);
  } else if (result.queued) {
    console.log(`[Commands] Reply to ${chatId} queued for retry`);
  }
}

export async function handleVendorCommand(commandText: string, ctx: CommandContext) {
  const vendor = await prisma.vendor.findUniqueOrThrow({ where: { id: ctx.vendorId } });
  const replyTo = ctx.replyChatId ?? vendor.phoneNumber;
  const commands = await getVendorCommands(vendor.id, 'VENDOR');
  const parsed = parseMessage(commandText, commands);

  if (!parsed) {
    await reply(
      replyTo,
      'Invalid command. Reply with:\n' +
        '• *1* to Approve and Send suggested reply\n' +
        '• *2* to Approve Action only (no reply)\n' +
        '• *3* to Reject suggestion\n' +
        '• *edit [custom text]* to send a modified message\n' +
        '• *stock* to list inventory',
      ctx
    );
    return;
  }

  const { command, args } = parsed;

  try {
    if (command.actionType === 'LIST_STOCK') {
      const products = await prisma.product.findMany({
        where: { vendorId: vendor.id },
        orderBy: { name: 'asc' },
      });
      if (args) {
        const product = products.find((p) => p.name.toLowerCase() === args.toLowerCase());
        if (!product) {
          await reply(replyTo, `Product "${args}" not found.`, ctx);
          return;
        }
        await reply(
          replyTo,
          `${product.name}: ${product.stock} in stock at $${product.price.toFixed(2)}`,
          ctx
        );
        return;
      }
      await reply(replyTo, formatCatalog(products), ctx);
      return;
    }

    if (command.actionType === 'UPDATE_STOCK') {
      const [productName, qtyStr] = args.split('|');
      const stock = Number(qtyStr);
      if (!productName || !Number.isInteger(stock) || stock < 0) {
        await reply(replyTo, 'Use: set [product name] stock to [number]', ctx);
        return;
      }
      const product = await prisma.product.findFirst({
        where: { vendorId: vendor.id, name: productName.trim() },
      });
      if (!product) {
        await reply(replyTo, `Product "${productName}" not found.`, ctx);
        return;
      }
      await prisma.product.update({
        where: { id: product.id },
        data: { stock },
      });
      await reply(replyTo, `Updated ${product.name} stock to ${stock}.`, ctx);
      return;
    }

    if (command.actionType === 'HELP') {
      const customerCommands = await getVendorCommands(vendor.id, 'CUSTOMER');
      await reply(
        replyTo,
        formatHelpMessage(
          commands.concat(customerCommands).map((c) => ({
            keyword: c.keyword,
            label: c.label,
            description: c.description,
          })),
          vendor.name
        ),
        ctx
      );
      return;
    }

    const suggestion = await prisma.suggestion.findFirst({
      where: { vendorId: vendor.id, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    if (!suggestion) {
      await reply(replyTo, 'No pending suggestions found to approve.', ctx);
      return;
    }

    if (command.actionType === 'APPROVE_SEND') {
      await approveAndSendSuggestion(suggestion.id, ctx.sessionId);
      await reply(replyTo, 'Suggestion approved and reply dispatched.', ctx);
    } else if (command.actionType === 'APPROVE_ACTIONS') {
      await approveActionsOnly(suggestion.id);
      await reply(replyTo, 'CRM database action updated (no reply sent).', ctx);
    } else if (command.actionType === 'REJECT') {
      await rejectSuggestion(suggestion.id);
      await reply(replyTo, 'Suggestion rejected.', ctx);
    } else if (command.actionType === 'APPROVE_EDIT') {
      const customReply = args.trim();
      if (!customReply) {
        await reply(replyTo, 'Use: edit [your message]', ctx);
        return;
      }
      await approveWithCustomReply(suggestion.id, customReply, ctx.sessionId);
      await reply(replyTo, 'Custom reply dispatched and actions executed.', ctx);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await reply(replyTo, `Failed to process command: ${message}`, ctx);
  }
}

export async function handleCustomerCommand(
  commandText: string,
  replyChatId: string,
  ctx: CommandContext
) {
  const vendor = await prisma.vendor.findUniqueOrThrow({ where: { id: ctx.vendorId } });
  const commands = await getVendorCommands(vendor.id, 'CUSTOMER');
  const parsed = parseMessage(commandText, commands);

  if (!parsed) return false;

  const { command, args } = parsed;
  const products = await prisma.product.findMany({
    where: { vendorId: vendor.id },
    orderBy: { name: 'asc' },
  });

  const variants = whatsAppPhoneVariants(replyChatId);
  const customer = await prisma.customer.findFirst({
    where: {
      vendorId: vendor.id,
      phoneNumber: { in: variants.length ? variants : [replyChatId] },
    },
  });

  const customerName = customer?.name ?? 'there';
  let replyText = '';

  try {
    switch (command.actionType) {
      case 'HELP': {
        replyText = formatHelpMessage(
          commands.map((c) => ({
            keyword: c.keyword,
            label: c.label,
            description: c.description,
          })),
          vendor.name
        );
        break;
      }
      case 'SHOW_CATALOG': {
        const catalog = formatCatalog(products);
        replyText = command.replyTemplate
          ? renderTemplate(command.replyTemplate, {
              shop_name: vendor.name,
              catalog,
              customer_name: customerName,
            })
          : catalog;
        break;
      }
      case 'CHECK_STOCK': {
        if (!args) {
          replyText = 'Please specify a product, e.g. /stock Widget';
          break;
        }
        const product = products.find((p) => p.name.toLowerCase() === args.toLowerCase());
        if (!product) {
          replyText = `Product "${args}" not found. Try /menu to see available products.`;
          break;
        }
        replyText = command.replyTemplate
          ? renderTemplate(command.replyTemplate, {
              shop_name: vendor.name,
              product_name: product.name,
              stock: product.stock,
              price: `$${product.price.toFixed(2)}`,
              customer_name: customerName,
            })
          : `${product.name}: ${product.stock} in stock at $${product.price.toFixed(2)}`;
        break;
      }
      case 'PLACE_ORDER': {
        replyText = command.replyTemplate
          ? renderTemplate(command.replyTemplate, {
              shop_name: vendor.name,
              customer_name: customerName,
              order_summary: args || 'your request',
            })
          : `Thanks ${customerName}! We received your order request and will confirm shortly.`;
        break;
      }
      case 'CUSTOM_REPLY': {
        replyText = command.replyTemplate
          ? renderTemplate(command.replyTemplate, {
              shop_name: vendor.name,
              customer_name: customerName,
            })
          : command.label;
        break;
      }
      default: {
        replyText = 'This command is not available yet.';
      }
    }

    await reply(replyChatId, replyText, ctx);

    if (customer) {
      await prisma.message.create({
        data: {
          customerId: customer.id,
          content: replyText,
          sender: 'VENDOR',
        },
      });
    } else {
      console.warn(`[Commands] Reply sent to ${replyChatId} but no customer record matched`);
    }

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await reply(replyChatId, `Sorry, something went wrong: ${message}`, ctx);
    return true;
  }
}
