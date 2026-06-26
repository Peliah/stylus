import { Queue } from 'bullmq';
import { getRedisConnection } from './redis';

export const QUEUE_NAME = 'message-processing';

// Initialize the BullMQ queue with a shared Redis connection
export const messageQueue = new Queue(QUEUE_NAME, {
  connection: getRedisConnection(),
});

export const addMessageJob = async (data: {
  messageId: string;
  customerPhoneNumber: string;
  vendorPhoneNumber: string;
  content: string;
  isMedia: boolean;
}) => {
  await messageQueue.add('process-incoming-message', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  });
};
export default messageQueue;
