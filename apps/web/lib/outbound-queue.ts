import { Queue, Worker, Job } from 'bullmq';
import { getBullMqConnection } from './redis';
import { deliverTextMessage } from './openwa-client';

export const OUTBOUND_QUEUE_NAME = 'outbound-messages';

export interface OutboundMessageJob {
  chatId: string;
  text: string;
}

export const outboundQueue = new Queue<OutboundMessageJob>(OUTBOUND_QUEUE_NAME, {
  connection: getBullMqConnection(),
});

export async function enqueueOutboundMessage(chatId: string, text: string): Promise<void> {
  await outboundQueue.add(
    'send-text',
    { chatId, text },
    {
      attempts: 12,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: 200,
    }
  );
  console.log(`[Outbound Queue] Queued message for ${chatId} (${text.length} chars)`);
}

export async function getOutboundPendingCount(): Promise<number> {
  const counts = await outboundQueue.getJobCounts('waiting', 'delayed', 'active');
  return (counts.waiting ?? 0) + (counts.delayed ?? 0) + (counts.active ?? 0);
}

/** Promote delayed jobs so reconnect flushes the backlog faster. */
export async function promoteOutboundBacklog(): Promise<number> {
  const delayed = await outboundQueue.getDelayed(0, 100);
  await Promise.all(delayed.map((job) => job.promote()));
  if (delayed.length > 0) {
    console.log(`[Outbound Queue] Promoted ${delayed.length} delayed message(s) after reconnect`);
  }
  return delayed.length;
}

export const outboundWorker = new Worker<OutboundMessageJob>(
  OUTBOUND_QUEUE_NAME,
  async (job: Job<OutboundMessageJob>) => {
    const { chatId, text } = job.data;
    await deliverTextMessage(chatId, text);
    console.log(`[Outbound Queue] Delivered message to ${chatId}`);
  },
  {
    connection: getBullMqConnection(),
    concurrency: 2,
  }
);

outboundWorker.on('failed', (job, err) => {
  console.warn(
    `[Outbound Queue] Job ${job?.id} failed (attempt ${job?.attemptsMade}):`,
    err instanceof Error ? err.message : err
  );
});
