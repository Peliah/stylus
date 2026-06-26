import { Worker, Job } from 'bullmq';
import { getRedisConnection } from './redis';
import { prisma } from './prisma';
import { analyzeIncomingMessage } from './openai';
import { sendMessage } from './openwa';
import { QUEUE_NAME } from './queue';

interface MessageJobData {
  messageId: string;
  customerPhoneNumber: string;
  vendorPhoneNumber: string;
  content: string;
  isMedia: boolean;
}

/**
 * Initializes and starts the background worker for BullMQ.
 */
export const messageWorker = new Worker(
  QUEUE_NAME,
  async (job: Job<MessageJobData>) => {
    const { customerPhoneNumber, vendorPhoneNumber, content } = job.data;
    console.log(`[Worker] Processing message job for customer: ${customerPhoneNumber}`);

    try {
      // 1. Fetch vendor record
      const vendor = await prisma.vendor.findFirst({
        where: { phoneNumber: vendorPhoneNumber },
      });

      if (!vendor) {
        throw new Error(`Vendor with phone ${vendorPhoneNumber} not found in database.`);
      }

      // 2. Fetch customer record
      const customer = await prisma.customer.findUnique({
        where: {
          vendorId_phoneNumber: {
            vendorId: vendor.id,
            phoneNumber: customerPhoneNumber,
          },
        },
      });

      if (!customer) {
        throw new Error(`Customer ${customerPhoneNumber} not found in database.`);
      }

      // 3. Fetch chat history (last 10 messages)
      const historyRecords = await prisma.message.findMany({
        where: { customerId: customer.id },
        orderBy: { timestamp: 'desc' },
        take: 10,
      });

      const history = historyRecords
        .reverse()
        .map((m) => ({
          content: m.content,
          sender: m.sender,
        }));

      // 4. Fetch product catalog for this vendor
      const catalog = await prisma.product.findMany({
        where: { vendorId: vendor.id },
        select: {
          name: true,
          sku: true,
          price: true,
          stock: true,
        },
      });

      // 5. Query OpenAI for analysis and draft suggestions
      const aiResult = await analyzeIncomingMessage(content, history, catalog);

      // Log the message in the Customer's history
      await prisma.message.create({
        data: {
          customerId: customer.id,
          content: aiResult.proposedReply,
          sender: 'VENDOR', // Logged as suggested vendor response
          isMedia: false,
        },
      });

      // 6. Save the Suggestion to the database
      const suggestion = await prisma.suggestion.create({
        data: {
          vendorId: vendor.id,
          customerPhoneNumber: customerPhoneNumber,
          proposedReply: aiResult.proposedReply,
          proposedActions: JSON.stringify(aiResult.proposedActions),
          status: 'PENDING',
        },
      });

      // 7. Format the notification message for the Vendor
      let actionDetailsText = '';
      if (aiResult.proposedActions && aiResult.proposedActions.length > 0) {
        const orderActions = aiResult.proposedActions.filter((a) => a.type === 'CREATE_ORDER');
        if (orderActions.length > 0) {
          actionDetailsText = '\n*Proposed CRM Actions:*\n';
          orderActions.forEach((action) => {
            if (action.items) {
              action.items.forEach((item) => {
                actionDetailsText += `• Create Order: ${item.quantity}x ${item.productName}\n`;
              });
            }
          });
        }
      }

      const vendorNotificationText = 
        `🤖 *New Message from ${customer.name || customerPhoneNumber}*\n` +
        `"${content}"\n\n` +
        `*Suggested Reply:*\n` +
        `"${aiResult.proposedReply}"\n` +
        `${actionDetailsText}\n` +
        `*Reply with:*\n` +
        `• *1* to Approve and Send suggested reply\n` +
        `• *2* to Approve Action only (no reply)\n` +
        `• *3* to Reject suggestion\n` +
        `• *edit [custom text]* to send a modified message`;

      // 8. Forward draft options to Vendor's WhatsApp
      await sendMessage(vendorPhoneNumber, vendorNotificationText);
      console.log(`[Worker] Draft suggestion forwarded to vendor for approval.`);

    } catch (error) {
      console.error(`[Worker] Error processing job ${job.id}:`, error);
      throw error; // Re-throw to trigger BullMQ retry
    }
  },
  {
    connection: getRedisConnection(),
    concurrency: 1, // Process one message at a time to prevent database race conditions
  }
);

messageWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully.`);
});

messageWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed with error:`, err);
});
